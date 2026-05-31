require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Datastore = require('nedb-promises');

const dbDir = process.env.DB_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const usersDb = Datastore.create({ filename: path.join(dbDir, 'users.db'), autoload: true });
const videosDb = Datastore.create({ filename: path.join(dbDir, 'videos.db'), autoload: true });

async function createUser(email, passwordHash, role) {
  const createdAt = new Date().toISOString();
  const user = await usersDb.insert({ email, passwordHash, role, createdAt });
  return { id: user._id, email: user.email, role: user.role, createdAt: user.createdAt };
}

async function findUserByEmail(email) {
  return usersDb.findOne({ email });
}

async function findUserById(id) {
  return usersDb.findOne({ _id: id });
}

async function createVideo({ coachId, title, description, mimeType, fileSize, originalName, storageKey, fileUrl }) {
  const createdAt = new Date().toISOString();
  const video = await videosDb.insert({
    coachId,
    title,
    description,
    mimeType,
    fileSize,
    originalName,
    storageKey,
    fileUrl,
    createdAt,
  });
  return video;
}

async function getVideos() {
  return videosDb.find({}).sort({ createdAt: -1 });
}

async function getVideoById(id) {
  return videosDb.findOne({ _id: id });
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  createVideo,
  getVideos,
  getVideoById,
};
