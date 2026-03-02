# Deployment

Thunder App is a monorepo with two deployable pieces: a static frontend (Vite build) and a Bun-powered backend API. The frontend compiles to static files that can be served from any CDN or hosting provider. The backend runs on Bun and needs a host that supports it — either through a Docker container or a platform with native Bun support. Both pieces need to know about each other: the frontend needs `VITE_BACKEND_URL` at build time, and the backend needs `FRONTEND_URL` at runtime for CORS.

## Quick Deployment Guide

This guide walks through deploying your Thunder App using AWS Amplify for the frontend and AWS App Runner (via ECR) for the backend. The frontend deployment takes about 5 minutes — connect your GitHub repo, set one environment variable, and Amplify handles the rest, including automatic redeployments on every push to `main`. The backend takes a bit more setup but gives you a fully managed, auto-scaling container service running Bun.

### Frontend — AWS Amplify

AWS Amplify can host your frontend as a static site with automatic builds from GitHub.

#### 1. Add `amplify.yml` to the repo root

If you selected "Include Thunder App quick deploy setup?" during `bun create thunder-app`, this file is already in your project — skip to step 2. Otherwise, create `amplify.yml` at the repo root with the following contents:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - curl -fsSL https://bun.sh/install | bash
        - export PATH="$HOME/.bun/bin:$PATH"
        - bun install --frozen-lockfile --force
        - bun run build:lib
    build:
      commands:
        - export PATH="$HOME/.bun/bin:$PATH"
        - bun run build:frontend
  artifacts:
    baseDirectory: frontend/dist
    files:
      - "**/*"
  cache:
    paths:
      - node_modules/**/*
```

Commit and push this file to your repository.

#### 2. Create a new Amplify app

- Go to **AWS Console → AWS Amplify → Create new app**
- Select **GitHub** as the source provider
- Choose your repository and branch (e.g. `main`)
- Check **"My app is a monorepo"** and enter `/` as the root directory

#### 3. Configure build settings

Amplify should auto-detect the build command (`bun run build:frontend`) and output directory (`frontend/dist`).

Expand **Advanced settings** and add your environment variable:

| Key                | Value                                       |
| ------------------ | ------------------------------------------- |
| `VITE_BACKEND_URL` | Your backend URL (e.g. your App Runner URL) |

#### 4. Deploy

Click through **Review → Save and deploy**. Amplify will run the `preBuild` phase (installs Bun, installs dependencies, builds the lib package) followed by the `build` phase (builds the frontend). You'll get a public Amplify URL on completion.

> **Note:** By default, Amplify automatically redeploys your frontend every time code is pushed to `main`. If you set up the [CI/CD automation](#cicd-automation) workflow below, you should disable Amplify's auto-build to avoid duplicate deployments.

#### 5. Fix SPA routing

After the initial deploy, configure a rewrite rule so client-side routing works:

- Go to **Amplify → your app → Rewrites and redirects → Add rule**
- Source: `/<*>`
- Target: `/index.html`
- Type: **200 (Rewrite)**

Without this rule, refreshing on any route other than `/` will return a 404.

#### 6. Update backend CORS

Your backend restricts CORS to the `FRONTEND_URL` environment variable. After deploying the frontend, update the backend to allow requests from your new Amplify URL:

- Set `FRONTEND_URL` to your Amplify URL in your backend's environment configuration
- Redeploy the backend service

### Backend — AWS App Runner via ECR

App Runner is a fully managed container service that auto-scales your backend. You'll build a Docker image, push it to ECR (Elastic Container Registry), and point App Runner at it.

#### 1. Create a `Dockerfile` at the repo root

If you selected "Include Thunder App quick deploy setup?" during `bun create thunder-app`, the `Dockerfile` and `.dockerignore` are already in your project — skip to step 3.

Multi-stage build — the builder stage compiles only the `lib` package, and the runner copies the backend source directly since Bun runs TypeScript natively:

```dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock ./
COPY lib/package.json lib/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN bun install --frozen-lockfile --force

