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


