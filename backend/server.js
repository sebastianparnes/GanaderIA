require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const rateLimit  = require("express-rate-limit");
const multer     = require("multer");
const axios      = require("axios");
const path       = require("path");
const { createClient } = require("@libsql/client");

const app  = express();
const PORT = process.env.PORT || 3001;

// ── TURSO DB ──────────────────────────────────────────────────────────────────
const db = createClient({
  url:       process.env.TURSO_URL   || "libsql://ganaderia-sebastianparnes.aws-us-east-2.turso.io",
  authToken: process.env.TURSO_TOKEN,
});

async function initDB() {
  await db.batch([
    `CREATE TABLE IF NOT EXISTS usuarios (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      username  TEXT UNIQUE NOT NULL COLLATE NOCASE,
      creado_en TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS campos (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      nombre     TEXT NOT NULL,
      direccion  TEXT,
      lat        REAL,
      lon        REAL,
      pastura    TEXT,
      clima_json TEXT,
      actualizado TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )`,
    `CREATE TABLE IF NOT EXISTS stock (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id  INTEGER NOT NULL,
      campo_id    INTEGER,
      nombre      TEXT NOT NULL,
      data_json   TEXT NOT NULL,
      guardado_en TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )`,
    `CREATE TABLE IF NOT EXISTS lotes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      campo_id    INTEGER NOT NULL,
      usuario_id  INTEGER NOT NULL,
      nombre      TEXT NOT NULL,
      pastura     TEXT,
      hectareas   REAL,
      creado_en   TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campo_id) REFERENCES campos(id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )`,
    `CREATE TABLE IF NOT EXISTS precios_historico (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha     TEXT NOT NULL,
      data_json TEXT NOT NULL,
      UNIQUE(fecha)
    )`,
  ], "write");
  console.log("✅ Turso DB inicializada");
}
initDB().catch(e => console.error("❌ DB init error:", e.message));

// Migraciones opcionales (pueden fallar si ya existen)
async function runMigrations() {
  const migrations = [
    `ALTER TABLE stock ADD COLUMN lote_id INTEGER REFERENCES lotes(id)`,
  ];
  for (const sql of migrations) {
    try { await db.execute(sql); } catch(e) { /* columna ya existe, OK */ }
  }
}
runMigrations().catch(() => {});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: "*", methods: ["GET", "POST", "DELETE"] }));
app.use(express.json({ limit: "20mb" }));
app.use("/api/", rateLimit({ windowMs: 15*60*1000, max: 100, message: { error: "Demasiadas solicitudes." } }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Solo imágenes")),
});

// ── CONSTANTES ────────────────────────────────────────────────────────────────
const FACTOR_PASTURA = {
  campo_natural: 0.6, festuca: 0.75, alfalfa: 1.0,
  verdeo_invierno: 0.85, verdeo_verano: 0.9, confinamiento: 1.2, mixto: 1.1,
};

const BASE_KG = {
  ternero: 150, ternera: 140, novillo: 300,
  novillito: 230, vaquillona: 260, vaca: 380, toro: 500,
};

const TIPO_LABELS = {
  ternero:"Ternero", ternera:"Ternera", novillo:"Novillo", novillito:"Novillito",
  vaquillona:"Vaquillona", vaca:"Vaca", toro:"Toro"
};
const PASTURA_LABELS = {
  campo_natural:"Campo Natural", festuca:"Festuca", alfalfa:"Alfalfa",
  verdeo_invierno:"Verdeo de Invierno", verdeo_verano:"Verdeo de Verano",
  confinamiento:"Feed Lot", mixto:"Mixto"
};

// Fallback si el scraping falla — valores de referencia conocidos
const PRECIOS_FALLBACK = {
  ternero: 5200, ternera: 4900, novillo: 4800, novillito: 5000,
  vaquillona: 4900, vaca: 4100, toro: 4300,
};

// Mapeo categorías Liniers → nuestros tipos
// El HTML de Liniers tiene filas como "NOVILLOS", "NOVILLITOS", "TERNEROS", "VACAS", "VAQUILLONAS"
const LINIERS_MAP = {
  "NOVILLOS":    "novillo",
  "NOVILLITOS":  "novillito",
  "TERNEROS":    "ternero",
  "TERNERAS":    "ternera",
  "VACAS":       "vaca",
  "VAQUILLONAS": "vaquillona",
  "TOROS":       "toro",
};

// ── SCRAPER LINIERS (mercadoagroganadero.com.ar) ───────────────────────────────
// URLs tienen formato: precios-remates-hacienda-DD-MM-YYYY.html
// y también:            precios-remates-tv-exportacion-DD-MM-YYYY.html
// Probamos varios patrones yendo hacia atrás hasta 5 días hábiles

