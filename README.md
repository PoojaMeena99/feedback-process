# Feedback Process

A full-stack feedback workflow for teams. Team members can request feedback, submit and acknowledge responses, ask follow-up questions, set due dates, receive reminders and notifications, and view completed feedback history.

## What is included

- Account creation, login, logout, and password reset by email
- Learning and project-completion feedback requests
- Feedback submission, acknowledgement, clarification conversation, and follow-up actions
- Request status, due dates, reminders, notifications, and history timeline
- Search and status filters for feedback requests
- Mattermost webhook support for team notifications (optional)

## Tech stack

- Frontend: Next.js and React
- Backend: Node.js, Express, and REST APIs
- Database: MySQL
- Email: Nodemailer / SMTP

## Before you start

Install these on your computer:

- Node.js 20 or newer
- npm (comes with Node.js)
- MySQL 8 or newer
- Git

Check that Node.js and npm are available:

```bash
node --version
npm --version
```

## Clone the project

After this repository has been pushed to GitHub, clone it and open the folder:

```bash
git clone git@github.com:justuju-in/feedback-process.git
cd feedback-process
```

If you do not have SSH access to GitHub, use the HTTPS clone URL from the repository's **Code** button instead.

## 1. Install dependencies

There are two applications in this repository, so install dependencies in both places.

```bash
# From the project root: frontend dependencies
npm install

# Backend dependencies
cd backend
npm install
cd ..
```

## 2. Create the database

The fastest local setup is to use your local MySQL account.

1. Open MySQL in a terminal:

   ```bash
   mysql -u root -p
   ```

2. Enter your MySQL password, then leave MySQL:

   ```sql
   exit
   ```

3. From the project root, create all tables and add the starter users/templates:

   ```bash
   mysql -u root -p < backend/scripts/schema.sql
   mysql -u root -p feedback_process < backend/scripts/seed.sql
   ```

The first command creates the `feedback_process` database and tables. The second command adds sample users and the two standard feedback templates.

> If your MySQL username is not `root`, replace `root` in the commands with your own username.

## 3. Configure backend environment variables

Create your local environment file from the example:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` in VS Code and update the database values. For a default local MySQL setup, it can look like this:

```env
PORT=5000
JWT_SECRET=replace_this_with_a_long_random_value

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=feedback_process

FRONTEND_ORIGIN=http://localhost:3000
```

Use a long random value for `JWT_SECRET`. Do **not** commit the `.env` file, share passwords in chat, or push SMTP passwords to GitHub.

### Optional: enable password-reset emails

Password reset works only after SMTP values are configured in `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_sender_email@example.com
SMTP_PASS=your_app_password
EMAIL_FROM="Feedback Process <your_sender_email@example.com>"
```

For Gmail, use a Google **App Password**, not your normal Gmail password. This sender account is configured once on the backend; every registered user can receive reset emails at their own email address.

Leave these values empty if you only want to test the feedback workflow without password-reset email.

### Optional: Mattermost notifications

To send notifications to Mattermost, add a webhook URL:

```env
MATTERMOST_WEBHOOK_URL=https://your-mattermost-site/hooks/your-webhook-id
SC_MATTERMOST_WEBHOOK_URL=https://your-mattermost-site/hooks/your-sc-webhook-id
```

These values are optional. The application still runs without them.

## 4. Run the application

Use **two separate terminals**.

### Terminal 1 — backend API

```bash
cd feedback-process/backend
npm run dev
```

The API should start at <http://localhost:5000>. You can verify it at <http://localhost:5000/health>.

### Terminal 2 — frontend

```bash
cd feedback-process
npm run dev
```

Open <http://localhost:3000> in the browser.

The frontend forwards `/api` calls to the backend automatically. Keep both terminals running while you test.

## Basic testing flow

1. Create two accounts (for example, one requester and one feedback giver).
2. Log in as the requester and create a feedback request with the other account as giver.
3. Log in as the feedback giver and submit the feedback.
4. Log back in as the requester, open **View Feedback**, and acknowledge it.
5. Test a question/reply or a follow-up action if needed.
6. Close the request and check **Feedback History** and the request timeline.
7. To test reset password, use **Forgot password?**, open the email link, set a new password, and log in with it.

## Common problems

### The page says `Failed to fetch` or `Internal server error`

- Confirm the backend terminal is running at port `5000`.
- Open <http://localhost:5000/health>; it should return a successful response.
- Check `backend/.env` has the correct MySQL username, password, and database name.
- Check the backend terminal for the exact error message.

### MySQL connection fails

- Make sure the MySQL service is running.
- Verify `DB_USER` and `DB_PASSWORD` in `backend/.env`.
- Re-run the schema and seed commands in the database setup section.

### The frontend starts on port 3001 or 3002

Another Next.js process is already using port `3000`. Stop the older frontend process and run `npm run dev` again. Use `http://localhost:3000` for password-reset links during local testing.

### Password-reset email does not arrive

- Confirm all `SMTP_*` values and `EMAIL_FROM` are present in `backend/.env`.
- Restart the backend after editing `.env`.
- Use an App Password for Gmail.
- Check Spam/Promotions and the backend terminal output.

## Useful commands

```bash
# Create a production frontend build
npm run build

# Start the production frontend after building
npm run start

# Start backend without nodemon
cd backend && npm start
```

## Security notes

- Never commit `backend/.env` or real credentials.
- Use different credentials for local, testing, and production environments.
- In production, set `FRONTEND_ORIGIN` to the exact deployed frontend URL.
- Rotate an SMTP App Password immediately if it is ever exposed.

## Project structure

```text
app/                     Next.js frontend pages and UI
backend/src/             Express routes, controllers, services, and database code
backend/scripts/         Database schema, migrations, and seed data
backend/.env.example     Safe environment-variable template
backend/postman/         API collection and API test notes
```

## Contributing

Create a feature branch for your work, test it locally, commit clear changes, and open a pull request for review. Keep secrets and local database files out of Git.
