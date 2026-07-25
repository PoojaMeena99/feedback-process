# Feedback Process

Next.js and Tailwind CSS prototype for a feedback request workflow.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Demo Flow

1. Select `Rani Singh`.
2. Create a request for `Shanti Singh`.
3. Switch user to `Shanti Singh`.
4. Accept the request and fill the feedback form.
5. Switch back to `Rani Singh`.
6. Open the submitted feedback and close it.

## Current Scope

- Frontend only.
- Data saves in browser `localStorage`.
- UI uses Tailwind CSS.
- Two templates:
  - Learning Feedback
  - Project Completion Feedback
- Seed users:
  - `ranisingh21@navugurukul.org`
  - `shantisingh22@navgurukul.org`
  - `pooja@navgurukul.org`
