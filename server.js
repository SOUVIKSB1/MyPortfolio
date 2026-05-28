import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Memory database fallback if MongoDB URI is not provided or fails to connect
let memoryReviews = [
  {
    name: "Aman Gupta",
    role: "SIH Finalist Team Lead",
    rating: 5,
    comment: "Souvik's cloud architecture setup was flawless. He deployed our Kubernetes nodes and Vertex AI services within hours during the hackathon!",
    date: "Apr 2025"
  },
  {
    name: "Dr. R. Sen",
    role: "CSE Professor at Techno Main",
    rating: 5,
    comment: "An exceptionally diligent student. Souvik bridges Frontend and Cloud DevOps with standard design tokens and clean structure.",
    date: "Jan 2026"
  },
  {
    name: "Vikram Malhotra",
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

// Serve frontend build in production
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
