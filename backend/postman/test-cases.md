# Person 3 integration test cases

Run these after Person 1 provides the schema and seed data and Person 2 provides
the routes and controllers.

## First-day checks

- `GET /health` returns HTTP 200.
- `GET /users` returns Rani Singh, Shanti Singh, and Pooja.
- `GET /templates` returns both MVP templates.
- `GET /templates/:id/questions` returns the selected template's questions.

## Feedback flow

- Rani can create a request for Shanti.
- Shanti can see the request.
- Shanti can submit answers.
- The request status changes to `submitted`.
- Rani can see the submitted feedback.

## MVP rules

- A user cannot request feedback from themselves.
- A duplicate open request is rejected.
- Only the selected giver can submit answers.
- A submitted request cannot be submitted again.
