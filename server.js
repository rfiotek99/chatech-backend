import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Health check - endpoint básico
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'ChatEch Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    test: 'working',
    env: process.env.NODE_ENV || 'development'
  });
});

// Catch all
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ ChatEch Backend running on port ${PORT}`);
});