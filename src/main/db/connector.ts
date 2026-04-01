import Database from 'better-sqlite3'
import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import schemaSql from './schema.sql?raw'

const SCHEMA_VERSION = 6

let database: Database.Database | null = null

export const getDatabasePath = (): string => join(app.getPath('userData'), 'miso-mwa.db')

const migrateDatabase = (db: Database.Database, currentSchemaVersion: number): void => {
  if (currentSchemaVersion === 0) {
    db.exec(schemaSql)
    return
  }

  if (currentSchemaVersion < 4) {
    db.exec(`
      ALTER TABLE folders ADD COLUMN path TEXT NOT NULL DEFAULT '';
      ALTER TABLE folders ADD COLUMN description TEXT NOT NULL DEFAULT '';
    `)
  }

  if (currentSchemaVersion < 5) {
    db.exec(`
      PRAGMA foreign_keys = OFF;

      ALTER TABLE folders RENAME TO folders_legacy;

      CREATE TABLE folders (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        path TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        area_type TEXT NOT NULL DEFAULT 'capture'
          CHECK (area_type IN ('capture', 'document')),
        sort_order INTEGER NOT NULL DEFAULT 0,
        delete_yn TEXT NOT NULL DEFAULT 'N'
          CHECK (delete_yn IN ('Y', 'N')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      INSERT INTO folders (
        id,
        project_id,
        title,
        path,
        description,
        area_type,
        sort_order,
        delete_yn,
        created_at,
        updated_at
      )
      SELECT
        id,
        project_id,
        title,
        COALESCE(path, ''),
        COALESCE(description, ''),
        area_type,
        sort_order,
        delete_yn,
        created_at,
        updated_at
      FROM folders_legacy;

      DROP TABLE folders_legacy;

      CREATE INDEX idx_folders_project_id
        ON folders(project_id);

      CREATE INDEX idx_folders_project_delete_yn
        ON folders(project_id, delete_yn);

      CREATE UNIQUE INDEX uq_folders_project_area_title_active
        ON folders(project_id, area_type, title)
        WHERE delete_yn = 'N';

      CREATE TRIGGER trg_folders_updated_at
      AFTER UPDATE ON folders
      FOR EACH ROW
      BEGIN
        UPDATE folders
        SET updated_at = datetime('now')
        WHERE id = NEW.id;
      END;

      PRAGMA foreign_keys = ON;
      PRAGMA user_version = 5;
    `)
  }

  if (currentSchemaVersion < 6) {
    db.exec(`
      PRAGMA foreign_keys = OFF;

      CREATE TABLE captures_new (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        folder_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        image_path TEXT NOT NULL,
        source_url TEXT NOT NULL DEFAULT '',
        page_title TEXT NOT NULL DEFAULT '',
        menu_path TEXT NOT NULL DEFAULT '',
        screen_description TEXT NOT NULL DEFAULT '',
        functionality_description TEXT NOT NULL DEFAULT '',
        writer_name TEXT NOT NULL DEFAULT '',
        page_no INTEGER NOT NULL DEFAULT 1,
        mime_type TEXT NOT NULL DEFAULT 'image/png',
        width INTEGER,
        height INTEGER,
        file_size INTEGER,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_selected INTEGER NOT NULL DEFAULT 0
          CHECK (is_selected IN (0, 1)),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
      );

      INSERT INTO captures_new (
        id,
        project_id,
        folder_id,
        file_name,
        image_path,
        source_url,
        page_title,
        menu_path,
        screen_description,
        functionality_description,
        writer_name,
        page_no,
        mime_type,
        width,
        height,
        file_size,
        sort_order,
        is_selected,
        created_at,
        updated_at
      )
      SELECT
        id,
        project_id,
        folder_id,
        file_name,
        image_path,
        source_url,
        page_title,
        menu_path,
        screen_description,
        functionality_description,
        writer_name,
        page_no,
        COALESCE(mime_type, 'image/png'),
        width,
        height,
        file_size,
        sort_order,
        is_selected,
        created_at,
        updated_at
      FROM captures;

      DROP TABLE captures;

      ALTER TABLE captures_new RENAME TO captures;

      CREATE INDEX idx_captures_project_folder
        ON captures(project_id, folder_id);

      CREATE INDEX idx_captures_selected
        ON captures(project_id, is_selected);

      CREATE INDEX idx_captures_image_path
        ON captures(image_path);

      CREATE TRIGGER trg_captures_updated_at
      AFTER UPDATE ON captures
      FOR EACH ROW
      BEGIN
        UPDATE captures
        SET updated_at = datetime('now')
        WHERE id = NEW.id;
      END;

      PRAGMA foreign_keys = ON;
      PRAGMA user_version = 6;
    `)
  }
}

export const initDatabase = (): Database.Database => {
  if (database) return database

  const dbPath = getDatabasePath()
  const dbDir = dirname(dbPath)

  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  database = new Database(dbPath)
  database.pragma('foreign_keys = ON')
  const currentSchemaVersion = Number(database.pragma('user_version', { simple: true }) ?? 0)

  if (currentSchemaVersion < SCHEMA_VERSION) {
    migrateDatabase(database, currentSchemaVersion)
  }

  return database
}

export const getDatabase = (): Database.Database => {
  if (!database) {
    return initDatabase()
  }

  return database
}

export const closeDatabase = (): void => {
  if (!database) return

  database.close()
  database = null
}

export const selectList = <T = Record<string, unknown>>(
  query: string,
  params?: Record<string, unknown> | unknown[]
): T[] => {
  const db = getDatabase()
  const statement = db.prepare(query)

  if (!params) {
    return statement.all() as T[]
  }

  if (Array.isArray(params)) {
    return statement.all(...params) as T[]
  }

  return statement.all(params) as T[]
}

export const selectOne = <T = Record<string, unknown>>(
  query: string,
  params?: Record<string, unknown> | unknown[]
): T | null => {
  const db = getDatabase()
  const statement = db.prepare(query)

  let row: unknown
  if (!params) {
    row = statement.get()
  } else if (Array.isArray(params)) {
    row = statement.get(...params)
  } else {
    row = statement.get(params)
  }

  return (row as T | undefined) ?? null
}

export const runQuery = (
  query: string,
  params?: Record<string, unknown> | unknown[]
): Database.RunResult => {
  const db = getDatabase()
  const statement = db.prepare(query)

  if (!params) {
    return statement.run()
  }

  if (Array.isArray(params)) {
    return statement.run(...params)
  }

  return statement.run(params)
}

export const transaction = <T>(handler: (db: Database.Database) => T): T => {
  const db = getDatabase()
  const runInTransaction = db.transaction(() => handler(db))
  return runInTransaction()
}