function parseLiniersHtml(html) {
  // Extraemos las filas de la tabla con regex
  // Buscamos el patrón: CATEGORIA ... | min | max | ... | $/kg Pond.
  const precios = {};

  // Buscar todas las filas <tr> que contengan categorías ganaderas
  const filas = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];

  for (const fila of filas) {
    // Limpiar tags HTML para obtener texto
    const texto = fila.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toUpperCase();

    // Buscar categoría en el texto de la fila
    let categoriaEncontrada = null;
    for (const cat of Object.keys(LINIERS_MAP)) {
      if (texto.startsWith(cat) || texto.includes(`| ${cat}`) || texto.includes(`${cat} `)) {
        categoriaEncontrada = cat;
        break;
      }
    }
    if (!categoriaEncontrada) continue;

    // Extraer números de la fila (precios con puntos de miles)
    const nums = texto.match(/\d[\d.]+/g);
    if (!nums || nums.length < 2) continue;

    // Convertir strings con puntos a números: "8.240" → 8240
    const valores = nums
      .map(n => parseInt(n.replace(/\./g, ""), 10))
      .filter(n => n >= 1000 && n <= 50000); // rango razonable $/kg

    if (valores.length === 0) continue;

    // El precio ponderado suele ser el último o el más frecuente
    // Tomamos el máximo como referencia de "muy buena clase" (como dice el sitio)
    const precioRef = Math.max(...valores);
    const tipoNuestro = LINIERS_MAP[categoriaEncontrada];

    if (tipoNuestro && !precios[tipoNuestro]) {
      precios[tipoNuestro] = precioRef;
    }
  }

  return precios;
}

let _cacheLiniers = null;
let _cacheFecha   = null;

async function getPreciosLiniers() {
  // Cache de 4 horas
  const ahora = Date.now();
  if (_cacheLiniers && _cacheFecha && (ahora - _cacheFecha) < 4 * 60 * 60 * 1000) {
    return _cacheLiniers;
  }

  const URL_MAG = "https://www.mercadoagroganadero.com.ar/dll/hacienda1.dll/haciinfo000002";
  const hoy = new Date();

  // Buscar último día hábil con datos (hasta 7 días atrás)
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - i);
    const diaSemana = fecha.getDay();
    if (diaSemana === 0 || diaSemana === 6) continue; // saltar fines de semana

    const d = String(fecha.getDate()).padStart(2, "0");
    const m = String(fecha.getMonth() + 1).padStart(2, "0");
    const y = fecha.getFullYear();
    const fechaStr = `${d}/${m}/${y}`;

    try {
      console.log(`🔍 Scraping MAG: ${fechaStr}`);
      const res = await axios.post(URL_MAG,
        new URLSearchParams({
          ID: "",
          CP: "",
          FLASH: "",
          USUARIO: "SIN IDENTIFICAR",
          OPCIONMENU: "",
          OPCIONSUBMENU: "",
          txtFechaIni: fechaStr,
          txtFechaFin: fechaStr,
        }),
        {
          timeout: 10000,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": URL_MAG,
          },
        }
      );

      const precios = parseLiniersHtml(res.data);
      const keys = Object.keys(precios);
      console.log(`   → ${keys.length} categorías encontradas: ${keys.join(", ")}`);

      if (keys.length >= 2) {
        const preciosCompletos = { ...PRECIOS_FALLBACK, ...precios };
        // Interpolar faltantes desde novillo
        if (precios.novillo) {
          if (!precios.novillito) preciosCompletos.novillito = Math.round(precios.novillo * 1.05);
          if (!precios.ternero)   preciosCompletos.ternero   = Math.round(precios.novillo * 1.10);
          if (!precios.ternera)   preciosCompletos.ternera   = Math.round(precios.novillo * 1.05);
        }

        _cacheLiniers = {
          precios: preciosCompletos,
          preciosRaw: precios,
          fecha: fechaStr,
          fuente: "Mercado Agroganadero S.A. (scraping real)",
          scrapeadoEn: new Date().toISOString(),
        };
        _cacheFecha = ahora;
        // Guardar en histórico Turso
        try {
          await db.execute({
            sql: "INSERT OR IGNORE INTO precios_historico (fecha, data_json) VALUES (?,?)",
            args: [fechaStr, JSON.stringify({ precios: preciosCompletos, preciosRaw: precios })],
          });
        } catch(e) { /* no bloquear si falla */ }
        console.log(`✅ MAG scrapeado OK: ${fechaStr}`);
        return _cacheLiniers;
      }
    } catch (e) {
      console.warn(`⚠️  MAG ${fechaStr}: ${e.message}`);
    }
  }

  console.warn("⚠️  Usando precios fallback");
  _cacheLiniers = {
    precios: PRECIOS_FALLBACK,
    preciosRaw: {},
    fecha: "Sin datos reales",
    fuente: "Referencia estimada (scraping no disponible)",
    scrapeadoEn: new Date().toISOString(),
  };
  _cacheFecha = ahora;
  return _cacheLiniers;
}

