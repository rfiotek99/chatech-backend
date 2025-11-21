import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'ChatEch Backend is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    test: 'working',
    env: process.env.NODE_ENV || 'development'
  });
});

app.post('/test-post', (req, res) => {
  res.json({ post: 'works' });
});

app.post('/api/chat', (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  res.json({
    userMessage: message,
    botResponse: `Echo: ${message}`,
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`ChatEch Backend running on port ${PORT}`);
});