const express = require('express');
const multer = require('multer');

const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Use memory storage for Vercel serverless (no persistent filesystem)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

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
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      createdAt: new Date().toISOString(),
    };

    videos.set(id, video);
    res.status(201).json(video);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'failed to create video', error: err.message });
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

