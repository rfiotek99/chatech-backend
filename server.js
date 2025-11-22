import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambiar-en-produccion';

app.use(express.json());
app.use(cors());

// Base de datos simulada (en memoria)
const users = [];
const chats = [];

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Health check
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

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password requeridos' });
    }

    // Verificar si el usuario ya existe
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Usuario ya existe' });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(user);

    // Generar token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'Usuario registrado',
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password requeridos' });
    }

    // Buscar usuario
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login exitoso',
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chat con autenticación
app.get('/api/chat', verifyToken, async (req, res) => {
  const message = req.query.message;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
        max_tokens: 150
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error.message });
    }

    const botResponse = data.choices[0].message.content;

    // Guardar chat en la "base de datos"
    const chat = {
      id: Date.now().toString(),
      userId: req.userId,
      userMessage: message,
      botResponse: botResponse,
      timestamp: new Date().toISOString()
    };
    chats.push(chat);

    res.json({
      userMessage: message,
      botResponse: botResponse,
      timestamp: chat.timestamp
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Catch all
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`ChatEch Backend running on port ${PORT}`);
});
