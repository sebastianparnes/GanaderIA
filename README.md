# 🐄 GanaderIA

Estimá el peso de tu hacienda con IA, proyectá el engorde con datos climáticos reales y conocé el valor de tus animales en el Mercado de Liniers.

## Stack

- **Backend:** Node.js + Express + Anthropic SDK
- **Frontend:** React + Vite + Recharts
- **IA:** Claude Vision (estimación de peso por foto)
- **Clima:** Open-Meteo API (gratuita, sin API key)
- **Deploy:** Railway

---

## Setup local

### 1. Clonar e instalar

```bash
git clone <tu-repo>
cd ganader-ia

# Instalar dependencias
npm install --prefix backend
npm install --prefix frontend
```

### 2. Variables de entorno

```bash
cp backend/.env.example backend/.env
# Editá backend/.env y agregá tu ANTHROPIC_API_KEY
```

### 3. Correr en desarrollo

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

Abrí http://localhost:5173

---

## Deploy en Railway

### Opción A: Desde GitHub (recomendado)

1. Subí este repo a GitHub
2. Entrá a [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Seleccioná el repo
4. En **Variables**, agregá:
   - `ANTHROPIC_API_KEY` = tu clave de Anthropic
   - `NODE_ENV` = `production`
5. Railway detecta el `railway.toml` y hace todo automático ✅

### Opción B: Railway CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway up
# Agregar variables:
railway variables set ANTHROPIC_API_KEY=sk-ant-xxxxx
railway variables set NODE_ENV=production
```

---

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/analizar` | Analizar animal (multipart/form-data) |
| GET | `/api/liniers` | Cotizaciones de referencia |

### POST /api/analizar

**Form fields:**
- `tipoAnimal` (string): `ternero`, `ternera`, `novillo`, `novillito`, `vaquillona`, `vaca`, `toro`
- `edadMeses` (number): edad en meses
- `pastura` (string): `campo_natural`, `festuca`, `alfalfa`, `verdeo_invierno`, `verdeo_verano`, `confinamiento`, `mixto`
- `ubicacion` (string): nombre de la localidad
- `foto` (file, opcional): imagen del animal

---

## Estructura

```
ganader-ia/
├── backend/
│   ├── server.js          # Express API
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/         # Home, Analizar, Stock
│   │   ├── components/    # UI, Header
│   │   ├── hooks/         # useStock, useNotif
│   │   └── utils/         # api, helpers, constants
│   ├── index.html
│   └── vite.config.js
├── railway.toml
└── package.json
```

---

## Nota sobre Liniers

El Mercado de Liniers no tiene API pública oficial. Los precios en esta versión son valores de referencia estimados. Para integrar datos en tiempo real se puede:
- Hacer scraping de [mercadodeliniers.com.ar](https://www.mercadodeliniers.com.ar)
- Suscribirse a un servicio de datos ganaderos como [Agrositio](https://www.agrositio.com.ar)

---

## Roadmap

- [ ] Scraping real de Liniers
- [ ] Autenticación de usuarios
- [ ] Base de datos (PostgreSQL en Railway)
- [ ] Exportar stock a PDF/Excel
- [ ] Alertas de precio por WhatsApp (Twilio)
- [ ] App móvil (React Native)
