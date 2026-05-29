const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Local disk storage for now (step 2). Later we can swap to Supabase Storage.
const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    cb(null, `${unique}-${safeName}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 * 1024 } }); // 2GB

const videos = new Map();
let nextId = 1;

router.post('/', requireAuth, requireRole('coach'), upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'video file is required (field: video)' });

    const { title, description } = req.body || {};
    if (!title) return res.status(400).json({ message: 'title is required' });

    const id = String(nextId++);
    const video = {
      id,
      coachId: req.user.id,
      title: String(title),
      description: description ? String(description) : '',
      filename: req.file.filename,
      originalName: req.file.originalname,
      createdAt: new Date().toISOString(),
    };

    videos.set(id, video);
    res.status(201).json(video);
  } catch (_err) {
    res.status(500).json({ message: 'failed to create video' });
  }
});

router.get('/', requireAuth, async (_req, res) => {
  res.json({
    items: Array.from(videos.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
});

router.get('/:id', requireAuth, async (req, res) => {
  const video = videos.get(req.params.id);
  if (!video) return res.status(404).json({ message: 'not found' });

  res.json(video);
});

module.exports = router;

