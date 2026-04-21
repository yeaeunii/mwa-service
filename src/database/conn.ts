import Database from 'better-sqlite3'
import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import migrate from './migrate'
import schemaSql from './schema.sql?raw'

let database: Database | null = null
export const getDatabasePath = (): string => join(app.getPath('userData'), 'miso-mwa.db')

export const initDatabase = (): Database => {
  if (database) return database

  
  const dbPath = getDatabasePath()
  const dbDir = dirname(dbPath)

  console.log('dbPath', dbPath)
  
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  database = new Database(dbPath)
  database.pragma('foreign_keys = ON')

  if (app.getVersion() === '0.1.0') {
    database.exec(schemaSql)
  }

  const migrateScript = migrate[app.getVersion()]
  if (migrateScript) {
    database.exec(migrateScript)
  }

  return database
}

export const getDatabase = (): Database => {
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

export const transaction = <T>(handler: (db: Database) => T): T => {
  const db = getDatabase()
  const runInTransaction = db.transaction(() => handler(db))
  return runInTransaction()
}