// ── GEMINI: SOLO peso animal + diferencial regional ───────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function llamarGemini(parts, intento = 0) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
  try {
    return await axios.post(url, {
      contents: [{ parts }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 3000 },
    }, { timeout: 90000 }); // 90s para imagen satelital
  } catch(e) {
    if (e.response?.status === 429 && intento < 3) {
      const espera = [20000, 40000, 60000][intento];
      console.warn(`⏳ Gemini 429 (intento ${intento+1}), esperando ${espera/1000}s...`);
      await sleep(espera);
      return llamarGemini(parts, intento + 1);
    }
    return null; // después de 3 intentos, devolver null y usar fallback
  }
}

async function analizarConIA(tipoAnimal, edadMeses, pastura, ubicacion, base64Image, mediaType, precioLiniers) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY no configurada");

  const tipoLabel    = TIPO_LABELS[tipoAnimal]  || tipoAnimal;
  const pasturaLabel = PASTURA_LABELS[pastura]  || pastura;
  const baseKg       = BASE_KG[tipoAnimal]      || 250;

  const prompt = `Sos un veterinario ganadero argentino experto. Respondé SOLO con JSON válido, sin texto adicional ni markdown.

${base64Image ? `Mirá la foto y estimá el peso real del animal basándote en su conformación corporal, tamaño, desarrollo muscular y estado de carnes.` : `Estimá el peso según la categoría, edad y alimentación.`}

Categoría: ${tipoLabel}
Edad: ${edadMeses} meses
Alimentación: ${pasturaLabel}
Zona: ${ubicacion}
Precio Liniers referencia: $${precioLiniers}/kg
Diferencial zona (Entre Ríos/NEA tienen descuento por flete vs Liniers): estimá entre -200 y -600

Completá este JSON con valores reales (NO uses valores de ejemplo):
{"pesoEstimadoKg":0,"condicionCorporal":0,"confianza":"","observaciones":"","recomendaciones":"","diferencialZona":0,"contextoZona":""}`;

  const parts = [{ text: prompt }];
  if (base64Image) parts.unshift({ inline_data: { mime_type: mediaType || "image/jpeg", data: base64Image } });

  const res = await llamarGemini(parts);

  if (!res) {
    console.warn("⚠️ Gemini no disponible, usando estimación por defecto");
    return null; // el caller usa fallback
  }

  const rawText = res.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  // Gemini a veces envuelve el JSON en ```json ``` aunque se le pida que no
  const text = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  console.log(`Gemini OK: [${text.length} chars]: >>>${text}<<<`);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch(e) {
      // Intentar reparar JSON truncado cerrando llaves faltantes
      let fixed = jsonMatch[0];
      const open = (fixed.match(/\{/g)||[]).length - (fixed.match(/\}/g)||[]).length;
      fixed += "}".repeat(Math.max(0, open));
      try { return JSON.parse(fixed); } catch(e2) { console.warn("JSON irreparable:", e2.message); }
    }
  }

  return {
    pesoEstimadoKg: baseKg, condicionCorporal: 5, confianza: "baja",
    observaciones: "Estimación automática.", recomendaciones: "Subí una foto para mayor precisión.",
    diferencialZona: -300, contextoZona: "Descuento típico por flete desde zona de producción.",
  };
}

