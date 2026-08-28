import AsyncStorage from '@react-native-async-storage/async-storage';
import { submitIncident } from './api';

const KEY = 'incident-queue';

async function read() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function write(list) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function pendingCount() {
  return (await read()).length;
}

export async function enqueue(payload) {
  const list = await read();
  list.push({ payload, tries: 0, addedAt: new Date().toISOString() });
  await write(list);
}

// Returns { sent, failed } — drains the queue, keeping anything that still fails.
export async function flush() {
  const list = await read();
  if (!list.length) return { sent: 0, failed: 0 };

  const keep = [];
  let sent = 0;

  for (const entry of list) {
    try {
      await submitIncident(entry.payload);
      sent += 1;
    } catch {
      entry.tries += 1;
      if (entry.tries < 20) keep.push(entry);
    }
  }

  await write(keep);
  return { sent, failed: keep.length };
}
