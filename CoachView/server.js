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

app.use('/uploads', express.static('uploads'));

app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(\CoachView API listening on port \\);
  });
}

module.exports = app;
