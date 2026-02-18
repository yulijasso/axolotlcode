"use strict";

const STORAGE_KEY = "axolotl_sessions";

export function getSessions() {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
        return [];
    }
}

export function getSession(id) {
    return getSessions().find((s) => s.id === id) || null;
}

export function createSession({ name = "Untitled Session", languageId = 54, flavor = "CE", languageName = "C++", code = "", stdin = "", compilerOptions = "", cmdArguments = "" } = {}) {
    const sessions = getSessions();
    const session = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
        name,
        languageId,
        flavor,
        languageName,
        code,
        stdin,
        compilerOptions,
        cmdArguments,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    sessions.unshift(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return session;
}

export function updateSession(id, updates) {
    const sessions = getSessions();
    const idx = sessions.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    sessions[idx] = { ...sessions[idx], ...updates, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return sessions[idx];
}

export function deleteSession(id) {
    const sessions = getSessions().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function renameSession(id, name) {
    return updateSession(id, { name });
}
