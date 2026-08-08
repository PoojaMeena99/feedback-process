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

For the local MySQL user used by `.env.example`, run this once:

```sql
CREATE USER IF NOT EXISTS 'feedback_user'@'localhost' IDENTIFIED BY 'feedback123';
GRANT ALL PRIVILEGES ON feedback_process.* TO 'feedback_user'@'localhost';
FLUSH PRIVILEGES;
```

Open these URLs in the browser or send `GET` requests in Postman:

```text
http://localhost:5000/health
http://localhost:5000/users
http://localhost:5000/templates
http://localhost:5000/templates/1/questions
```

## Feedback request APIs

### Create a request

`POST /feedback-requests`

```json
{
  "requesterId": 1,
  "giverId": 2,
  "templateId": 1,
  "dueDate": "2026-08-12",
  "message": "Please share feedback about my learning."
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
    "Practice API validation more.",
    "Build one small project using the same topic."
  ]
}
```

### Update request status

`PATCH /feedback-requests/:id/status`

```json
{
  "actorId": 1,
  "status": "closed"
}
```

This route also uses the lifecycle rules. Use submit answers for `submitted` status.

### Cancel a request

Only the requester can cancel a `requested` request.

`PATCH /feedback-requests/:id/cancel`

```json
{
  "actorId": 1
}
```

### Decline a request

Only the selected feedback giver can decline a `requested` request.

`PATCH /feedback-requests/:id/decline`

```json
{
  "actorId": 2
}
```

### Acknowledge submitted feedback

Only the requester can acknowledge a `submitted` request.

`PATCH /feedback-requests/:id/acknowledge`

```json
{
  "actorId": 1
}
```

### Close an acknowledged request

Only the requester can close an `acknowledged` request.

`PATCH /feedback-requests/:id/close`

```json
{
  "actorId": 1
}
```
