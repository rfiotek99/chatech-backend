import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import pkg from 'pg';

const { Pool } = pkg;
const bcrypt = bcryptjs;

dotenv.config();

const app = express();

// Conectar a PostgreSQL con manejo de errores
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  console.log('✅ PostgreSQL pool created');
} catch (e) {
  console.error('Database error:', e.message);
}

app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Variables de entorno con valores por defecto
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-123456';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-key';

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ============ AUTH ROUTES ============

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, companyName } = req.body;
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await pool.query(
      'INSERT INTO users (email, password, company_name, plan) VALUES ($1, $2, $3, $4) RETURNING id, email',
      [email, hashedPassword, companyName, 'free']
    );
    const user = userResult.rows[0];
    await pool.query(
      'INSERT INTO companies (user_id, name, plan, user_limit, message_limit) VALUES ($1, $2, $3, $4, $5)',
      [user.id, companyName, 'free', 10, 1000]
    );
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ CHAT ROUTES ============

app.post('/api/chats', authenticateToken, async (req, res) => {
  try {
    const { title, region } = req.body;
    const result = await pool.query(
      'INSERT INTO chats (user_id, title, region) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, title, region]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chats', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM chats WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chats/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const chatCheck = await pool.query(
      'SELECT * FROM chats WHERE id = $1 AND user_id = $2',
      [req.params.chatId, req.user.userId]
    );
    if (chatCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const result = await pool.query(
      'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
      [req.params.chatId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ CHAT MESSAGE ENDPOINT ============

app.post('/api/chat/message', authenticateToken, async (req, res) => {
  try {
    const { chatId, message, region } = req.body;
    
    const chatCheck = await pool.query(
      'SELECT * FROM chats WHERE id = $1 AND user_id = $2',
      [chatId, req.user.userId]
    );
    if (chatCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Guardar mensaje del usuario
    await pool.query(
      'INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)',
      [chatId, 'user', message]
    );

    // Prompts regionalizados
    const regions = {
      argentina: 'Eres experto en e-commerce para Argentina. Moneda: ARS. Sé conciso y práctico. Responde en español.',
      mexico: 'Eres experto en e-commerce para México. Moneda: MXN. Responde en español.',
      colombia: 'Eres experto en e-commerce para Colombia. Moneda: COP. Responde en español.',
      españa: 'Eres experto en e-commerce para España. Moneda: EUR. Responde en español.',
      usa: 'You are an expert in e-commerce for USA. Currency: USD. Be concise. Respond in English.'
    };

    // Llamar a OpenAI
    const systemPrompt = regions[region] || regions.argentina;
    
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      const data = await openaiResponse.json();
      
      if (data.error) {
        console.error('OpenAI error:', data.error);
        return res.status(500).json({ error: 'OpenAI API error: ' + data.error.message });
      }

      const assistantMessage = data.choices[0].message.content;
      
      // Guardar respuesta
      const botMsgResult = await pool.query(
        'INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3) RETURNING *',
        [chatId, 'assistant', assistantMessage]
      );

      res.json({ assistantMessage: botMsgResult.rows[0] });
    } catch (openaiError) {
      console.error('OpenAI fetch error:', openaiError);
      res.status(500).json({ error: 'Failed to call OpenAI API' });
    }
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ USER ROUTES ============

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await pool.query('SELECT id, email, plan FROM users WHERE id = $1', [req.user.userId]);
    const company = await pool.query('SELECT * FROM companies WHERE user_id = $1', [req.user.userId]);
    res.json({ 
      user: user.rows[0], 
      company: company.rows[0] 
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ HEALTH CHECK ============

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    database: pool ? 'connected' : 'disconnected'
  });
});

// ============ START SERVER ============

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ ChatEch Backend running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
