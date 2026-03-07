require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const rateLimit  = require("express-rate-limit");
const multer     = require("multer");
const axios      = require("axios");
const path       = require("path");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
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
async function analizarConIA(tipoAnimal, edadMeses, pastura, ubicacion, base64Image, mediaType, precioLiniers) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY no configurada");

  const tipoLabel    = TIPO_LABELS[tipoAnimal]  || tipoAnimal;
  const pasturaLabel = PASTURA_LABELS[pastura]  || pastura;
  const baseKg       = BASE_KG[tipoAnimal]      || 250;

  const prompt = `Sos un veterinario experto en ganadería bovina argentina.

TAREA 1 — ANÁLISIS DEL ANIMAL:
${base64Image ? "Analizá la foto de un" : "Estimá datos de un"} ${tipoLabel} de ${edadMeses} meses.
Alimentación: ${pasturaLabel}. Zona: ${ubicacion}.
Peso base esperado: ~${baseKg}kg.
${base64Image ? "Basate en la conformación corporal y estado de carnes visible." : "Usá promedios para la categoría y edad."}

TAREA 2 — DIFERENCIAL DE PRECIO REGIONAL:
El precio de referencia de Liniers para ${tipoLabel} es $${precioLiniers}/kg vivo.
Estimá el diferencial de precio en la zona de ${ubicacion} vs Liniers.
Considerá: distancia a mercados, demanda regional, razas típicas de la zona, logística.
El diferencial puede ser positivo (la zona paga más) o negativo (paga menos).
Típicamente Entre Ríos y Corrientes tienen un descuento de $200-$500/kg por flete.

Respondé SOLO con este JSON sin markdown:
{
  "pesoEstimadoKg": número,
  "condicionCorporal": número_1_al_9,
  "confianza": "alta"|"media"|"baja",
  "observaciones": "texto corto",
  "recomendaciones": "texto corto",
  "diferencialZona": número_puede_ser_negativo,
  "contextoZona": "texto corto explicando el diferencial"
}`;

  const parts = [{ text: prompt }];
  if (base64Image) parts.unshift({ inline_data: { mime_type: mediaType || "image/jpeg", data: base64Image } });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
  const res = await axios.post(url, {
    contents: [{ parts }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
  }, { timeout: 45000 });

  const text = res.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  console.log("Gemini OK:", text.substring(0, 120));
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);

  return {
    pesoEstimadoKg: baseKg, condicionCorporal: 5, confianza: "baja",
    observaciones: "Estimación automática.", recomendaciones: "Subí una foto para mayor precisión.",
    diferencialZona: -300, contextoZona: "Descuento típico por flete desde zona de producción.",
  };
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

    const wxRes = await axios.get("https://api.open-meteo.com/v1/forecast", {
      params: { latitude, longitude, daily: "precipitation_sum,temperature_2m_max", timezone: "auto", forecast_days: 30 },
      timeout: 5000,
    });
    const lluvia = wxRes.data.daily.precipitation_sum.reduce((a, b) => a + b, 0);
    const temp   = wxRes.data.daily.temperature_2m_max.reduce((a, b) => a + b, 0) / wxRes.data.daily.temperature_2m_max.length;
    const fLluvia = Math.min(1.3, Math.max(0.5, lluvia / 80));
    const fTemp   = temp > 30 ? 0.8 : temp < 5 ? 0.7 : 1.0;
    return { factorClima: parseFloat(((fLluvia + fTemp) / 2).toFixed(3)), climaInfo: name, lluvia: Math.round(lluvia), temp: Math.round(temp) };
  } catch (e) {
    console.error("Error clima:", e.message);
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

    // 2. Clima + IA en paralelo
    const [climaData, iaResult] = await Promise.all([
      getClima(ubicacion, lat, lon),
      analizarConIA(tipoAnimal, parseInt(edadMeses), pastura, ubicacion, base64Image, mediaType, precioLiniers),
    ]);

    // 3. Precio zona = Liniers + diferencial estimado por IA
    const diferencial  = iaResult.diferencialZona || -300;
    const precioZona   = Math.max(1000, precioLiniers + diferencial);

    // 4. Proyecciones con ambos precios
    const proyecciones = calcularProyecciones(
      iaResult.pesoEstimadoKg, pastura, climaData.factorClima, precioLiniers, precioZona
    );

    res.json({
      ok: true,
      animal: { tipo: tipoAnimal, edadMeses: parseInt(edadMeses), pastura, ubicacion },
      ia: iaResult,
      clima: climaData,
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

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (req, res) => res.sendFile(path.join(__dirname, "../frontend/dist/index.html")));
}

app.listen(PORT, () => {
  console.log(`🐄 GanaderIA en puerto ${PORT} | IA: Gemini 2.5 Flash`);
  console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "✅ configurada" : "❌ FALTA"}`);
});
