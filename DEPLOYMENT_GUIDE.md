# 🚀 Guía de Deployment - ChatEch

Sigue estos pasos para tener ChatEch en producción en 30 minutos.

---

## Paso 1: Preparar GitHub

### 1.1 Crear repositorio
```bash
# En tu máquina local
mkdir chatech-backend
cd chatech-backend
git init
git add .
git commit -m "Initial commit"
```

### 1.2 Subir a GitHub
```bash
# Crear repo en GitHub.com
git remote add origin https://github.com/tuusuario/chatech-backend.git
git branch -M main
git push -u origin main
```

---

## Paso 2: Setup Railway

### 2.1 Crear proyecto
1. Ve a https://railway.app
2. Haz login con GitHub
3. Click en "Create New Project"
4. Selecciona "Deploy from GitHub"
5. Conecta tu cuenta de GitHub
6. Selecciona repositorio `chatech-backend`

### 2.2 Agregar PostgreSQL
1. En dashboard de Railway, tu proyecto
2. Click en "+ Add Service"
3. Selecciona "PostgreSQL"
4. Railway crea automáticamente BD + variables

### 2.3 Variables de entorno
En la sección "Variables" del servicio backend:

```
OPENAI_API_KEY=sk-xxxxxxxxxxxx
JWT_SECRET=generate-a-random-string-here
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_PRICE_PRO=price_xxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
FRONTEND_URL=https://tu-dominio.com
NODE_ENV=production
```

**DATABASE_URL se genera automáticamente.**

### 2.4 Deploy
- Railway detecta `package.json` y `server.js`
- Ejecuta `npm install` automáticamente
- Ejecuta `npm start`
- Se genera URL pública: `https://xxxxx.railway.app`

---

## Paso 3: Setup OpenAI

### 3.1 Obtener API Key
1. Ve a https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copia la key
4. Guárdala en variable Railway: `OPENAI_API_KEY`

### 3.2 Agregar créditos
- Ve a https://platform.openai.com/account/billing/overview
- Agrega método de pago
- Los primeros meses son gratis con límite

---

## Paso 4: Setup Stripe

### 4.1 Crear cuenta
1. Ve a https://stripe.com
2. Haz signup
3. Completa verificación

### 4.2 Obtener keys
1. Ve a https://dashboard.stripe.com/apikeys
2. Copia "Secret key" y "Publishable key"
3. Guarda en variables Railway

### 4.3 Crear productos
1. En Stripe dashboard: "Products" → "Add product"

**Producto 1: Pro**
- Nombre: ChatEch Pro
- Precio: $299/mes
- Tipo: Recurring (Monthly)
- Copia el "Price ID" (price_xxxxx)

**Producto 2: Enterprise**
- Nombre: ChatEch Enterprise
- Precio: Custom
- Tipo: Recurring (Monthly)

3. Guarda los Price IDs en variables Railway

### 4.4 Webhook
1. En Stripe: "Developers" → "Webhooks"
2. Click "+ Add endpoint"
3. URL: `https://xxxxx.railway.app/api/webhooks/stripe`
4. Eventos: `checkout.session.completed`
5. Copia "Signing secret" (whsec_xxxxx)
6. Guarda en Railway

---

## Paso 5: Base de datos

### 5.1 Conectarse a PostgreSQL
Railway proporciona `DATABASE_URL`. Ejecutar:

```bash
# Desde tu máquina (instala psql primero)
psql "postgresql://user:password@host:5432/railway" < init.sql
```

O desde Railway Dashboard:
1. Click en servicio PostgreSQL
2. Tab "Query"
3. Pega el contenido de `init.sql`
4. Ejecuta

---

## Paso 6: Test

### 6.1 Health check
```bash
curl https://xxxxx.railway.app/api/health
```

Debe responder:
```json
{"status":"OK","timestamp":"2024-11-20T..."}
```

### 6.2 Signup
```bash
curl -X POST https://xxxxx.railway.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"testpass123",
    "companyName":"Test Company"
  }'
```

Debe responder con token y usuario.

---

## Paso 7: Frontend

Ahora actualiza tu frontend React para apuntar al backend:

```javascript
// config.js
export const API_URL = 'https://xxxxx.railway.app';
```

---

## Paso 8: Deploy Frontend

Tienes opciones:

### Opción A: Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

### Opción B: Railway también
- Agregar segundo proyecto en Railway
- Conectar tu repo frontend
- Deploy automático

### Opción C: Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

---

## Paso 9: Dominio personalizado

### 9.1 Comprar dominio
- GoDaddy, Namecheap, o AWS Route53

### 9.2 Configurar DNS
En tu proveedor de dominio:

```
chatech-backend.com → API de Railway
chatech.app → Frontend (Vercel/Netlify)
```

---

## Checklist Final

- [ ] GitHub repo creado y sincronizado
- [ ] Railway proyecto creado con PostgreSQL
- [ ] Variables de entorno configuradas
- [ ] OpenAI API key activa
- [ ] Stripe cuenta setup con webhook
- [ ] Base de datos inicializada
- [ ] Health check funcionando
- [ ] Signup/Login funcionando
- [ ] Frontend deployado
- [ ] Dominio configurado
- [ ] HTTPS en ambos (automático en Railway/Vercel)

---

## URLs en producción

```
Backend API:     https://api.chatech.app
Frontend:        https://chatech.app
Docs:            https://docs.chatech.app
Status:          https://status.chatech.app
```

---

## Troubleshooting

### Error: Database connection
- Verifica DATABASE_URL en Railway
- Asegurate de ejecutar `init.sql`

### Error: OpenAI 401
- Verifica OPENAI_API_KEY es correcta
- Que la key tenga créditos

### Error: Stripe webhook falla
- Verifica URL en Stripe dashboard
- Verifica STRIPE_WEBHOOK_SECRET

### Error: CORS en frontend
- Agrega tu dominio frontend a CORS en backend
- Variable FRONTEND_URL en server.js

---

## Monitoreo

### Railway
- Logs: Click en proyecto → logs
- Metrics: RAM, CPU, requests

### Stripe
- Dashboard muestra transacciones
- Alertas por pagos fallidos

### OpenAI
- Dashboard muestra uso
- Alertas por límite de gastos

---

## Escalado futuro

Cuando tengas más usuarios:
- Railway permite upgrades de plan
- PostgreSQL escalable automáticamente
- Agregar Redis para cache
- CDN para frontend (Cloudflare)

---

## Soporte

Si tienes problemas:
1. Revisa logs en Railway
2. Revisa docs en API_DOCUMENTATION.md
3. Verifica variables de entorno
4. Test localmente con `npm run dev`

¡Listo! Deberías tener ChatEch en producción 🚀