// ── ANÁLISIS SATELITAL DEL CAMPO ──────────────────────────────────────────────
async function getSatelitalBase64(lat, lon) {
  const MAPS_KEY = process.env.MAPS_STATIC_KEY;
  if (!MAPS_KEY) return null;
  try {
    // 400x400 en vez de 640x640 — suficiente para análisis de pasturas, mucho más liviano
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=15&size=400x400&maptype=satellite&key=${MAPS_KEY}`;
    console.log(`🛰️ Descargando imagen satelital: ${lat},${lon}`);
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 8000 });
    const base64 = Buffer.from(res.data).toString("base64");
    console.log(`✅ Imagen satelital OK: ${Math.round(base64.length/1024)}KB`);
    return base64;
  } catch(e) {
    console.warn(`⚠️ Maps Static API error: ${e.message}`);
    return null;
  }
}

async function analizarPasturaSatelital(lat, lon, ubicacion) {
  const imgBase64 = await getSatelitalBase64(lat, lon);
  if (!imgBase64) {
    console.warn("🛰️ No se pudo obtener imagen satelital");
    return null;
  }

  console.log(`🛰️ Imagen lista (${Math.round(imgBase64.length/1024)}KB), mandando a Gemini...`);

  const prompt = `Agrónomo argentino. Analizá esta imagen satelital del campo en ${ubicacion}. Respondé SOLO con JSON válido sin markdown.
{"coberturaVerde":0,"estadoHidrico":"","tipoVegetacion":"","calidadPastura":"","factorPastura":0,"observacionesCampo":"","recomendacionesCampo":""}`;

  const parts = [
    { inline_data: { mime_type: "image/png", data: imgBase64 } },
    { text: prompt },
  ];

  console.log(`🛰️ Llamando Gemini para análisis satelital...`);
  const res = await llamarGemini(parts);
  if (!res) {
    console.warn("🛰️ Gemini devolvió null para análisis satelital");
    return null;
  }

  const rawText = res.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  console.log(`🛰️ Gemini respondió: ${rawText.substring(0, 300)}`);
  const text = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const resultado = JSON.parse(jsonMatch[0]);
      console.log(`✅ Análisis satelital OK: cobertura=${resultado.coberturaVerde}% factor=${resultado.factorPastura}`);
      return resultado;
    } catch(e) {
      console.warn("🛰️ JSON inválido:", e.message);
    }
  }
  console.warn("🛰️ No se encontró JSON en respuesta:", rawText.substring(0, 200));
  return null;
}

  const parts = [
    { inline_data: { mime_type: "image/png", data: imgBase64 } },
    { text: prompt },
  ];

  const res = await llamarGemini(parts);
  if (!res) return null;

  const rawText = res.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const text = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  console.log(`🛰️ Análisis satelital: ${text.substring(0, 200)}`);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch(e) {}
  }
  return null;
}

// ── CLIMA ─────────────────────────────────────────────────────────────────────
async function getClima(ubicacion, lat, lon) {
  try {
    console.log(`🌦️ getClima: ubicacion="${ubicacion}" lat="${lat}" lon="${lon}"`);
    let latitude  = (lat && !isNaN(parseFloat(lat)))  ? parseFloat(lat)  : null;
    let longitude = (lon && !isNaN(parseFloat(lon))) ? parseFloat(lon) : null;
    let name = ubicacion;

    if (!latitude || !longitude) {
      // Geocoding por nombre
      const geoRes = await axios.get("https://geocoding-api.open-meteo.com/v1/search", {
        params: { name: ubicacion, count: 1, language: "es", format: "json" }, timeout: 5000,
      });
      if (!geoRes.data.results?.length) return { factorClima: 1.0, climaInfo: "Ubicación no encontrada", lluvia: null, temp: null };
      latitude  = geoRes.data.results[0].latitude;
      longitude = geoRes.data.results[0].longitude;
      name      = geoRes.data.results[0].name;
    }

    // Validación final antes de llamar a Open-Meteo
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      return { factorClima: 1.0, climaInfo: "Coordenadas inválidas", lluvia: null, temp: null };
    }

    // Intentar Open-Meteo primero, luego wttr.in como fallback
    let lluvia = null, temp = null, wxExtras = {};

    try {
      const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=America%2FArgentina%2FBuenos_Aires&forecast_days=16`;
      console.log(`🌐 Open-Meteo: ${wxUrl}`);
      const wxRes = await axios.get(wxUrl, { timeout: 8000 });
      const daily = wxRes.data.daily;
      // Promedios del pronóstico futuro (próximos 16 días)
      lluvia = daily.precipitation_sum.reduce((a, b) => a + b, 0); // lluvia total proyectada
      temp   = daily.temperature_2m_max.reduce((a, b) => a + b, 0) / daily.temperature_2m_max.length;
      const tempMin = daily.temperature_2m_min.reduce((a, b) => a + b, 0) / daily.temperature_2m_min.length;
      const tempMedia = (temp + tempMin) / 2;
      // Guardar datos extras para el response
      wxExtras = { tempMax: Math.round(temp), tempMin: Math.round(tempMin), tempMedia: Math.round(tempMedia), diasPronostico: daily.time.length };
      temp = tempMedia; // usar temperatura media para el cálculo
      console.log(`✅ Open-Meteo OK: lluvia=${Math.round(lluvia)}mm tempMedia=${Math.round(temp)}°C (próximos ${daily.time.length} días)`);
    } catch (e1) {
      console.warn(`⚠️ Open-Meteo falló (${e1.message}), probando wttr.in...`);
      try {
        const wttrUrl = `https://wttr.in/${latitude},${longitude}?format=j1`;
        const wttrRes = await axios.get(wttrUrl, { timeout: 8000 });
        const weather = wttrRes.data;
        temp = parseFloat(weather.current_condition?.[0]?.temp_C || 20);
        lluvia = parseFloat(weather.weather?.[0]?.hourly?.reduce((a, h) => a + parseFloat(h.precipMM || 0), 0) || 10);
        console.log(`✅ wttr.in OK: lluvia=${Math.round(lluvia)}mm temp=${Math.round(temp)}°C`);
      } catch (e2) {
        console.warn(`⚠️ wttr.in también falló (${e2.message}), usando estimación por zona`);
        // Estimación por latitud para Argentina
        temp = latitude < -35 ? 18 : latitude < -30 ? 22 : 26;
        lluvia = 80; // promedio neutro
      }
    }

    const fLluvia = Math.min(1.3, Math.max(0.5, lluvia / 60)); // 60mm en 16 días = óptimo
    const fTemp   = temp > 28 ? 0.85 : temp < 8 ? 0.75 : 1.0;
    const factorClima = parseFloat(((fLluvia + fTemp) / 2).toFixed(3));
    // Descripción del efecto climático futuro
    let efectoDesc = "";
    if (factorClima >= 1.1) efectoDesc = "Clima favorable: lluvias y temperaturas ideales acelerarán el engorde";
    else if (factorClima >= 0.95) efectoDesc = "Clima normal: no se esperan efectos significativos en el engorde";
    else if (factorClima >= 0.8) efectoDesc = "Clima desfavorable: calor o falta de lluvias reducirán levemente el engorde";
    else efectoDesc = "Clima muy desfavorable: condiciones adversas afectarán significativamente el engorde";

    const resultado = { factorClima, climaInfo: name, lluvia: Math.round(lluvia), temp: Math.round(temp), efectoDesc, ...wxExtras };
    console.log(`✅ Clima final: factor=${factorClima} (${efectoDesc})`);
    return resultado;
  } catch (e) {
    console.error("Error clima:", e.message, e.response?.data || "");
    return { factorClima: 1.0, climaInfo: "Sin datos climáticos", lluvia: null, temp: null };
  }
}

