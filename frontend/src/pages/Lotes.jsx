import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, SectionTitle, BtnPrimary, BtnSecondary, Label, Input, ChipGrid } from "../components/UI.jsx";
import { TIPOS_PASTURA } from "../utils/constants.js";
import { formatPesos } from "../utils/helpers.js";
import { TIPOS_ANIMAL, TIPO_EMOJI } from "../utils/constants.js";

const API = import.meta.env.VITE_API_URL || "";

export default function Lotes({ campoPrincipal, user, stock, onAsignarLote }) {
  const nav = useNavigate();
  const [lotes, setLotes]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [creando, setCreando]       = useState(false);
  const [editando, setEditando]     = useState(null); // lote a editar
  const [form, setForm]             = useState({ nombre: "", pastura: "", hectareas: "" });
  const [loteSelec, setLoteSelec]   = useState(null); // para ver animales del lote
  const [moviendo, setMoviendo]     = useState(null); // animal que se está moviendo

  useEffect(() => {
    if (campoPrincipal?.id) cargarLotes();
  }, [campoPrincipal?.id]);

  async function cargarLotes() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/lotes/${campoPrincipal.id}`);
      const d = await r.json();
      setLotes(d.lotes || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function guardarLote() {
    if (!form.nombre.trim()) return;
    try {
      const body = {
        id: editando?.id || null,
        campo_id: campoPrincipal.id,
        usuario_id: user.id,
        nombre: form.nombre.trim(),
        pastura: form.pastura || null,
        hectareas: form.hectareas ? parseFloat(form.hectareas) : null,
      };
      await fetch(`${API}/api/lotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setCreando(false); setEditando(null);
      setForm({ nombre: "", pastura: "", hectareas: "" });
      await cargarLotes();
    } catch(e) { console.error(e); }
  }

  async function eliminarLote(id) {
    if (!confirm("¿Eliminar este lote? Los animales quedarán sin lote asignado.")) return;
    await fetch(`${API}/api/lotes/delete`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, usuario_id: user.id }),
    });
    await cargarLotes();
  }

  async function asignarLote(stockId, loteId) {
    await fetch(`${API}/api/stock/asignar-lote`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock_id: stockId, lote_id: loteId, usuario_id: user.id }),
    });
    if (onAsignarLote) onAsignarLote(stockId, loteId);
    setMoviendo(null);
  }

  function abrirEditar(lote) {
    setEditando(lote);
    setForm({ nombre: lote.nombre, pastura: lote.pastura || "", hectareas: lote.hectareas || "" });
    setCreando(true);
  }

  if (!campoPrincipal) {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🌾</div>
        <h2 style={{ fontSize: 22, color: "#1e293b", marginBottom: 10 }}>Configurá tu campo primero</h2>
        <p style={{ color: "#64748b", fontSize: 15, marginBottom: 24 }}>
          Para gestionar lotes necesitás configurar tu campo en "Mi Campo".
        </p>
        <BtnPrimary onClick={() => nav("/campo")}>Ir a Mi Campo →</BtnPrimary>
      </div>
    );
  }

  // Animales sin lote
  const sinLote = stock.filter(a => !a.lote_id);
  // Animales por lote
  const porLote = (loteId) => stock.filter(a => a.lote_id === loteId);

  const PaletaColor = ["#2563eb","#16a34a","#d97706","#7c3aed","#dc2626","#0891b2","#059669","#b45309"];
  const colorLote = (i) => PaletaColor[i % PaletaColor.length];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: "clamp(20px,4vw,26px)", fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
            🗂️ Lotes — {campoPrincipal.nombre}
          </h2>
          <p style={{ fontSize: 13, color: "#64748b" }}>
            {lotes.length} lotes · {stock.length} animales en total
          </p>
        </div>
        {!creando && (
          <BtnPrimary onClick={() => { setCreando(true); setEditando(null); setForm({ nombre: "", pastura: "", hectareas: "" }); }}>
            + Nuevo Lote
          </BtnPrimary>
        )}
      </div>

      {/* Formulario crear/editar */}
      {creando && (
        <Card style={{ marginBottom: 24, border: "2px solid #bbf7d0", background: "#f0fdf4" }}>
          <SectionTitle>{editando ? "✏️ EDITAR LOTE" : "➕ NUEVO LOTE"}</SectionTitle>
          <Label>Nombre del lote *</Label>
          <Input placeholder="Ej: Lote Norte, Potrero 3, Recría..." value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          <Label>Pastura del lote</Label>
          <ChipGrid options={TIPOS_PASTURA} value={form.pastura} onChange={v => setForm(f => ({ ...f, pastura: v }))} />
          <Label>Superficie (hectáreas)</Label>
          <Input type="number" min="0" step="0.1" placeholder="Ej: 45.5" value={form.hectareas} onChange={e => setForm(f => ({ ...f, hectareas: e.target.value }))} style={{ maxWidth: 200 }} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <BtnSecondary onClick={() => { setCreando(false); setEditando(null); }}>Cancelar</BtnSecondary>
            <BtnPrimary onClick={guardarLote}>{editando ? "Guardar cambios" : "Crear Lote"}</BtnPrimary>
          </div>
        </Card>
      )}

      {/* Lista de lotes */}
      {loading ? (
        <Card style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Cargando lotes...</Card>
      ) : lotes.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🗂️</div>
          <p style={{ color: "#64748b", fontSize: 15 }}>Todavía no creaste ningún lote. Creá uno para organizar tus animales.</p>
        </Card>
      ) : (
        lotes.map((lote, idx) => {
          const animales = porLote(lote.id);
          const valorTotal = animales.reduce((sum, a) => sum + (a.proyecciones?.valorHoy || 0), 0);
          const pesoTotal  = animales.reduce((sum, a) => sum + (a.ia?.pesoEstimadoKg || 0), 0);
          const isOpen = loteSelec === lote.id;
          const color = colorLote(idx);

          return (
            <Card key={lote.id} style={{ marginBottom: 14, borderLeft: `4px solid ${color}` }}>
              {/* Header lote */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setLoteSelec(isOpen ? null : lote.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{lote.nombre}</span>
                    <span style={{ fontSize: 12, color: "#64748b", background: "#f1f5f9", padding: "2px 10px", borderRadius: 20 }}>
                      {animales.length} animales
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#64748b" }}>
                    {lote.pastura && <span>🌿 {TIPOS_PASTURA.find(p => p.id === lote.pastura)?.label || lote.pastura}</span>}
                    {lote.hectareas && <span>📐 {lote.hectareas} ha</span>}
                    {animales.length > 0 && <span>💰 {formatPesos(valorTotal)}</span>}
                    {pesoTotal > 0 && <span>⚖️ {pesoTotal} kg en pie</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => abrirEditar(lote)} style={{ padding: "6px 12px", borderRadius: 7, border: "1.5px solid #e2e8f0", background: "#fff", color: "#374151", cursor: "pointer", fontSize: 13 }}>✏️</button>
                  <button onClick={() => eliminarLote(lote.id)} style={{ padding: "6px 12px", borderRadius: 7, border: "1.5px solid #fecaca", background: "#fff", color: "#dc2626", cursor: "pointer", fontSize: 13 }}>🗑</button>
                  <button onClick={() => setLoteSelec(isOpen ? null : lote.id)} style={{ padding: "6px 14px", borderRadius: 7, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#374151", cursor: "pointer", fontSize: 13 }}>
                    {isOpen ? "▲ Cerrar" : "▼ Ver animales"}
                  </button>
                </div>
              </div>

              {/* Animales del lote */}
              {isOpen && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #e2e8f0" }}>
                  {animales.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "12px 0" }}>
                      No hay animales en este lote. Asigná animales desde la sección de sin lote.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {animales.map(a => (
                        <AnimalRow key={a.id} animal={a} lotes={lotes} onMover={asignarLote} colorLote={colorLote} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })
      )}

      {/* Animales sin lote */}
      {sinLote.length > 0 && (
        <Card style={{ marginTop: 8, borderLeft: "4px solid #cbd5e1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, cursor: "pointer" }}
            onClick={() => setLoteSelec(loteSelec === "sin-lote" ? null : "sin-lote")}>
            <div>
              <span style={{ fontSize: 17, fontWeight: 700, color: "#475569" }}>Sin lote asignado</span>
              <span style={{ marginLeft: 10, fontSize: 12, color: "#64748b", background: "#f1f5f9", padding: "2px 10px", borderRadius: 20 }}>
                {sinLote.length} animales
              </span>
            </div>
            <span style={{ fontSize: 13, color: "#64748b" }}>{loteSelec === "sin-lote" ? "▲ Cerrar" : "▼ Ver"}</span>
          </div>
          {loteSelec === "sin-lote" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sinLote.map(a => (
                <AnimalRow key={a.id} animal={a} lotes={lotes} onMover={asignarLote} colorLote={colorLote} />
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ── FILA ANIMAL ───────────────────────────────────────────────────────────────
function AnimalRow({ animal, lotes, onMover, colorLote }) {
  const [abierto, setAbierto] = useState(false);
  const ia = animal.ia || {};
  const proy = animal.proyecciones || {};

  return (
    <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
            {TIPO_EMOJI[animal.animal?.tipo] || "🐄"} {animal.nombre}
          </span>
          <span style={{ marginLeft: 10, fontSize: 12, color: "#64748b" }}>
            {ia.pesoEstimadoKg} kg · CC {ia.condicionCorporal}/9
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>{formatPesos(proy.valorHoy)}</span>
          <button onClick={() => setAbierto(!abierto)} style={{
            padding: "5px 12px", borderRadius: 7, border: "1.5px solid #e2e8f0",
            background: "#fff", color: "#374151", cursor: "pointer", fontSize: 12,
          }}>
            {abierto ? "▲" : "Mover"}
          </button>
        </div>
      </div>

      {/* Selector de lote destino */}
      {abierto && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Mover a:</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {lotes.map((l, i) => (
              <button key={l.id} onClick={() => onMover(animal.id, l.id)}
                disabled={animal.lote_id === l.id}
                style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 13,
                  border: `1.5px solid ${colorLote(i)}`,
                  background: animal.lote_id === l.id ? `${colorLote(i)}20` : "#fff",
                  color: colorLote(i), cursor: animal.lote_id === l.id ? "default" : "pointer",
                  fontWeight: animal.lote_id === l.id ? 700 : 400,
                }}>
                {l.nombre} {animal.lote_id === l.id ? "✓" : ""}
              </button>
            ))}
            {animal.lote_id && (
              <button onClick={() => onMover(animal.id, null)} style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 13,
                border: "1.5px solid #cbd5e1", background: "#fff", color: "#64748b", cursor: "pointer",
              }}>
                Sin lote
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
