import crypto from 'node:crypto'
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
db.pragma('foreign_keys = ON')

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
  );

  CREATE TABLE IF NOT EXISTS mentees (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    stage      TEXT,
    fields     TEXT NOT NULL,
    skills     TEXT NOT NULL,
    formats    TEXT NOT NULL,
    frequency  TEXT NOT NULL,
    approach   TEXT NOT NULL,
    timezone   TEXT,
    goals      TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- One request per mentee email per mentor. seen_at is empty until the mentor opens their inbox.
  CREATE TABLE IF NOT EXISTS intro_requests (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    mentor_id    INTEGER NOT NULL REFERENCES mentors(id),
    mentee_id    TEXT NOT NULL REFERENCES mentees(id),
    mentee_email TEXT NOT NULL,
    message      TEXT NOT NULL,
    seen_at      TEXT,
    created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (mentor_id, mentee_email)
  );

  -- One active sign-in code per email. Times are milliseconds since 1970.
  CREATE TABLE IF NOT EXISTS email_codes (
    email      TEXT PRIMARY KEY,
    code_hash  TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    sent_at    INTEGER NOT NULL,
    attempts   INTEGER NOT NULL DEFAULT 0
  );

  -- Signed-in browsers. Only a hash of the session token is stored.
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    email      TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );

  -- Safety reports. Kept even if the reporter later deletes their account.
  CREATE TABLE IF NOT EXISTS reports (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_email TEXT NOT NULL,
    reported_email TEXT NOT NULL,
    request_id     INTEGER,
    reason         TEXT NOT NULL,
    created_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- Proof that someone entered the code sent to an email. Needed to sign up with that email.
  CREATE TABLE IF NOT EXISTS email_verifications (
    token      TEXT PRIMARY KEY,
    email      TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
`)

// Intro requests can be accepted or declined by the mentor. Added with ALTER TABLE for older databases.
const requestColumns = db.prepare('PRAGMA table_info(intro_requests)').all().map((c) => c.name)
if (!requestColumns.includes('status')) {
  db.exec("ALTER TABLE intro_requests ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'")
}
if (!requestColumns.includes('responded_at')) {
  db.exec('ALTER TABLE intro_requests ADD COLUMN responded_at TEXT')
}

// Each mentor has a secret token that opens their private inbox link.
// Added with ALTER TABLE so databases created before this column existed are upgraded too.
const newToken = () => crypto.randomBytes(16).toString('hex')

if (!db.prepare('PRAGMA table_info(mentors)').all().some((column) => column.name === 'token')) {
  db.exec('ALTER TABLE mentors ADD COLUMN token TEXT')
}
const setToken = db.prepare('UPDATE mentors SET token = ? WHERE id = ?')
for (const { id } of db.prepare('SELECT id FROM mentors WHERE token IS NULL').all()) {
  setToken.run(newToken(), id)
}
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_mentors_token ON mentors(token)')

const insertMentor = db.prepare(`
  INSERT INTO mentors
    (name, email, title, company, bio, stage, fields, skills, formats, frequencies,
     approach, timezone, motivation, is_sample, token)
  VALUES
    (@name, @email, @title, @company, @bio, @stage, @fields, @skills, @formats, @frequencies,
     @approach, @timezone, @motivation, @is_sample, @token)
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
  token: newToken(),
})

