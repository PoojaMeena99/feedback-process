# Feedback Process API

Base URL while running locally: `http://localhost:5000`

## Routes built by the API owner

### Check the server

`GET /health`

Response:

```json
{
  "ok": true,
  "message": "Feedback Process API is running"
}
```

### List users

`GET /users`

Returns Rani, Shanti, and Pooja.

### List feedback templates

`GET /templates`

Returns the template ID and name. It does not return questions, so the frontend can request them only when needed.

### Get questions for one template

`GET /templates/:id/questions`

Example: `GET /templates/1/questions`

Returns a `404` response when the template does not exist.

## How to run and test

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Open these URLs in the browser or send `GET` requests in Postman:

```text
http://localhost:5000/health
http://localhost:5000/users
http://localhost:5000/templates
http://localhost:5000/templates/1/questions
```

## What changes after MySQL is ready

The routes and controller names remain the same. The temporary arrays in the controllers will be replaced by calls to database services. The API response shape should stay stable so the frontend does not need to change.

## Feedback request APIs

### Create a request

`POST /feedback-requests`

```json
{
  "requesterId": 1,
  "giverId": 2,
  "templateId": 1,
  "message": "Please share feedback about my learning.",
  "dueDate": "2026-08-01"
}
```

### Get requests received by a feedback giver

`GET /feedback-requests/giver/:userId`

Example: `GET /feedback-requests/giver/2`

### Get requests sent by a requester

`GET /feedback-requests/requester/:userId`

Example: `GET /feedback-requests/requester/1`

### Get one request

`GET /feedback-requests/:id`

### Submit answers

`POST /feedback-requests/:id/answers`

```json
{
  "giverId": 2,
  "answers": [
    "You learned Express routing well.",
    "Practice API validation more."
  ]
}
```

### Update request status

`PATCH /feedback-requests/:id/status`

```json
{
  "status": "closed"
}
```
