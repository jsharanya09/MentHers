# MentHers

MentHers is a mentor matching app that connects mentees with mentors.

## Project structure

- `frontend/` - React app (Vite)
- `backend/` - Node.js API (Express)

## Getting started

Requires Node.js 20 or newer.

**Backend** (runs on http://localhost:3001):

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

**Frontend** (runs on http://localhost:5173):

```bash
cd frontend
npm install
npm run dev
```

Run both at the same time in two terminals. The frontend forwards `/api` requests to the backend.

The backend stores data in a SQLite database at `backend/storage/menthers.db`. It is created and filled with
sample mentors automatically the first time the backend starts, and it is not committed to git. To reset
it, stop the backend and delete the `backend/storage` folder.

## How intro requests work

- A mentee can click **Request intro** on a match and write a short message.
- The mentor gets an email and a notification in their private inbox. When a mentor signs up they are given a
  private link (`/#/requests/<token>`) that opens their inbox. Anyone with the link can see the requests, so it
  should be kept private. (Accounts and login will replace this.)
- Emails are only printed in the backend terminal until email is configured. To send real email, copy
  `backend/.env.example` to `backend/.env` and fill in the `SMTP_*` settings and `APP_URL` (the address of the
  frontend, used for the inbox link in the email).

## Who can join

MentHers is a mentoring community for women and girls. Everyone confirms this with a checkbox when they sign up.
This is a self-confirmation and is not verified.

## Contributing

1. Clone the repo: `git clone https://github.com/jsharanya09/MentHers.git`
2. Create a branch for your work: `git checkout -b my-feature`
3. Commit your changes and push the branch
4. Open a Pull Request on GitHub

ttps://jsharanya09.github.io/MentHers/
