import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

interface AuthSession {
  token: string;
  userId: string;
  expiresAt: number;
}

const SESSION_COOKIE_NAME = "recruitai_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

const getUserFilePath = (): string => path.join(process.cwd(), ".data", "users.json");

const getSessionStore = (): Map<string, AuthSession> => {
  const key = "__recruitai_auth_sessions__";
  const globalScope = globalThis as typeof globalThis & {
    [storeKey: string]: Map<string, AuthSession> | undefined;
  };

  if (!globalScope[key]) {
    globalScope[key] = new Map<string, AuthSession>();
  }

  return globalScope[key];
};

const readUsers = async (): Promise<AuthUser[]> => {
  const filePath = getUserFilePath();

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as AuthUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeUsers = async (users: AuthUser[]): Promise<void> => {
  const filePath = getUserFilePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(users, null, 2), "utf8");
};

const derivePasswordHash = (password: string, salt: string): string => {
  return scryptSync(password, salt, 64).toString("hex");
};

export const registerUser = async (name: string, email: string, password: string): Promise<AuthUser> => {
  const users = await readUsers();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((u) => u.email === normalizedEmail)) {
    throw new Error("Email already registered");
  }

  const salt = randomUUID();
  const user: AuthUser = {
    id: randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    salt,
    passwordHash: derivePasswordHash(password, salt),
    createdAt: new Date().toISOString()
  };

  users.push(user);
  await writeUsers(users);
  return user;
};

export const loginUser = async (email: string, password: string): Promise<AuthUser | null> => {
  const users = await readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const found = users.find((u) => u.email === normalizedEmail);

  if (!found) {
    return null;
  }

  const actual = Buffer.from(found.passwordHash, "hex");
  const expected = Buffer.from(derivePasswordHash(password, found.salt), "hex");

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  return found;
};

export const createSessionToken = (userId: string): string => {
  const token = randomUUID();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  getSessionStore().set(token, { token, userId, expiresAt });
  return token;
};

export const destroySessionToken = (token: string): void => {
  getSessionStore().delete(token);
};

export const getSessionCookieName = (): string => SESSION_COOKIE_NAME;

export const getUserIdFromRequest = (request: NextRequest): string | null => {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const session = getSessionStore().get(token);
  if (!session) {
    return null;
  }

  if (Date.now() > session.expiresAt) {
    getSessionStore().delete(token);
    return null;
  }

  return session.userId;
};

export const getPublicUserById = async (userId: string): Promise<{ id: string; name: string; email: string } | null> => {
  const users = await readUsers();
  const found = users.find((u) => u.id === userId);
  if (!found) {
    return null;
  }

  return { id: found.id, name: found.name, email: found.email };
};
