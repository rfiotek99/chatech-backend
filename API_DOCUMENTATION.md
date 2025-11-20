# ChatEch API Documentation

## Base URL
```
https://api.chatech.app
```

---

## Authentication

Todos los endpoints (excepto `/auth/signup` y `/auth/login`) requieren un JWT token en el header:

```
Authorization: Bearer <token>
```

---

## 1. Authentication Endpoints

### Signup
```
POST /api/auth/signup
```

**Body:**
```json
{
  "email": "agencia@example.com",
  "password": "secure_password",
  "companyName": "Mi Agencia Shopify"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "agencia@example.com"
  }
}
```

---

### Login
```
POST /api/auth/login
```

**Body:**
```json
{
  "email": "agencia@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "agencia@example.com"
  }
}
```

---

## 2. Chat Endpoints

### Crear un chat
```
POST /api/chats
```

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "title": "Optimizar velocidad Shopify",
  "region": "argentina"
}
```

**Response:**
```json
{
  "id": 123,
  "user_id": 1,
  "title": "Optimizar velocidad Shopify",
  "region": "argentina",
  "created_at": "2024-11-20T10:30:00Z"
}
```

---

### Obtener todos los chats
```
GET /api/chats
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 123,
    "title": "Optimizar velocidad Shopify",
    "region": "argentina",
    "created_at": "2024-11-20T10:30:00Z"
  },
  {
    "id": 124,
    "title": "Cómo manejar impuestos",
    "region": "argentina",
    "created_at": "2024-11-20T09:15:00Z"
  }
]
```

---

### Obtener mensajes de un chat
```
GET /api/chats/:chatId/messages
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "chat_id": 123,
    "role": "user",
    "content": "¿Cómo optimizo mi Shopify?",
    "created_at": "2024-11-20T10:30:00Z"
  },
  {
    "id": 2,
    "chat_id": 123,
    "role": "assistant",
    "content": "Para optimizar tu Shopify...",
    "created_at": "2024-11-20T10:30:15Z"
  }
]
```

---

## 3. Main API - Enviar mensaje

### Enviar mensaje y obtener respuesta
```
POST /api/chat/message
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "chatId": 123,
  "message": "¿Cómo configuro Mercado Pago en mi Shopify?",
  "region": "argentina"
}
```

**Response:**
```json
{
  "userMessage": {
    "id": 1,
    "chat_id": 123,
    "role": "user",
    "content": "¿Cómo configuro Mercado Pago en mi Shopify?",
    "created_at": "2024-11-20T10:35:00Z"
  },
  "assistantMessage": {
    "id": 2,
    "chat_id": 123,
    "role": "assistant",
    "content": "Para configurar Mercado Pago en Shopify...",
    "created_at": "2024-11-20T10:35:05Z"
  }
}
```

---

## 4. Billing Endpoints

### Crear sesión de pago (Stripe)
```
POST /api/billing/create-checkout-session
```

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "plan": "pro"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_xxxxx",
  "url": "https://checkout.stripe.com/pay/cs_test_xxxxx"
}
```

---

## 5. User Profile

### Obtener perfil del usuario
```
GET /api/profile
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "agencia@example.com",
    "plan": "pro"
  },
  "company": {
    "id": 1,
    "name": "Mi Agencia Shopify",
    "plan": "pro",
    "user_limit": 100,
    "message_limit": 10000
  }
}
```

---

## 6. Health Check

### Verificar estado del servidor
```
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-11-20T10:40:00Z"
}
```

---

## Regiones soportadas

- `argentina` - Responde en español
- `mexico` - Responde en español
- `colombia` - Responde en español
- `españa` - Responde en español
- `usa` - Responde en inglés

---

## Planes y Límites

| Plan | Usuarios | Mensajes/mes | Precio |
|------|----------|--------------|--------|
| **Free** | 10 | 1,000 | Gratis |
| **Pro** | 100 | 10,000 | $299/mes |
| **Enterprise** | 1,000+ | Ilimitados | Custom |

---

## Códigos de error

| Código | Significado |
|--------|-------------|
| 401 | No autorizado (falta token o es inválido) |
| 403 | Acceso denegado |
| 429 | Límite de mensajes alcanzado |
| 500 | Error del servidor |

---

## Ejemplo de integración (JavaScript)

```javascript
// 1. Login
const loginRes = await fetch('https://api.chatech.app/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'agencia@example.com',
    password: 'password'
  })
});

const { token } = await loginRes.json();

// 2. Crear chat
const chatRes = await fetch('https://api.chatech.app/api/chats', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Mi primer chat',
    region: 'argentina'
  })
});

const chat = await chatRes.json();

// 3. Enviar mensaje
const msgRes = await fetch('https://api.chatech.app/api/chat/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    chatId: chat.id,
    message: '¿Cómo optimizo mi Shopify?',
    region: 'argentina'
  })
});

const { assistantMessage } = await msgRes.json();
console.log(assistantMessage.content);
```

---

## Contacto y soporte

- Email: support@chatech.app
- Docs: https://docs.chatech.app
- Status: https://status.chatech.app