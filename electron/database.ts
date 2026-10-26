import path from 'path';
import fs from 'fs';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

export interface NoteRecord {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  voiceRecordings?: any[];
}

export interface DatabaseStats {
  filePath: string;
  fileSizeBytes: number;
  totalNotes: number;
  totalVoiceRecordings: number;
  engine: string;
}

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let sqliteFilePath = '';

function getSqlWasmPath(): string {
  const candidates = [
    path.join(__dirname, 'sql-wasm.wasm'),
    path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm'),
    path.join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm'),
    path.join(process.cwd(), 'dist-electron/sql-wasm.wasm'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

/**
 * Initializes the SQLite Database engine and loads or creates aura_notes.sqlite
 */
export async function initDatabase(userDataDir: string): Promise<void> {
  sqliteFilePath = path.join(userDataDir, 'aura_notes.sqlite');

  if (!SQL) {
    const wasmPath = getSqlWasmPath();
    SQL = await initSqlJs({
      locateFile: () => wasmPath,
    });
  }

  // Load existing SQLite database file if it exists
  if (fs.existsSync(sqliteFilePath)) {
    try {
      const fileBuffer = await fs.promises.readFile(sqliteFilePath);
      db = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error('Failed to load existing SQLite database, creating new:', err);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Ensure tables and indexes are initialized
  createTables();

  // Automatic legacy migration: if JSON store exists but SQLite has 0 rows, migrate data
  await migrateFromJsonStoreIfEmpty(userDataDir);
}

function createTables(): void {
  if (!db) return;

  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      tags TEXT NOT NULL DEFAULT '[]',
      is_pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      voice_recordings TEXT NOT NULL DEFAULT '[]'
    );

    CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned DESC);
    CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category);
  `);
}

async function migrateFromJsonStoreIfEmpty(userDataDir: string): Promise<void> {
  if (!db) return;

  const res = db.exec('SELECT COUNT(*) FROM notes');
  const count = res.length > 0 && res[0].values.length > 0 ? (res[0].values[0][0] as number) : 0;
  if (count > 0) return;

  const legacyJsonPath = path.join(userDataDir, 'aura_notes_store.json');
  if (fs.existsSync(legacyJsonPath)) {
    try {
      const raw = await fs.promises.readFile(legacyJsonPath, 'utf-8');
      const legacyNotes = JSON.parse(raw);
      if (Array.isArray(legacyNotes) && legacyNotes.length > 0) {
        console.log(`Migrating ${legacyNotes.length} legacy notes into SQLite...`);
        await saveAllNotes(legacyNotes);
      }
    } catch (err) {
      console.warn('Legacy JSON migration skipped:', err);
    }
  }
}

/**
 * Loads all notes from SQLite ordered by is_pinned then updated_at
 */
export function loadAllNotes(): NoteRecord[] {
  if (!db) return [];

  try {
    const res = db.exec(`
      SELECT id, title, content, category, tags, is_pinned, created_at, updated_at, voice_recordings
      FROM notes
      ORDER BY is_pinned DESC, updated_at DESC
    `);

    if (res.length === 0 || !res[0].values) return [];

    return res[0].values.map((row) => {
      let tags: string[] = [];
      try {
        tags = JSON.parse((row[4] as string) || '[]');
      } catch {
        tags = [];
      }

      let voiceRecordings: any[] = [];
      try {
        voiceRecordings = JSON.parse((row[8] as string) || '[]');
      } catch {
        voiceRecordings = [];
      }

      return {
        id: String(row[0]),
        title: String(row[1] || ''),
        content: String(row[2] || ''),
        category: String(row[3] || 'General'),
        tags,
        isPinned: Boolean(row[5]),
        createdAt: String(row[6]),
        updatedAt: String(row[7]),
        voiceRecordings,
      };
    });
  } catch (err) {
    console.error('SQLite query error in loadAllNotes:', err);
    return [];
  }
}

/**
 * Saves all notes into SQLite using an atomic transaction and persists the binary database file
 */
export async function saveAllNotes(notes: NoteRecord[]): Promise<{ success: boolean; filePath: string; count: number }> {
  if (!db) {
    throw new Error('SQLite database is not initialized');
  }

  try {
    db.run('BEGIN TRANSACTION;');
    db.run('DELETE FROM notes;');

    const stmt = db.prepare(`
      INSERT INTO notes (
        id, title, content, category, tags, is_pinned, created_at, updated_at, voice_recordings
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const note of notes) {
      stmt.run([
        note.id,
        note.title || 'Untitled Note',
        note.content || '',
        note.category || 'General',
        JSON.stringify(note.tags || []),
        note.isPinned ? 1 : 0,
        note.createdAt || new Date().toISOString(),
        note.updatedAt || new Date().toISOString(),
        JSON.stringify(note.voiceRecordings || []),
      ]);
    }

    stmt.free();
    db.run('COMMIT;');

    // Export database binary and write to aura_notes.sqlite
    const binary = db.export();
    await fs.promises.writeFile(sqliteFilePath, Buffer.from(binary));

    return { success: true, filePath: sqliteFilePath, count: notes.length };
  } catch (err) {
    try {
      db.run('ROLLBACK;');
    } catch {}
    console.error('Failed to save notes to SQLite:', err);
    throw err;
  }
}

/**
 * Retrieves SQLite database statistics
 */
export function getDatabaseStats(): DatabaseStats {
  let fileSizeBytes = 0;
  if (sqliteFilePath && fs.existsSync(sqliteFilePath)) {
    try {
      fileSizeBytes = fs.statSync(sqliteFilePath).size;
    } catch {}
  }

  let totalNotes = 0;
  let totalVoiceRecordings = 0;

  if (db) {
    try {
      const res = db.exec('SELECT COUNT(*) FROM notes');
      if (res.length > 0 && res[0].values.length > 0) {
        totalNotes = res[0].values[0][0] as number;
      }
    } catch {}

    const all = loadAllNotes();
    totalVoiceRecordings = all.reduce((sum, n) => sum + (n.voiceRecordings?.length || 0), 0);
  }

  return {
    filePath: sqliteFilePath,
    fileSizeBytes,
    totalNotes,
    totalVoiceRecordings,
    engine: 'SQLite 3 (ACID Relational)',
  };
}

/**
 * Closes the SQLite database
 */
export function closeDatabase(): void {
  if (db) {
    try {
      db.close();
    } catch {}
    db = null;
  }
}
