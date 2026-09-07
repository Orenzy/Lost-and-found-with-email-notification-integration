import { readList, readValue, writeList } from "./store";

const KEY = "notifications";

export function addNotification({ userEmail = "", type, title, message, relatedId = "" }) {
  if (!title || !message) return null;
  const notification = {
    id: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userEmail: String(userEmail || "").trim().toLowerCase(),
    type: type || "INFO",
    title,
    message,
    relatedId,
    read: false,
    createdAt: new Date().toISOString(),
  };
  const existing = readList(KEY);
  writeList(KEY, [notification, ...existing].slice(0, 200));
  window.dispatchEvent(new CustomEvent("lostfound:notifications"));
  return notification;
}

export function getNotificationsForCurrentUser() {
  const user = readValue("currentUser", null);
  const email = String(user?.email || "").trim().toLowerCase();
  if (!email) return [];
  return readList(KEY).filter((item) => String(item.userEmail || "").toLowerCase() === email);
}

export function markNotificationRead(id) {
  const next = readList(KEY).map((item) => String(item.id) === String(id) ? { ...item, read: true, readAt: new Date().toISOString() } : item);
  writeList(KEY, next);
  window.dispatchEvent(new CustomEvent("lostfound:notifications"));
}

export function markAllNotificationsRead() {
  const user = readValue("currentUser", null);
  const email = String(user?.email || "").trim().toLowerCase();
  const next = readList(KEY).map((item) =>
    String(item.userEmail || "").toLowerCase() === email ? { ...item, read: true, readAt: item.readAt || new Date().toISOString() } : item
  );
  writeList(KEY, next);
  window.dispatchEvent(new CustomEvent("lostfound:notifications"));
}
