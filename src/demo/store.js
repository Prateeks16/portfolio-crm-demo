/**
 * In-memory demo database, persisted per-visitor to localStorage.
 *
 * Each visitor gets their own copy seeded on first load, so they can create,
 * edit and delete freely without affecting anyone else. Clearing the key (or
 * the "Reset demo data" button) restores the seed.
 */

import { buildSeed } from './seed';

const KEY = 'crm_demo_db_v1';

let db = null;

const clone = (value) => JSON.parse(JSON.stringify(value));

const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* private mode / quota — state still lives in memory for this session */
  }
};

export const getDb = () => {
  if (db) return db;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      db = JSON.parse(raw);
      return db;
    }
  } catch {
    /* fall through to a fresh seed */
  }
  db = buildSeed();
  persist();
  return db;
};

export const save = () => persist();

export const resetDb = () => {
  db = buildSeed();
  persist();
  return db;
};

export const nextId = (name) => {
  const d = getDb();
  d._seq[name] = (d._seq[name] || 0) + 1;
  return d._seq[name];
};

export { clone };