// Make sure the demo mentors exist, so the app has people to match with. Adds any that are missing
// (existing databases get newly added ones too). Set SEED_SAMPLE_MENTORS=false to turn this off.
if (process.env.SEED_SAMPLE_MENTORS !== 'false') {
  const sampleExists = db.prepare('SELECT 1 FROM mentors WHERE is_sample = 1 AND name = ?')
  const seed = db.transaction(() => {
    for (const mentor of sampleMentors) {
      if (!sampleExists.get(mentor.name)) insertMentor.run(toRow(mentor, true))
    }
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

// ---- Mentors ----

export function listMentors() {
  return db.prepare('SELECT * FROM mentors').all().map(fromRow)
}

// Returns { id, token } for the new mentor, or null if the email is already registered.
export function createMentor(mentor) {
  const row = toRow(mentor, false)
  try {
    const { lastInsertRowid } = insertMentor.run(row)
    return { id: Number(lastInsertRowid), token: row.token }
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return null
    throw error
  }
}

// Used to notify a mentor about a new request. Not sent to mentees.
export function getMentorContact(id) {
  return db.prepare('SELECT id, name, email, token FROM mentors WHERE id = ?').get(id)
}

export function getMentorByToken(token) {
  if (typeof token !== 'string' || token.length !== 32) return undefined
  return db.prepare('SELECT id, name FROM mentors WHERE token = ?').get(token)
}

// ---- Mentees ----

const insertMentee = db.prepare(`
  INSERT INTO mentees
    (id, name, email, stage, fields, skills, formats, frequency, approach, timezone, goals)
  VALUES
    (@id, @name, @email, @stage, @fields, @skills, @formats, @frequency, @approach, @timezone, @goals)
`)

// Every questionnaire submission is saved as a new mentee. Returns the mentee's private id.
export function createMentee(mentee) {
  const id = crypto.randomUUID()
  insertMentee.run({
    id,
    name: mentee.name,
    email: mentee.email,
    stage: mentee.stage,
    fields: JSON.stringify(mentee.fields),
    skills: JSON.stringify(mentee.skills),
    formats: JSON.stringify(mentee.format),
    frequency: mentee.frequency,
    approach: mentee.approach,
    timezone: mentee.timezone,
    goals: mentee.goals,
  })
  return id
}

export function getMentee(id) {
  return db.prepare('SELECT id, name, email FROM mentees WHERE id = ?').get(id)
}

// ---- Intro requests ----

// Mentor ids this email address has already asked for an intro.
export function requestedMentorIds(email) {
  const rows = db.prepare('SELECT mentor_id FROM intro_requests WHERE mentee_email = ?').all(email)
  return new Set(rows.map((row) => row.mentor_id))
}

// Returns 'created', 'duplicate', 'no-mentee' or 'no-mentor'.
export function createIntroRequest({ menteeId, mentorId, message }) {
  const mentee = getMentee(menteeId)
  if (!mentee) return 'no-mentee'
  if (!getMentorContact(mentorId)) return 'no-mentor'

  try {
    db.prepare(
      'INSERT INTO intro_requests (mentor_id, mentee_id, mentee_email, message) VALUES (?, ?, ?, ?)',
    ).run(mentorId, menteeId, mentee.email, message)
    return 'created'
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return 'duplicate'
    throw error
  }
}

export function listRequestsForMentor(mentorId) {
  return db
    .prepare(
      `SELECT r.id,
              r.message,
              r.seen_at IS NULL AS isNew,
              r.status,
              strftime('%Y-%m-%dT%H:%M:%SZ', r.created_at) AS createdAt,
              m.name,
              m.email,
              m.stage,
              m.goals
         FROM intro_requests r
         JOIN mentees m ON m.id = r.mentee_id
        WHERE r.mentor_id = ?
        ORDER BY r.created_at DESC, r.id DESC`,
    )
    .all(mentorId)
    .map((row) => ({ ...row, isNew: row.isNew === 1 }))
}

export function markRequestsSeen(mentorId) {
  db.prepare(
    'UPDATE intro_requests SET seen_at = CURRENT_TIMESTAMP WHERE mentor_id = ? AND seen_at IS NULL',
  ).run(mentorId)
}

// ---- Email verification ----

export function purgeExpiredVerifications(now) {
  db.prepare('DELETE FROM email_codes WHERE expires_at < ?').run(now)
  db.prepare('DELETE FROM email_verifications WHERE expires_at < ?').run(now)
}

export function getEmailCode(email) {
  return db.prepare('SELECT * FROM email_codes WHERE email = ?').get(email)
}

// Replaces any earlier code for this email, and resets the wrong-guess counter.
export function saveEmailCode({ email, codeHash, expiresAt, sentAt }) {
  db.prepare(
    `INSERT INTO email_codes (email, code_hash, expires_at, sent_at, attempts)
     VALUES (?, ?, ?, ?, 0)
     ON CONFLICT(email) DO UPDATE SET
       code_hash = excluded.code_hash,
       expires_at = excluded.expires_at,
       sent_at = excluded.sent_at,
       attempts = 0`,
  ).run(email, codeHash, expiresAt, sentAt)
}

export function addFailedCodeAttempt(email) {
  db.prepare('UPDATE email_codes SET attempts = attempts + 1 WHERE email = ?').run(email)
}

export function deleteEmailCode(email) {
  db.prepare('DELETE FROM email_codes WHERE email = ?').run(email)
}

export function saveVerificationToken(email, token, expiresAt) {
  db.prepare('INSERT INTO email_verifications (token, email, expires_at) VALUES (?, ?, ?)').run(
    token,
    email,
    expiresAt,
  )
}

export function isEmailVerified(email, token, now = Date.now()) {
  if (typeof token !== 'string' || token.length !== 32) return false
  const row = db
    .prepare('SELECT 1 AS ok FROM email_verifications WHERE token = ? AND email = ? AND expires_at > ?')
    .get(token, email, now)
  return row !== undefined
}

// ---- Profiles used by the AI features ----

export function getMenteeProfile(id) {
  const row = db.prepare('SELECT name, stage, fields, skills, goals FROM mentees WHERE id = ?').get(id)
  if (!row) return undefined
  return {
    name: row.name,
    stage: row.stage,
    fields: JSON.parse(row.fields),
    skills: JSON.parse(row.skills),
    goals: row.goals,
  }
}

export function getMentorProfile(id) {
  const row = db.prepare('SELECT * FROM mentors WHERE id = ?').get(id)
  return row ? fromRow(row) : undefined
}

// ---- Accounts and sign-in ----

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

// Starts a signed-in session for an email. Returns the secret token to put in a cookie.
export function createSession(email, now = Date.now()) {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now)
  const token = crypto.randomBytes(32).toString('hex')
  db.prepare('INSERT INTO sessions (token_hash, email, expires_at) VALUES (?, ?, ?)').run(
    hashToken(token),
    email,
    now + SESSION_TTL_MS,
  )
  return token
}

export function getSessionEmail(token, now = Date.now()) {
  if (typeof token !== 'string' || token.length !== 64) return null
  const row = db
    .prepare('SELECT email FROM sessions WHERE token_hash = ? AND expires_at > ?')
    .get(hashToken(token), now)
  return row?.email ?? null
}

export function deleteSession(token) {
  if (typeof token === 'string') {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token))
  }
}

