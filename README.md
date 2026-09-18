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

## Contributing

1. Clone the repo: `git clone https://github.com/jsharanya09/MentHers.git`
2. Create a branch for your work: `git checkout -b my-feature`
3. Commit your changes and push the branch
4. Open a Pull Request on GitHub
