# MentHers

MentHers is a mentoring community for women and girls. Mentees answer a few questions and get a ranked list
of mentors who fit their goals, with a plain-English reason for each match. They can ask a mentor for an intro,
and the mentor accepts or declines from their account.

## Features

- **Questionnaire** for mentees and mentors, with role-specific questions.
- **Smart matching.** Rules filter mentors by shared interests and meeting format, then score them. When AI is
  turned on, Claude reads the mentee's own goal and the mentors' bios to re-rank them and explain each match.
- **AI-drafted intro messages** that the mentee can edit before sending.
- **Email verification** with a 6-digit code for everyone who signs up.
- **Accounts without passwords.** Sign in with an emailed code.
- **Accept or decline.** Mentors answer requests; accepting shares the mentor's email with the mentee.
- **Safety.** Report a problem, delete your account, and a plain-language privacy and safety page.
- **Accessible and responsive.** Works on phones, in dark mode, and with keyboards and screen readers.

## Project structure

- `frontend/` - React app (Vite)
- `backend/` - Node.js API (Express) with a SQLite database

## Run it on your computer

Requires Node.js 20 or newer.

```bash
npm run install:all          # installs both parts
cp backend/.env.example backend/.env
```

Start the backend (http://localhost:3001):

```bash
cd backend
npm run dev
```

In a second terminal, start the frontend (Vite prints the address, usually http://localhost:5173):

```bash
cd frontend
npm run dev
```

The database is a file at `backend/storage/menthers.db`. It is created automatically, is filled with demo
mentors, and is not committed to git. To reset it, stop the backend and delete the `backend/storage` folder.

**Verification codes in development.** Until email is configured, codes are not emailed. They are printed in
the terminal where the backend is running, in a line like `Verification code: 123456`.

## Settings

Everything is configured with environment variables. For local development, put them in `backend/.env` (see
`backend/.env.example`).

| Variable | What it does |
| --- | --- |
| `APP_URL` | The address of the site, used for links in emails. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Email account used to send codes and notices. **Required for real users.** |
| `ANTHROPIC_API_KEY` | Turns on the AI features. Optional: without it, matching uses rules only. |
| `ADMIN_EMAIL` | Where safety reports are emailed (they are always saved). Optional. |
| `DB_PATH` | Where the database file lives. |
| `SEED_SAMPLE_MENTORS` | Set to `false` to stop adding the demo mentors. |

**Gmail for a quick start.** Turn on 2-step verification for a Google account, create an "app password", then
use `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=<the Gmail address>` and
`SMTP_PASS=<the app password>`. For a real launch, use an email service such as Resend, SendGrid or Mailgun.

## Put it online

The backend serves the built frontend, so the whole app is one service.

**Render (easiest).** Push this repo to GitHub, then in Render choose **New > Blueprint**, pick the repo, and
fill in the settings it asks for (`APP_URL`, the `SMTP_*` values, and optionally `ANTHROPIC_API_KEY` and
`ADMIN_EMAIL`). The `render.yaml` file does the rest. On the free plan there is no permanent disk, so the
database resets whenever the service restarts (the demo mentors are added back automatically). For real data,
use a paid plan with a disk (see the comments in `render.yaml`).

**Any Docker host** (Fly.io, Railway, Cloud Run): the `Dockerfile` builds and runs everything on port 8080.

Set `NODE_ENV=production` on any host. It turns on secure cookies and correct handling of visitors' IP addresses.

## How matching works

1. **Filter.** A mentor is only considered if they share at least one area of interest and one meeting format
   with the mentee.
2. **Score (out of 100).** Skills 40, areas of interest 25, conversation style 15, meeting frequency 10, meeting
   format 10. The weights are at the top of `backend/src/matching.js`.
3. **AI (optional).** The best 8 candidates are sent to Claude with the mentee's goal. It returns a 0-100 fit
   and a one-sentence reason for each. The final score is 60% rules and 40% AI, and the top 5 are shown. If AI is
   off or fails, the rule-based top 5 is shown instead.

## Who it's for

MentHers is a mentoring community for women and girls.

## Known limits

- Members are not identity-checked. See the safety page for how this is described to users.
- Rate limits are kept in memory, so they reset when the server restarts.
- Accounts have no passwords, so access depends on control of the email inbox.
- If mentees can be under 18, add age checks and guardian consent before a public launch.

## Contributing

1. Clone the repo: `git clone https://github.com/jsharanya09/MentHers.git`
2. Create a branch for your work: `git checkout -b my-feature`
3. Commit your changes and push the branch
4. Open a Pull Request on GitHub
