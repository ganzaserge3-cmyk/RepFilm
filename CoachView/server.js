const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

const authRoutes = require('./routes/auth.routes');
const videosRoutes = require('./routes/videos.routes');

app.use('/api/auth', authRoutes);
app.use('/api/videos', videosRoutes);

// Serve uploaded files (development only)
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`CoachView API listening on port ${PORT}`);
});


