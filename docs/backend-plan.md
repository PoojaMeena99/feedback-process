# Backend Plan

This document keeps the shared backend plan for the feedback-process project.

## Goal

Build a simple feedback request backend using:

- Frontend: Next.js
- Backend: Node.js + Express
- Database: MySQL
- API testing: Postman or Thunder Client

Current UI is only a prototype. Backend functionality will be built by the team as the learning part.

## MVP Flow

1. Rani creates a feedback request for Shanti.
2. Shanti sees requests waiting for her.
3. Shanti fills feedback using the selected template.
4. Rani sees the submitted feedback.

For now, support only:

- Learning Feedback
- Project Completion Feedback

## Recommended Folder Structure

```text
feedback-process/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── db/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middlewares/
│   │   ├── integrations/
│   │   └── server.js
│   │
│   ├── scripts/
│   │   ├── schema.sql
│   │   └── seed.sql
│   │
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── web/
│   └── Next.js frontend later, if frontend is moved into web/
│
├── docs/
│   ├── backend-plan.md
│   ├── api.md
│   └── database.md
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Team Division

### 1. Database Owner

Works on:

- `backend/scripts/schema.sql`
- `backend/scripts/seed.sql`
- `docs/database.md`

Responsibilities:

- Create MySQL database.
- Create tables.
- Add seed users and templates.
- Explain relationships to the team.

Tables:

- `users`
- `feedback_templates`
- `template_questions`
- `feedback_requests`
- `feedback_answers`

Seed users:

- Rani Singh
- Shanti Singh
- Pooja

Seed templates:

- Learning Feedback
- Project Completion Feedback

### 2. API Owner

Works on:

- `backend/src/server.js`
- `backend/src/routes/`
- `backend/src/controllers/`
- `docs/api.md`

Responsibilities:

- Set up Express server.
- Create routes.
- Create controllers.
- Define request and response format.
- Test APIs in Postman.

Start with:

```text
GET /health
GET /users
GET /templates
GET /templates/:id/questions
```

### 3. Integration Owner

Works on:

- `backend/src/db/connection.js`
- `backend/src/services/`
- `backend/src/integrations/`
- Postman collection

Responsibilities:

- Connect Express to MySQL using `mysql2/promise`.
- Write database query functions.
- Connect controllers to services.
- Test full flow from API to database.
- Later add Mattermost notification integration.

## Backend Setup

From repo root:

```bash
mkdir -p backend/src/{config,db,routes,controllers,services,middlewares,integrations}
mkdir -p backend/scripts docs
cd backend
npm init -y
npm install express mysql2 dotenv cors
npm install --save-dev nodemon
```

Add scripts in `backend/package.json`:

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js"
  }
}
```

## Environment Variables

Create `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=feedback_process
```

Also create `backend/.env.example` with the same keys but no real password.

## First Day Target

By the end of the first session:

1. MySQL database exists.
2. Tables are created.
3. Seed users and templates are inserted.
4. Express server runs.
5. `GET /health` returns success.
6. `GET /users` returns users from MySQL.
7. `GET /templates` returns templates from MySQL.

Do not connect frontend yet. First test backend using Postman.

## API Flow To Build Next

```text
GET    /health
GET    /users
GET    /templates
GET    /templates/:id/questions

POST   /feedback-requests
GET    /feedback-requests/giver/:userId
GET    /feedback-requests/requester/:userId
GET    /feedback-requests/:id

POST   /feedback-requests/:id/answers
PATCH  /feedback-requests/:id/status
```

## Rules For MVP

- User cannot request feedback from themselves.
- Only selected giver can submit feedback.
- Submitted feedback should be visible to requester and giver.
- Same requester, giver, and feedback type should not create duplicate open requests.
- Keep data simple. No auth, Mattermost, reminders, or permissions in the first version.

## Suggested Working Order

1. Database owner creates `schema.sql`.
2. API owner creates Express server and `/health`.
3. Integration owner creates MySQL connection.
4. API owner creates routes.
5. Integration owner connects routes to DB services.
6. Everyone tests using Postman.
7. Only after backend works, connect Next.js UI to APIs.
