import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Resolve ES module paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Ping route for keeping server awake
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('WARNING: MONGODB_URI is not set. Database will run in offline mode using memory data.');
} else {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas successfully.'))
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      console.warn('Database failed to connect. Running backend with memory-fallback.');
    });
}

// Define Schema & Model
const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, default: 'Visitor' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  date: { type: String, required: true }
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

// Visitor Counter Schema & Model (shared with mobile portfolio via same MongoDB cluster)
const visitorSchema = new mongoose.Schema({
  key: { type: String, default: 'portfolio_visits', unique: true },
  count: { type: Number, default: 0 }
});
const Visitor = mongoose.model('Visitor', visitorSchema);

// Memory fallback for visit count
let memoryVisitCount = 0;

// Memory database fallback if MongoDB URI is not provided or fails to connect
let memoryReviews = [
  {
    name: "Rajarshi Chatterjee",
    role: "SIH Finalist",
    rating: 5,
    comment: "Souvik's cloud architecture setup was flawless. He deployed our Kubernetes nodes and Vertex AI services within hours during the hackathon!",
    date: "Apr 2026"
  },
  {
    name: "Prof U. Das",
    role: "CSE Professor at Techno Main",
    rating: 5,
    comment: "An exceptionally diligent student. Souvik bridges Frontend and Cloud DevOps with standard design tokens and clean structure.",
    date: "Jan 2026"
  },
  {
    name: "Supriya Satpati",
    role: "Open-source Collaborator",
    rating: 4,
    comment: "Great attention to visual styles. The hacker loading animation transition and full-bleed carousels make this portfolio state-of-the-art.",
    date: "May 2026"
  }
];

// API Endpoints
app.get('/api/reviews', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const dbReviews = await Review.find().sort({ createdAt: -1 });
      return res.json(dbReviews);
    } else {
      return res.json(memoryReviews);
    }
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/reviews', async (req, res) => {
  const { name, role, rating, comment, date } = req.body;

  if (!name || !comment || !rating) {
    return res.status(400).json({ error: 'Name, rating, and comment are required.' });
  }

  const reviewData = {
    name: name.trim(),
    role: role ? role.trim() : 'Visitor',
    rating: Number(rating),
    comment: comment.trim(),
    date: date || new Date().toLocaleDateString([], { month: "short", year: "numeric" })
  };

  try {
    if (mongoose.connection.readyState === 1) {
      const newReview = new Review(reviewData);
      const savedReview = await newReview.save();
      return res.status(201).json(savedReview);
    } else {
      // Add to local memoryReviews
      memoryReviews.unshift(reviewData);
      return res.status(201).json(reviewData);
    }
  } catch (err) {
    console.error('Error saving review:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// --- Visitor Counter Endpoints ---

// GET /api/visits — return current total visit count
app.get('/api/visits', async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      let doc = await Visitor.findOne({ key: 'portfolio_visits' });
      if (!doc) doc = await Visitor.create({ key: 'portfolio_visits', count: 0 });
      return res.json({ count: doc.count });
    } else {
      return res.json({ count: memoryVisitCount });
    }
  } catch (err) {
    console.error('Error fetching visits:', err);
    res.status(500).json({ error: 'Failed to fetch visit count' });
  }
});

// POST /api/visits — increment count by 1 and return new total
app.post('/api/visits', async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      const doc = await Visitor.findOneAndUpdate(
        { key: 'portfolio_visits' },
        { $inc: { count: 1 } },
        { new: true, upsert: true }
      );
      return res.json({ count: doc.count });
    } else {
      memoryVisitCount += 1;
      return res.json({ count: memoryVisitCount });
    }
  } catch (err) {
    console.error('Error incrementing visits:', err);
    res.status(500).json({ error: 'Failed to increment visit count' });
  }
});

// Serve frontend build in production
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // Self-ping to prevent Render spinning down due to inactivity
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
  if (RENDER_URL) {
    console.log(`Self-ping configured for URL: ${RENDER_URL}`);
    setInterval(() => {
      https.get(`${RENDER_URL}/ping`, (res) => {
        console.log(`Self-ping status: ${res.statusCode} at ${new Date().toISOString()}`);
      }).on('error', (err) => {
        console.error('Self-ping failed:', err.message);
      });
    }, 14 * 60 * 1000); // 14 minutes
  }
});
