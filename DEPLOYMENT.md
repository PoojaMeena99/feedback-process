# Shared deployment setup

This project uses one shared online backend so users do not need to configure
MySQL or email on their own computers.

## 1. Deploy the backend and MySQL on Railway

1. Create a Railway project from this GitHub repository and select the
   `feature/password-reset-api` branch while it is being tested.
2. Add a MySQL service to the same Railway project.
3. For the backend service, set **Root Directory** to `/backend` and
   **Config File Path** to `/backend/railway.toml`.
4. Add these backend service variables in Railway. Reference the values from
   the Railway MySQL service for the five `DB_` variables.

```env
DB_HOST=<Railway MySQL host>
DB_PORT=<Railway MySQL port>
DB_USER=<Railway MySQL user>
DB_PASSWORD=<Railway MySQL password>
DB_NAME=<Railway MySQL database>
JWT_SECRET=<a long random secret>
FRONTEND_ORIGIN=https://<Vercel frontend domain>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<sender email>
SMTP_PASS=<Google App Password>
EMAIL_FROM=<sender email>
```

5. Import `backend/scripts/schema.sql` into the Railway MySQL database once.
6. Generate a public Railway domain for the backend and verify:
   `https://<backend-domain>/health`.

Never add real passwords, tokens, or SMTP credentials to Git.

## 2. Deploy the frontend on Vercel

1. Import the same GitHub repository into Vercel.
2. Keep the repository root as the Vercel project Root Directory.
3. Add this Vercel environment variable for Production and Preview:

```env
API_PROXY_TARGET=https://<Railway backend domain>
```

4. Deploy the frontend.
5. Copy its final HTTPS domain into the Railway backend variable
   `FRONTEND_ORIGIN`, then redeploy the backend.

The browser continues to call `/api`. The Next.js rewrite in
`next.config.mjs` forwards those requests to the shared Railway backend.

## 3. Test the shared flow

1. Register a user on the Vercel URL.
2. Open **Forgot password** and submit that registered email.
3. Open the reset link received by email.
4. Set the new password; the app should return to the Login page.
5. Log in with the new password.

After this deployment, normal users only need the Vercel website URL. They do
not need the repository, a local backend, MySQL, or SMTP configuration.
