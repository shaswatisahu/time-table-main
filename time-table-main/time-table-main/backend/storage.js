import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.resolve("backend/data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const DEFAULT_DB = {
  users: [],
  userData: {},
};

const ensureDb = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), "utf8");
  }
};

const loadDb = async () => {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return { ...DEFAULT_DB };
  }
};

const saveDb = async (db) => {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
};

export const getUserByEmail = async (email) => {
  const db = await loadDb();
  return db.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
};

export const getUserById = async (id) => {
  const db = await loadDb();
  return db.users.find((user) => user.id === id) || null;
};

export const createUser = async ({ id, name, email, passwordHash }) => {
  const db = await loadDb();
  db.users.push({
    id,
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  });
  db.userData[id] = db.userData[id] || {
    tasks: [],
    stats: null,
    profileImage: null,
    reminderEnabled: false,
    reminderTone: null,
  };
  await saveDb(db);
};

export const getStoredUserData = async (userId) => {
  const db = await loadDb();
  const existing = db.userData[userId];
  if (!existing) {
    return {
      tasks: [],
      stats: null,
      profileImage: null,
      reminderEnabled: false,
      reminderTone: null,
    };
  }
  return {
    tasks: Array.isArray(existing.tasks) ? existing.tasks : [],
    stats: existing.stats || null,
    profileImage: existing.profileImage || null,
    reminderEnabled: Boolean(existing.reminderEnabled),
    reminderTone: existing.reminderTone || null,
  };
};

export const setStoredUserData = async (
  userId,
  { tasks, stats, profileImage, reminderEnabled, reminderTone }
) => {
  const db = await loadDb();
  const previous = db.userData[userId] || {
    tasks: [],
    stats: null,
    profileImage: null,
    reminderEnabled: false,
    reminderTone: null,
  };
  db.userData[userId] = {
    tasks: Array.isArray(tasks) ? tasks : previous.tasks,
    stats: stats || previous.stats || null,
    profileImage: profileImage ?? previous.profileImage ?? null,
    reminderEnabled:
      typeof reminderEnabled === "boolean" ? reminderEnabled : Boolean(previous.reminderEnabled),
    reminderTone: reminderTone ?? previous.reminderTone ?? null,
    updatedAt: new Date().toISOString(),
  };
  await saveDb(db);
  return db.userData[userId];
};
