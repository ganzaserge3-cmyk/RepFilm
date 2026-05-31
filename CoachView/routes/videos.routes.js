const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');

const { requireAuth, requireRole } = require('../middleware/auth');
const { createVideo, getVideos, getVideoById } = require('../db');
const { storeFile, localUploadsDir, isCloudEnabled } = require('../storage');

const router = express.Router();

const storageDir = localUploadsDir;
if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const tmpDir = path.join(storageDir, 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      cb(null, tmpDir);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname) || '.mp4';
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, safeName);
    },
  }),
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB
});

router.post('/', requireAuth, requireRole('coach'), upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'video file is required (field: video)' });

    const { title, description } = req.body || {};
    if (!title) return res.status(400).json({ message: 'title is required' });

    const stored = await storeFile(req.file);
    const video = await createVideo({
      coachId: req.user.id,
      title: String(title),
      description: description ? String(description) : '',
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      originalName: req.file.originalname,
      storageKey: stored.storageKey,
      fileUrl: stored.fileUrl,
    });

    res.status(201).json(video);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'failed to create video', error: err.message });
  }
});

router.get('/', requireAuth, async (_req, res) => {
  const items = await getVideos();
  res.json({ items });
});

router.get('/config', requireAuth, async (_req, res) => {
  res.json({ cloudStorage: isCloudEnabled() });
});

router.get('/:id', requireAuth, async (req, res) => {
  const video = await getVideoById(req.params.id);
  if (!video) return res.status(404).json({ message: 'not found' });
  res.json(video);
});

module.exports = router;

