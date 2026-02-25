import crypto from "crypto";
import fs from "fs";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Modality } from "@google/genai";
import {
  createUser,
  getStoredUserData,
  getUserByEmail,
  getUserById,
  setStoredUserData,
} from "./storage.js";

dotenv.config({ path: "backend/.env" });
dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 8787;
const clientOrigin =
  process.env.CLIENT_ORIGIN || process.env.RENDER_EXTERNAL_URL || "http://localhost:3000";
const apiKey = process.env.GEMINI_API_KEY;
const jwtSecret = process.env.JWT_SECRET || "change_this_in_backend_env";
const allowedOrigins = clientOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
  })
);
app.use(express.json({ limit: "25mb" }));

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

const createAuthToken = (user) =>
  jwt.sign({ userId: user.id, email: user.email }, jwtSecret, { expiresIn: "30d" });

const authRequired = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await getUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "my-performance-hub-backend",
    geminiConfigured: Boolean(apiKey),
  });
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "password must be at least 6 characters" });
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();
  await createUser({ id: userId, name, email, passwordHash });
  const user = await getUserById(userId);
  const token = createAuthToken(user);
  const data = await getStoredUserData(userId);

  return res.status(201).json({
    token,
    user: sanitizeUser(user),
    data,
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = createAuthToken(user);
  const data = await getStoredUserData(user.id);

  return res.json({
    token,
    user: sanitizeUser(user),
    data,
  });
});

app.get("/api/auth/me", authRequired, async (req, res) => {
  return res.json({ user: sanitizeUser(req.user) });
});

app.get("/api/user/data", authRequired, async (req, res) => {
  const data = await getStoredUserData(req.user.id);
  return res.json({ data });
});

app.put("/api/user/data", authRequired, async (req, res) => {
  const { tasks, stats, profileImage, reminderEnabled, reminderTone } = req.body || {};
  const data = await setStoredUserData(req.user.id, {
    tasks,
    stats,
    profileImage,
    reminderEnabled,
    reminderTone,
  });
  return res.json({ data });
});

const ensureAiConfigured = (res) => {
  if (!ai) {
    res.status(500).json({
      error: "Backend is missing GEMINI_API_KEY. Set it in Render env or backend/.env.",
    });
    return false;
  }
  return true;
};

app.post("/api/chat", async (req, res) => {
  const {
    message,
    history = [],
    useThinking = false,
    useGrounding = "none",
    imagePart,
  } = req.body || {};

  if (!message && !imagePart) {
    return res.status(400).json({ error: "message or imagePart is required" });
  }
  if (!ensureAiConfigured(res)) return;

  try {
    const model = useThinking ? "gemini-3-pro-preview" : "gemini-3-flash-preview";
    const config = {};

    if (useThinking) {
      config.thinkingConfig = { thinkingBudget: 32768 };
    }

    const tools = [];
    if (useGrounding === "search") tools.push({ googleSearch: {} });
    if (useGrounding === "maps") tools.push({ googleMaps: {} });
    if (tools.length > 0) config.tools = tools;

    const parts = [];
    if (imagePart) {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: imagePart } });
    }
    if (message) {
      parts.push({ text: message });
    }

    const contents = [...history, { role: "user", parts }];

    const response = await ai.models.generateContent({
      model,
      contents,
      config,
    });

    const text = response.text || "I couldn't generate a text response.";
    const grounding = response.candidates?.[0]?.groundingMetadata;

    let audioData;
    try {
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text.substring(0, 500) }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
        },
      });
      audioData = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (err) {
      console.warn("TTS generation failed", err);
    }

    return res.json({ text, audio: audioData, grounding });
  } catch (error) {
    console.error("Chat Error:", error);
    return res.status(500).json({ error: "Failed to process chat request" });
  }
});

app.post("/api/transcribe", async (req, res) => {
  const { base64Audio } = req.body || {};
  if (!base64Audio) {
    return res.status(400).json({ error: "base64Audio is required" });
  }
  if (!ensureAiConfigured(res)) return;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "audio/wav", data: base64Audio } },
          { text: "Transcribe this audio exactly." },
        ],
      },
    });

    return res.json({ text: response.text || "" });
  } catch (error) {
    console.error("Transcription Error:", error);
    return res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

app.post("/api/image/generate", async (req, res) => {
  const { prompt, aspectRatio, size } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" });
  }
  if (!ensureAiConfigured(res)) return;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio,
          imageSize: size,
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        return res.json({ url: `data:image/png;base64,${part.inlineData.data}` });
      }
    }

    return res.status(500).json({ error: "No image data returned" });
  } catch (error) {
    console.error("Image Gen Error:", error);
    return res.status(500).json({ error: "Failed to generate image" });
  }
});

app.post("/api/video/generate", async (req, res) => {
  const { prompt, aspectRatio } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" });
  }
  if (!ensureAiConfigured(res)) return;

  try {
    let operation = await ai.models.generateVideos({
      model: "veo-3.1-fast-generate-preview",
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: "720p",
        aspectRatio,
      },
    });

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      return res.status(500).json({ error: "Video generation failed" });
    }

    return res.json({ url: `${videoUri}&key=${apiKey}` });
  } catch (error) {
    console.error("Video Gen Error:", error);
    return res.status(500).json({ error: "Failed to generate video" });
  }
});

app.post("/api/image/edit", async (req, res) => {
  const { base64Image, prompt } = req.body || {};
  if (!base64Image || !prompt) {
    return res.status(400).json({ error: "base64Image and prompt are required" });
  }
  if (!ensureAiConfigured(res)) return;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: "image/png" } },
          { text: prompt },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        return res.json({ url: `data:image/png;base64,${part.inlineData.data}` });
      }
    }

    return res.status(500).json({ error: "No edited image returned" });
  } catch (error) {
    console.error("Image Edit Error:", error);
    return res.status(500).json({ error: "Failed to edit image" });
  }
});

app.post("/api/insights", async (req, res) => {
  const { stats, tasks } = req.body || {};
  if (!ensureAiConfigured(res)) return;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite-latest",
      contents: `Analyze: ${JSON.stringify(stats)}. Tasks: ${Array.isArray(tasks) ? tasks.length : 0}. Give 3 short tips.`,
    });

    return res.json({ text: response.text || "No insights available." });
  } catch (error) {
    console.error("Insights Error:", error);
    return res.status(500).json({ error: "Failed to generate insights" });
  }
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, { index: false }));

  app.get(/^(?!\/api).*/, (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    // Don't serve index.html for missing files like /assets/*.js or /favicon.ico.
    // Returning HTML for JS requests causes a blank app due to module MIME errors.
    if (req.path.includes(".")) {
      return res.status(404).end();
    }
    return res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
  if (process.env.RENDER_EXTERNAL_URL) {
    console.log(`Render URL: ${process.env.RENDER_EXTERNAL_URL}`);
  }
});