export function hasAccount(email) {
  return (
    db.prepare('SELECT 1 AS ok FROM mentors WHERE email = ?').get(email) !== undefined ||
    db.prepare('SELECT 1 AS ok FROM mentees WHERE email = ?').get(email) !== undefined
  )
}

export function getMentorByEmail(email) {
  return db.prepare('SELECT id, name, title, company FROM mentors WHERE email = ?').get(email)
}

export function getLatestMentee(email) {
  return db
    .prepare('SELECT id, name FROM mentees WHERE email = ? ORDER BY created_at DESC, rowid DESC LIMIT 1')
    .get(email)
}

// Intro requests a mentee has sent. A mentor's email is only revealed once they accept.
export function listSentRequests(email) {
  return db
    .prepare(
      `SELECT r.id,
              r.message,
              r.status,
              strftime('%Y-%m-%dT%H:%M:%SZ', r.created_at) AS createdAt,
              mt.name  AS mentorName,
              mt.title AS mentorTitle,
              mt.company AS mentorCompany,
              CASE WHEN r.status = 'accepted' THEN mt.email END AS mentorEmail
         FROM intro_requests r
         JOIN mentors mt ON mt.id = r.mentor_id
        WHERE r.mentee_email = ?
        ORDER BY r.created_at DESC, r.id DESC`,
    )
    .all(email)
}

// A mentor accepts or declines a pending request. Returns details for the notification email,
// or null if that request isn't theirs or was already answered.
export function respondToRequest(requestId, mentorId, status) {
  const row = db
    .prepare(
      `SELECT r.id, r.mentee_email AS menteeEmail, mt.name AS menteeName,
              m.name AS mentorName, m.email AS mentorEmail
         FROM intro_requests r
         JOIN mentees mt ON mt.id = r.mentee_id
         JOIN mentors m ON m.id = r.mentor_id
        WHERE r.id = ? AND r.mentor_id = ? AND r.status = 'pending'`,
    )
    .get(requestId, mentorId)
  if (!row) return null

  db.prepare(
    "UPDATE intro_requests SET status = ?, responded_at = CURRENT_TIMESTAMP, seen_at = COALESCE(seen_at, CURRENT_TIMESTAMP) WHERE id = ?",
  ).run(status, requestId)
  return row
}

// ---- Safety ----

// Who is on each side of a request, so a report can be checked and attributed.
export function getRequestParties(requestId) {
  return db
    .prepare(
      `SELECT r.id, r.mentee_email AS menteeEmail, m.email AS mentorEmail, m.id AS mentorId
         FROM intro_requests r
         JOIN mentors m ON m.id = r.mentor_id
        WHERE r.id = ?`,
    )
    .get(requestId)
}

export function saveReport({ reporterEmail, reportedEmail, requestId, reason }) {
  db.prepare(
    'INSERT INTO reports (reporter_email, reported_email, request_id, reason) VALUES (?, ?, ?, ?)',
  ).run(reporterEmail, reportedEmail, requestId, reason)
}

// Permanently deletes everything stored for an email: profiles, requests, codes and sessions.
// Safety reports are kept so that moderation still works.
export function deleteAccount(email) {
  const remove = db.transaction(() => {
    for (const { id } of db.prepare('SELECT id FROM mentors WHERE email = ?').all(email)) {
      db.prepare('DELETE FROM intro_requests WHERE mentor_id = ?').run(id)
      db.prepare('DELETE FROM mentors WHERE id = ?').run(id)
    }
    db.prepare('DELETE FROM intro_requests WHERE mentee_email = ?').run(email)
    db.prepare('DELETE FROM mentees WHERE email = ?').run(email)
    db.prepare('DELETE FROM email_codes WHERE email = ?').run(email)
    db.prepare('DELETE FROM email_verifications WHERE email = ?').run(email)
    db.prepare('DELETE FROM sessions WHERE email = ?').run(email)
  })
  remove()
}
