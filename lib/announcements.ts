import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'announcements-read';

// How long a read announcement stays visible, by severity.
const KEEP_HOURS = { info: 0, warning: 24, critical: 72 };

export async function readMap() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function markRead(id) {
  const map = await readMap();
  if (map[id]) return map;
  const next = { ...map, [id]: new Date().toISOString() };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

// Pinned never expires. Unread never expires. Read expires by severity.
export function visible(list, readAt, now = new Date()) {
  return (list ?? []).filter((a) => {
    if (a.pinned) return true;
    const read = readAt?.[a.id];
    if (!read) return true;
    const keep = KEEP_HOURS[a.severity] ?? 0;
    if (keep === 0) return false;
    return (now - new Date(read)) / 3600000 < keep;
  });
}

export function unreadCount(list, readAt) {
  return (list ?? []).filter((a) => !readAt?.[a.id]).length;
}
