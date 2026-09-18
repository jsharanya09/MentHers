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

## Contributing

1. Clone the repo: `git clone https://github.com/jsharanya09/MentHers.git`
2. Create a branch for your work: `git checkout -b my-feature`
3. Commit your changes and push the branch
4. Open a Pull Request on GitHub

ttps://jsharanya09.github.io/MentHers/
