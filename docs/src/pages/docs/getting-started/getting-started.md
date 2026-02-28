# Getting Started

Get up and running with Thunder App in minutes.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Bun** (v1.3 or later) - [Install Bun](https://bun.sh/docs/installation)
- **Node.js** (v22 or later) - Required for some tooling, though Bun handles most of it

_Note: Earlier versions may work but have not been tested_

## Installation

To create a new Thunder App project, run:

```bash
bun create thunder-app@latest
```

The CLI will guide you through the setup process and ask you a few questions about your project configuration.

![Thunder App CLI](/thunder-app-cli.png)

Once the project is created, navigate into your new project directory:

```bash
cd <your-app-name>
```

### Environment Variables

Copy the example environment files for both `frontend` and `backend` and fill in your values. The app validates environment variables at startup using Zod, so you'll get clear error messages if anything is missing.

The backend will show invalid environment variables in the terminal:

![Invalid Env Vars Backend](/invalid-env-backend.png)

And the frontend will show invalid environment variables directly in the browser:

![Invalid Env Vars Frontend](/invalid-env-frontend.png)

### Database Setup

Thunder App uses Drizzle ORM with PostgreSQL. To set up your database:

1. Make sure PostgreSQL is running
2. Update your database connection string in `backend/.env`
3. Push the schema to your database:

```bash
bun run db:push
```

## Running the Development Server

Start all development environments simultaneously by running this command from the root of the monorepo:

```bash
bun run dev
```

This will start:

- Frontend dev server (defaults to `http://localhost:5173`)
- Lib (watches for file changes)
- Backend API server (defaults to `http://localhost:3000`)

The frontend and lib support hot module replacement, so your changes will be reflected immediately. The backend uses Bun's `--watch` mode to automatically restart on file changes.

## Next Steps

Now that you're up and running, here are some recommended next steps:

1. **Explore the project** — Look through `frontend/`, `backend/`, and `lib/` to understand how the monorepo is organized
2. **Set up authentication** — Configure your Google OAuth credentials in `backend/.env` and push the auth schema with `bun run db:push`
3. **Add a route** — Create a new file in `frontend/src/routes/` (e.g. `about.tsx`) and TanStack Router will automatically add it to your route tree
4. **Build something** — The template is ready to go — start adding routes to the backend and pages to the frontend

Happy coding!
