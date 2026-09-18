import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { mentors as sampleMentors } from './data/mentors.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DB_PATH || path.join(here, '..', 'storage', 'menthers.db')

fs.mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

// List-type answers (fields, skills, formats, frequencies) are stored as JSON text.
db.exec(`
  CREATE TABLE IF NOT EXISTS mentors (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE,
    title       TEXT NOT NULL,
    company     TEXT NOT NULL,
    bio         TEXT NOT NULL,
    stage       TEXT,
    fields      TEXT NOT NULL,
    skills      TEXT NOT NULL,
    formats     TEXT NOT NULL,
    frequencies TEXT NOT NULL,
    approach    TEXT NOT NULL,
    timezone    TEXT,
    motivation  TEXT,
    is_sample   INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`)

const insertMentor = db.prepare(`
  INSERT INTO mentors
    (name, email, title, company, bio, stage, fields, skills, formats, frequencies,
     approach, timezone, motivation, is_sample)
  VALUES
    (@name, @email, @title, @company, @bio, @stage, @fields, @skills, @formats, @frequencies,
     @approach, @timezone, @motivation, @is_sample)
`)

const toRow = (mentor, isSample) => ({
  name: mentor.name,
  email: mentor.email ?? null,
  title: mentor.title,
  company: mentor.company,
  bio: mentor.bio,
  stage: mentor.stage ?? null,
  fields: JSON.stringify(mentor.fields),
  skills: JSON.stringify(mentor.skills),
  formats: JSON.stringify(mentor.formats),
  frequencies: JSON.stringify(mentor.frequencies),
  approach: mentor.approach,
  timezone: mentor.timezone ?? null,
  motivation: mentor.motivation ?? null,
  is_sample: isSample ? 1 : 0,
})

// Fill an empty database with the sample mentors so the app has something to match against.
if (db.prepare('SELECT COUNT(*) AS count FROM mentors').get().count === 0) {
  const seed = db.transaction(() => {
    for (const mentor of sampleMentors) insertMentor.run(toRow(mentor, true))
  })
  seed()
}

const fromRow = (row) => ({
  id: row.id,
  name: row.name,
  title: row.title,
  company: row.company,
  bio: row.bio,
  fields: JSON.parse(row.fields),
  skills: JSON.parse(row.skills),
  formats: JSON.parse(row.formats),
  frequencies: JSON.parse(row.frequencies),
  approach: row.approach,
  sample: row.is_sample === 1,
})

export function listMentors() {
  return db.prepare('SELECT * FROM mentors').all().map(fromRow)
}

// Returns the new mentor's id, or null if the email is already registered.
export function createMentor(mentor) {
  try {
    return insertMentor.run(toRow(mentor, false)).lastInsertRowid
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return null
    throw error
  }
}