COPY lib/ ./lib/
COPY tsconfig.json ./
RUN bun run build:lib

FROM oven/bun:1-slim AS runner
WORKDIR /app

COPY package.json bun.lock tsconfig.json ./
COPY --from=builder /app/lib/package.json ./lib/
COPY --from=builder /app/lib/dist ./lib/dist
COPY backend/ ./backend/
COPY frontend/package.json ./frontend/
RUN bun install --frozen-lockfile --production

ENV PORT=3000
EXPOSE 3000
CMD ["bun", "run", "backend/src/index.ts"]
```

The builder only compiles the `lib` package (needed because other workspaces import its compiled output). The backend doesn't need a build step — Bun handles TypeScript natively at runtime, so the runner copies the backend source files directly and runs `backend/src/index.ts`. The runner runs `bun install --production` to resolve workspace symlinks (e.g. `@your-app/lib`) and install runtime dependencies.

#### 2. Create a `.dockerignore` at the repo root

Keep the build context small:

```
node_modules
**/node_modules
frontend/src
frontend/public
**/.env
**/dist
.git
```

#### 3. Test the image locally

```bash
docker build --platform linux/amd64 -t your-project-name .
docker run -p 3001:3000 \
  -e ENVIRONMENT=production \
  -e DATABASE_URL=your-database-url \
  -e AUTH_SECRET=your-auth-secret \
  -e FRONTEND_URL=http://localhost:5173 \
  -e GOOGLE_CLIENT_ID=your-client-id \
  -e GOOGLE_CLIENT_SECRET=your-client-secret \
  your-project-name
```

Replace `your-project-name` with whatever you want to call the local image (e.g. the name of your project). This is just a local tag — it doesn't need to match your ECR repository name.

> **Important:** Always build with `--platform linux/amd64`. App Runner runs on amd64 — if you build on Apple Silicon without this flag, the image defaults to arm64 and the container will silently fail to start.

#### 4. Install AWS CLI and configure credentials

Install the AWS CLI:

```bash
brew install awscli
```

Before you can use it, you need an IAM user with access keys. Don't use your root AWS account for this.

1. Go to **AWS Console → IAM → Users → Create user**
2. Enter a name (e.g. `cli-deploy`) and click **Next**
3. Select **Attach policies directly** and add:
   - `AmazonEC2ContainerRegistryFullAccess`
   - `AWSAppRunnerFullAccess`
4. Click through to create the user
5. Go to the user → **Security credentials → Create access key**
6. Select **Command Line Interface (CLI)** as the use case
7. Copy the **Access Key ID** and **Secret Access Key** — you won't be able to see the secret again

Now configure the CLI with those credentials:

```bash
aws configure
```

It will prompt you for four values:

- **AWS Access Key ID** — paste the key ID from step 7
- **AWS Secret Access Key** — paste the secret from step 7
- **Default region name** — your AWS region (e.g. `us-east-2`)
- **Default output format** — press Enter to accept the default, or type `json`

#### 5. Create an ECR repository

- Go to **AWS Console → ECR → Create repository**
- Visibility: **Private**
- Name: e.g. `my-app-backend`

Note the repository URI — you'll need it for the next steps.

#### 6. Push the image to ECR

```bash
aws ecr get-login-password --region your-region \
  | docker login --username AWS --password-stdin \
    your-account-id.dkr.ecr.your-region.amazonaws.com

docker tag your-project-name:latest \
  your-account-id.dkr.ecr.your-region.amazonaws.com/your-repo-name:latest

docker push \
  your-account-id.dkr.ecr.your-region.amazonaws.com/your-repo-name:latest