// ── PROYECCIONES ──────────────────────────────────────────────────────────────
function calcularProyecciones(peso, pastura, factorClima, precioLiniers, precioZona) {
  const fp = FACTOR_PASTURA[pastura] || 1.0;
  const ganDiaria = parseFloat((0.7 * fp * factorClima).toFixed(2));
  const peso3m = Math.round(peso + ganDiaria * 90);
  const peso6m = Math.round(peso + ganDiaria * 180);
  const tend = 0.02; // tendencia mensual neutra

  return {
    peso3m, peso6m, ganDiaria,
    liniers: {
      hoy:  Math.round(peso   * precioLiniers),
      mes3: Math.round(peso3m * precioLiniers * Math.pow(1 + tend, 3)),
      mes6: Math.round(peso6m * precioLiniers * Math.pow(1 + tend, 6)),
      precioPorKg: precioLiniers,
    },
    zona: {
      hoy:  Math.round(peso   * precioZona),
      mes3: Math.round(peso3m * precioZona * Math.pow(1 + tend, 3)),
      mes6: Math.round(peso6m * precioZona * Math.pow(1 + tend, 6)),
      precioPorKg: precioZona,
    },
    // compat hacia atrás
    valorHoy: Math.round(peso   * precioLiniers),
    valor3m:  Math.round(peso3m * precioLiniers * Math.pow(1 + tend, 3)),
    valor6m:  Math.round(peso6m * precioLiniers * Math.pow(1 + tend, 6)),
    precioPorKgHoy: precioLiniers,
  };
}

// ── RUTAS ─────────────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok", ia: "gemini-2.5-flash", timestamp: new Date().toISOString() }));

