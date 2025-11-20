# ChatEch Backend

ChatEch es un asistente de IA especializado en e-commerce para Latinoamérica y USA.

## Setup Local

### 1. Clonar y instalar
```bash
git clone https://github.com/tuusuario/chatech-backend.git
cd chatech-backend
npm install
```

### 2. Base de datos (PostgreSQL)
```bash
# Crear base de datos
createdb chatech

# Cargar schema
psql chatech < init.sql
```

### 3. Variables de entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus keys
nano .env
```

**Variables necesarias:**
- `DATABASE_URL` - Conexión a PostgreSQL
- `OPENAI_API_KEY` - API key de OpenAI
- `JWT_SECRET` - Clave secreta para tokens (genera una aleatoria)
- `STRIPE_SECRET_KEY` - Clave secreta de Stripe
- `STRIPE_PUBLISHABLE_KEY` - Clave pública de Stripe
- `STRIPE_WEBHOOK_SECRET` - Webhook secret de Stripe

### 4. Ejecutar localmente
```bash
npm run dev
```

Servidor estará en `http://localhost:5000`

---

## Deploy en Railway

Railway es gratis inicialmente y muy simple para Node.js + PostgreSQL.

### 1. Crear cuenta
- Ir a https://railway.app
- Sign up con GitHub

### 2. Crear proyecto
- Click en "New Project"
- Conectar GitHub repo
- Seleccionar `chatech-backend`

### 3. Agregar PostgreSQL
- En Railway dashboard, click "+Add Service"
- Seleccionar "PostgreSQL"
- Se crea automáticamente una base de datos

### 4. Configurar variables de entorno
En el dashboard de Railway:
1. Click en "Backend" service
2. Variables tab
3. Agregar todas las variables de `.env`

**IMPORTANTE:** Railway proporciona `DATABASE_URL` automáticamente.

### 5. Deploy automático
Cada push a main/master se deploya automáticamente.

---

## Estructura del código

```
chatech-backend/
├── server.js              # Servidor Express principal
├── init.sql               # Schema de PostgreSQL
├── package.json           # Dependencias
├── .env.example           # Variables de entorno
├── .gitignore
├── README.md
└── API_DOCUMENTATION.md   # Docs de la API
```

---

## Endpoints principales

### Auth
- `POST /api/auth/signup` - Crear cuenta
- `POST /api/auth/login` - Login

### Chats
- `POST /api/chats` - Crear chat
- `GET /api/chats` - Obtener chats
- `GET /api/chats/:chatId/messages` - Obtener mensajes

### Main API
- `POST /api/chat/message` - Enviar mensaje y obtener respuesta

### Billing
- `POST /api/billing/create-checkout-session` - Crear sesión de pago Stripe

### User
- `GET /api/profile` - Obtener perfil del usuario

---

## Autenticación

Todos los endpoints protegidos requieren:
```
Authorization: Bearer <JWT_TOKEN>
```

El token se obtiene en login o signup y expira en 7 días.

---

## Límites por plan

### Free
- 10 usuarios por empresa
- 1,000 mensajes/mes
- Precio: Gratis

### Pro
- 100 usuarios por empresa
- 10,000 mensajes/mes
- Precio: $299/mes

### Enterprise
- 1,000+ usuarios
- Ilimitados
- Precio: Custom

---

## OpenAI Setup

1. Ir a https://platform.openai.com/api-keys
2. Crear nueva API key
3. Agregar a `.env` como `OPENAI_API_KEY`

**Nota:** La API key debe tener permisos para gpt-4o-mini

---

## Stripe Setup

1. Ir a https://stripe.com
2. Crear cuenta
3. En Dashboard → API keys
4. Copiar "Secret key" y "Publishable key"
5. Crear productos:
   - Pro: $299/mes
   - Enterprise: custom

6. Obtener los price IDs de cada producto
7. Configurar webhook en Stripe:
   - Endpoint: `https://tu-domain.com/api/webhooks/stripe`
   - Escuchar: `checkout.session.completed`

---

## Desarrollo

### Estructura de respuesta estándar

**Éxito:**
```json
{
  "data": { ... },
  "message": "Success"
}
```

**Error:**
```json
{
  "error": "Error message"
}
```

### Testing

```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# Test health
curl http://localhost:5000/api/health
```

---

## Monitoreo

Para monitorear en producción:
- Railway proporciona logs automáticamente
- Configurar alertas en Stripe para pagos fallidos
- Configurar backups automáticos de BD

---

## Próximas mejoras

- [ ] Rate limiting por IP
- [ ] Caching de respuestas frecuentes
- [ ] Logging centralizado
- [ ] Analytics dashboard
- [ ] Integración con Shopify API
- [ ] Multi-idioma adicionales
- [ ] Branding blanco (white-label)

---

## Soporte

- Docs: Ver `API_DOCUMENTATION.md`
- Issues: GitHub issues
- Email: ramiro@chatech.app

---

## Licencia

MIT