```

Replace `your-account-id`, `your-region`, and `your-repo-name` with your AWS account ID, region, and the ECR repository name you created in step 5.

#### 7. Create an App Runner service

- Go to **AWS Console → App Runner → Create service**
- Source: **Container registry → Amazon ECR**
- Image URI: your ECR image URI with the `:latest` tag
- Deployment: **Manual**
- ECR access role: let AWS auto-create one
- Port: `3000`
- Add environment variables:

| Key                    | Value                                |
| ---------------------- | ------------------------------------ |
| `ENVIRONMENT`          | `production`                         |
| `FRONTEND_URL`         | Your Amplify URL (no trailing slash) |
| `DATABASE_URL`         | Your PostgreSQL connection string    |
| `AUTH_SECRET`          | Your auth secret                     |
| `GOOGLE_CLIENT_ID`     | Your Google OAuth client ID          |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth client secret      |

#### 8. Verify and troubleshoot

If the first deploy fails with a health check error, the most common cause is an architecture mismatch. Rebuild with `--platform linux/amd64`, re-push to ECR, and click **Rebuild** in App Runner.

#### 9. Connect frontend and backend

Once both services are live, make sure the URLs are configured correctly on both sides:

- **Amplify:** Set `VITE_BACKEND_URL` to your App Runner URL (no trailing slash) → redeploy
- **App Runner:** Set `FRONTEND_URL` to your Amplify URL (no trailing slash) → redeploy

Trailing slashes in either URL will cause CORS failures.

### CI/CD Automation

If you selected both "Include GitHub CI/CD pipeline?" and "Include Thunder App quick deploy setup?" during `bun create thunder-app`, your project includes a GitHub Actions workflow that automatically builds, lints, type-checks, and deploys on every push to `main`.

The workflow has two jobs:

1. **build-and-lint** — Runs on every push and pull request. Installs dependencies, builds lib, runs lint, typecheck, and type-checks both frontend and backend.
2. **deploy** — Runs only on pushes to `main` after `build-and-lint` passes. Builds a Docker image, pushes it to ECR, triggers App Runner redeployment, and triggers Amplify redeployment.

#### Disable Amplify auto-build

Since the GitHub Actions workflow triggers Amplify deployments, you should disable Amplify's built-in auto-build to avoid duplicate deployments:

- Go to **Amplify → your app → App settings → Branch settings**
- Select your branch and click **Edit**
- Toggle off **Automatic builds**

#### Add GitHub secrets

Go to **GitHub → your repo → Settings → Secrets and variables → Actions → Secrets** and add:

| Secret                  | Value                      |
| ----------------------- | -------------------------- |
| `AWS_ACCESS_KEY_ID`     | IAM user access key ID     |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret access key |

#### Add GitHub variables

Go to **GitHub → your repo → Settings → Secrets and variables → Actions → Variables** and add:

| Variable                 | Value                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| `AWS_REGION`             | Your AWS region (e.g. `us-east-2`)                                                               |
| `ECR_REPO_URI`           | Your ECR repository URI (e.g. `123456789.dkr.ecr.us-east-2.amazonaws.com/my-app-backend`)        |
| `APP_RUNNER_SERVICE_ARN` | Your App Runner service ARN (found in App Runner → your service → Configuration)                 |
| `AMPLIFY_APP_ID`         | Your Amplify app ID (found in Amplify → your app → App settings → General → App ARN, or the URL) |

#### IAM user permissions

Create a dedicated IAM user for CI/CD deployments with the following managed policies:

- `AWSAppRunnerFullAccess`
- `AmazonEC2ContainerRegistryFullAccess`

You'll also need a custom inline policy to allow the workflow to trigger Amplify builds. Go to **IAM → your user → Add permissions → Create inline policy → JSON** and add:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["amplify:StartJob", "amplify:GetJob", "amplify:ListJobs"],
      "Resource": "arn:aws:amplify:your-region:your-account-id:apps/your-amplify-app-id/branches/main/jobs/*"
    }
  ]
}
```

Replace `your-region`, `your-account-id`, and `your-amplify-app-id` with your actual values. The resource ARN includes `branches/main/jobs/*` — if your production branch is named something other than `main`, update the branch name accordingly, or use `branches/*/jobs/*` to allow all branches.