app.get("/api/liniers", async (req, res) => {
  try {
    const data = await getPreciosLiniers();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/analizar", upload.single("foto"), async (req, res) => {
  try {
    const { tipoAnimal, edadMeses, pastura, ubicacion, lat, lon } = req.body;
    if (!tipoAnimal || !edadMeses || !pastura || !ubicacion)
      return res.status(400).json({ error: "Faltan campos requeridos" });

    let base64Image = null, mediaType = null;
    if (req.file) {
      base64Image = req.file.buffer.toString("base64");
      mediaType   = req.file.mimetype;
      console.log(`📷 Foto: ${req.file.originalname} (${Math.round(req.file.size/1024)}KB)`);
    }

    console.log(`🔍 Analizando ${tipoAnimal} en ${ubicacion} | lat=${lat} lon=${lon}`);

    // 1. Obtener precios reales de Liniers (scraping)
    const liniersData = await getPreciosLiniers();
    const precioLiniers = liniersData.precios[tipoAnimal] || PRECIOS_FALLBACK[tipoAnimal] || 4500;

    // 2. Clima + IA + satélite en paralelo
    const latNum = lat && !isNaN(parseFloat(lat)) ? parseFloat(lat) : null;
    const lonNum = lon && !isNaN(parseFloat(lon)) ? parseFloat(lon) : null;

    const [climaData, iaResultRaw, satelitalData] = await Promise.all([
      getClima(ubicacion, lat, lon),
      analizarConIA(tipoAnimal, parseInt(edadMeses), pastura, ubicacion, base64Image, mediaType, precioLiniers),
      (latNum && lonNum) ? analizarPasturaSatelital(latNum, lonNum, ubicacion) : Promise.resolve(null),
    ]);

    // Si tenemos análisis satelital, ajustar el factor de pastura
    const factorPasturaFinal = satelitalData?.factorPastura
      ? (climaData.factorClima * 0.6 + satelitalData.factorPastura * 0.4) // blend clima + satélite
      : climaData.factorClima;

    console.log(`🛰️ Satélite: ${satelitalData ? `factor=${satelitalData.factorPastura} cobertura=${satelitalData.coberturaVerde}%` : "no disponible"}`);


    // 3. Asegurar que iaResult tenga todos los campos necesarios
    const baseKgFallback = BASE_KG[tipoAnimal] || 250;
    const iaFallback = !iaResultRaw;
    const iaResult = {
      pesoEstimadoKg:    iaResultRaw?.pesoEstimadoKg    || baseKgFallback,
      condicionCorporal: iaResultRaw?.condicionCorporal || 5,
      confianza:         iaFallback ? "estimación automática" : (iaResultRaw?.confianza || "baja"),
      observaciones:     iaResultRaw?.observaciones     || "IA temporalmente no disponible. Peso estimado por categoría y edad.",
      recomendaciones:   iaResultRaw?.recomendaciones   || "Intentá analizar de nuevo en unos minutos para obtener la estimación con IA.",
      diferencialZona:   iaResultRaw?.diferencialZona   ?? -300,
      contextoZona:      iaResultRaw?.contextoZona      || "Descuento estimado por flete.",
      iaDisponible:      !iaFallback,
    };
    console.log(`📊 IA result: peso=${iaResult.pesoEstimadoKg}kg confianza=${iaResult.confianza} diferencial=${iaResult.diferencialZona}`);

    // 4. Precio zona = Liniers + diferencial estimado por IA
    const diferencial  = iaResult.diferencialZona;
    const precioZona   = Math.max(1000, precioLiniers + diferencial);

    // 4. Proyecciones con factor blended (clima + satélite)
    const proyecciones = calcularProyecciones(
      iaResult.pesoEstimadoKg, pastura, factorPasturaFinal, precioLiniers, precioZona
    );

    res.json({
      ok: true,
      animal: { tipo: tipoAnimal, edadMeses: parseInt(edadMeses), pastura, ubicacion },
      ia: iaResult,
      clima: climaData,
      satelital: satelitalData,
      proyecciones,
      precios: {
        liniers: {
          precioPorKg: precioLiniers,
          fecha: liniersData.fecha,
          fuente: liniersData.fuente,
          url: liniersData.url,
        },
        zona: {
          precioPorKg: precioZona,
          diferencial,
          contexto: iaResult.contextoZona,
          fuente: `Estimación regional IA para ${ubicacion}`,
        },
        nota: "Precio Liniers: scraping real del día. Precio zona: Liniers ± diferencial estimado por IA.",
      },
      generadoEn: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Error:", err.message);
    if (err.response?.data) console.error("API:", JSON.stringify(err.response.data).substring(0, 300));
    res.status(500).json({ error: err.message || "Error interno" });
  }
});

// ── AUTH ──────────────────────────────────────────────────────────────────────
// Login / registro sin contraseña — solo username
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username?.trim()) return res.status(400).json({ error: "Nombre de usuario requerido" });
    const name = username.trim().toLowerCase().replace(/[^a-z0-9_\-áéíóúñü]/gi, "").slice(0, 30);
    if (!name) return res.status(400).json({ error: "Nombre inválido" });

    // Buscar o crear usuario
    let user = await db.execute({ sql: "SELECT * FROM usuarios WHERE username = ?", args: [name] });
    if (user.rows.length === 0) {
      const ins = await db.execute({ sql: "INSERT INTO usuarios (username) VALUES (?)", args: [name] });
      user = await db.execute({ sql: "SELECT * FROM usuarios WHERE id = ?", args: [ins.lastInsertRowid] });
      console.log(`👤 Nuevo usuario: ${name}`);
    } else {
      console.log(`👤 Login: ${name}`);
    }
    const u = user.rows[0];
    res.json({ ok: true, user: { id: Number(u.id), username: u.username, creado_en: u.creado_en } });
  } catch(e) {
    console.error("Auth error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── CAMPOS ────────────────────────────────────────────────────────────────────
app.get("/api/campos/:userId", async (req, res) => {
  try {
    const r = await db.execute({ sql: "SELECT * FROM campos WHERE usuario_id = ? ORDER BY id ASC", args: [req.params.userId] });
    const campos = r.rows.map(c => ({
      id: Number(c.id), nombre: c.nombre, direccion: c.direccion,
      lat: c.lat, lon: c.lon, pastura: c.pastura,
      clima: c.clima_json ? JSON.parse(c.clima_json) : null,
      actualizado: c.actualizado,
    }));
    res.json({ campos });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/campos", async (req, res) => {
  try {
    const { usuario_id, id, nombre, direccion, lat, lon, pastura, clima } = req.body;
    if (!usuario_id || !nombre) return res.status(400).json({ error: "Faltan datos" });
    const climaStr = clima ? JSON.stringify(clima) : null;

    if (id) {
      // Actualizar campo existente
      await db.execute({
        sql: "UPDATE campos SET nombre=?, direccion=?, lat=?, lon=?, pastura=?, clima_json=?, actualizado=datetime('now') WHERE id=? AND usuario_id=?",
        args: [nombre, direccion||null, lat||null, lon||null, pastura||null, climaStr, id, usuario_id],
      });
      res.json({ ok: true, id });
    } else {
      // Crear campo nuevo
      const ins = await db.execute({
        sql: "INSERT INTO campos (usuario_id, nombre, direccion, lat, lon, pastura, clima_json) VALUES (?,?,?,?,?,?,?)",
        args: [usuario_id, nombre, direccion||null, lat||null, lon||null, pastura||null, climaStr],
      });
      res.json({ ok: true, id: Number(ins.lastInsertRowid) });
    }
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/campos/clima", async (req, res) => {
  try {
    const { campo_id, usuario_id, clima } = req.body;
    await db.execute({
      sql: "UPDATE campos SET clima_json=?, actualizado=datetime('now') WHERE id=? AND usuario_id=?",
      args: [JSON.stringify(clima), campo_id, usuario_id],
    });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── STOCK ─────────────────────────────────────────────────────────────────────
app.get("/api/stock/:userId", async (req, res) => {
  try {
    const r = await db.execute({ sql: "SELECT * FROM stock WHERE usuario_id = ? ORDER BY guardado_en DESC", args: [req.params.userId] });
    const stock = r.rows.map(s => ({ id: Number(s.id), nombre: s.nombre, guardado_en: s.guardado_en, ...JSON.parse(s.data_json) }));
    res.json({ stock });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/stock", async (req, res) => {
  try {
    const { usuario_id, campo_id, nombre, ...data } = req.body;
    if (!usuario_id || !nombre) return res.status(400).json({ error: "Faltan datos" });
    const ins = await db.execute({
      sql: "INSERT INTO stock (usuario_id, campo_id, nombre, data_json) VALUES (?,?,?,?)",
      args: [usuario_id, campo_id||null, nombre, JSON.stringify(data)],
    });
    res.json({ ok: true, id: Number(ins.lastInsertRowid) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/stock/delete", async (req, res) => {
  try {
    const { id, usuario_id } = req.body;
    await db.execute({ sql: "DELETE FROM stock WHERE id=? AND usuario_id=?", args: [id, usuario_id] });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── LOTES ─────────────────────────────────────────────────────────────────────
app.get("/api/lotes/:campoId", async (req, res) => {
  try {
    const r = await db.execute({
      sql: `SELECT l.*, 
              (SELECT COUNT(*) FROM stock s WHERE s.lote_id = l.id) as cantidad_animales
            FROM lotes l WHERE l.campo_id = ? ORDER BY l.id ASC`,
      args: [req.params.campoId],
    });
    const lotes = r.rows.map(l => ({
      id: Number(l.id), campo_id: Number(l.campo_id), nombre: l.nombre,
      pastura: l.pastura, hectareas: l.hectareas,
      cantidad_animales: Number(l.cantidad_animales), creado_en: l.creado_en,
    }));
    res.json({ lotes });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/lotes", async (req, res) => {
  try {
    const { id, campo_id, usuario_id, nombre, pastura, hectareas } = req.body;
    if (!campo_id || !usuario_id || !nombre) return res.status(400).json({ error: "Faltan datos" });
    if (id) {
      await db.execute({
        sql: "UPDATE lotes SET nombre=?, pastura=?, hectareas=? WHERE id=? AND usuario_id=?",
        args: [nombre, pastura||null, hectareas||null, id, usuario_id],
      });
      res.json({ ok: true, id });
    } else {
      const ins = await db.execute({
        sql: "INSERT INTO lotes (campo_id, usuario_id, nombre, pastura, hectareas) VALUES (?,?,?,?,?)",
        args: [campo_id, usuario_id, nombre, pastura||null, hectareas||null],
      });
      res.json({ ok: true, id: Number(ins.lastInsertRowid) });
    }
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/lotes/delete", async (req, res) => {
  try {
    const { id, usuario_id } = req.body;
    // Desasignar animales del lote antes de borrar
    await db.execute({ sql: "UPDATE stock SET lote_id=NULL WHERE lote_id=?", args: [id] });
    await db.execute({ sql: "DELETE FROM lotes WHERE id=? AND usuario_id=?", args: [id, usuario_id] });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Asignar animal a lote
app.post("/api/stock/asignar-lote", async (req, res) => {
  try {
    const { stock_id, lote_id, usuario_id } = req.body;
    await db.execute({
      sql: "UPDATE stock SET lote_id=? WHERE id=? AND usuario_id=?",
      args: [lote_id || null, stock_id, usuario_id],
    });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Stock por lote
app.get("/api/stock/:userId/lote/:loteId", async (req, res) => {
  try {
    const { userId, loteId } = req.params;
    const sql = loteId === "sin-lote"
      ? { sql: "SELECT * FROM stock WHERE usuario_id=? AND lote_id IS NULL ORDER BY guardado_en DESC", args: [userId] }
      : { sql: "SELECT * FROM stock WHERE usuario_id=? AND lote_id=? ORDER BY guardado_en DESC", args: [userId, loteId] };
    const r = await db.execute(sql);
    const stock = r.rows.map(s => ({ id: Number(s.id), nombre: s.nombre, lote_id: s.lote_id ? Number(s.lote_id) : null, guardado_en: s.guardado_en, ...JSON.parse(s.data_json) }));
    res.json({ stock });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── LINIERS HISTÓRICO ──────────────────────────────────────────────────────────
app.get("/api/liniers/historico", async (req, res) => {
  try {
    // Devolver los últimos 30 registros guardados
    const r = await db.execute("SELECT fecha, data_json FROM precios_historico ORDER BY fecha DESC LIMIT 30");
    const historico = r.rows.map(row => ({ fecha: row.fecha, ...JSON.parse(row.data_json) }));
    res.json({ historico });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── ANÁLISIS SATELITAL DIRECTO (para página Mi Campo) ─────────────────────────
// Paso 1: solo devuelve la URL de la imagen (instantáneo)
app.get("/api/satelital/imagen", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: "lat/lon requeridos" });
  const MAPS_KEY = process.env.MAPS_STATIC_KEY;
  if (!MAPS_KEY) return res.status(503).json({ error: "MAPS_STATIC_KEY no configurada" });
  const imgUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=15&size=400x400&maptype=satellite&key=${MAPS_KEY}`;
  res.json({ imgUrl });
});

// Paso 2: análisis completo con Gemini (puede tardar 20-40s)
app.get("/api/satelital", async (req, res) => {
  try {
    const { lat, lon, ubicacion } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "lat/lon requeridos" });
    console.log(`🛰️ Iniciando análisis satelital: ${lat},${lon} - ${ubicacion}`);
    const resultado = await analizarPasturaSatelital(parseFloat(lat), parseFloat(lon), ubicacion || `${lat},${lon}`);
    console.log(`🛰️ Resultado: ${JSON.stringify(resultado)?.substring(0, 100)}`);
    if (!resultado) return res.status(503).json({ error: "Análisis satelital no disponible" });
    const MAPS_KEY = process.env.MAPS_STATIC_KEY;
    const imgUrl = MAPS_KEY
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=15&size=400x400&maptype=satellite&key=${MAPS_KEY}`
      : null;
    res.json({ ...resultado, imgUrl });
  } catch(e) {
    console.error("🛰️ Error en análisis satelital:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── CLIMA CAMPO (endpoint público con lat/lon) ─────────────────────────────────
app.get("/api/clima", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "lat/lon requeridos" });
    const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max&hourly=relativehumidity_2m&timezone=America%2FArgentina%2FBuenos_Aires&forecast_days=14`;
    const r = await axios.get(wxUrl, { timeout: 8000 });
    res.json(r.data);
  } catch(e) {
    // fallback wttr.in
    try {
      const { lat, lon } = req.query;
      const r2 = await axios.get(`https://wttr.in/${lat},${lon}?format=j1`, { timeout: 8000 });
      res.json({ wttr: r2.data });
    } catch(e2) {
      res.status(500).json({ error: "No se pudo obtener el clima" });
    }
  }
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => res.sendFile(path.join(__dirname, "../frontend/dist/index.html")));
}

app.listen(PORT, () => {
  console.log(`🐄 GanaderIA en puerto ${PORT} | IA: Gemini 2.5 Flash`);
  console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "✅ configurada" : "❌ FALTA"}`);
});
