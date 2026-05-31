# CoachView

Full-stack workout video platform.

## Backend (phase 1: server skeleton + phase 2: auth + video upload/listing)

### Start server
1) Create a `.env` file:

```env
JWT_SECRET=change_me
CORS_ORIGIN=http://localhost:3000
PORT=4000
```

2) Install deps:

```bash
npm i express cors dotenv helmet morgan cookie-parser jsonwebtoken bcrypt multer
```

3) Run:

```bash
node server.js
```

### Endpoints
- `GET /api/health`
- `POST /api/auth/register` (body: `{ email, password, role }`)
- `POST /api/auth/login` (body: `{ email, password }`)
- `POST /api/videos` (coach only, bearer token; multipart field `video`, plus `title`)
- `GET /api/videos` (bearer token)
- `GET /api/videos/:id` (bearer token)

## Frontend pages
CoachView now includes a real multi-page browser UI served from `CoachView/public`.

Available pages:
- `/` — Home landing page
- `/register.html` — Register account
- `/login.html` — Login page
- `/upload.html` — Upload video page (coach only)
- `/videos.html` — Browse uploaded videos
- `/profile.html` — User profile and sign out
- `/about.html` — About the app

## Database-backed storage
This version uses SQLite for local development and can be configured for a production database in the future.

## Cloud storage support
The app now supports AWS S3 for file storage when the following environment variables are provided:
- `S3_BUCKET`
- `S3_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_PUBLIC=true` (optional, for public object URLs)

If cloud storage is not configured, the app falls back to local disk storage in development and `/tmp/uploads` on Vercel.

> Note: Serverless deployments use ephemeral storage, so local uploads may not persist across cold starts. For production, use AWS S3 or another cloud object storage provider along with a persistent database.


