import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Plus, Pencil, Trash2, ChevronDown, Leaf, Ruler, Wallet, Scale, MapPin, ArrowRightLeft, Check } from "lucide-react";
import { Card, SectionTitle, BtnPrimary, BtnSecondary, Label, Input, ChipGrid, PageHeader, EmptyState } from "../components/UI.jsx";
import { TIPOS_PASTURA, TIPOS_ANIMAL } from "../utils/constants.js";
import { formatPesos } from "../utils/helpers.js";

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
    await onAsignarLote(stockId, loteId);
    setMoviendo(null);
  }

  function abrirEditar(lote) {
    setEditando(lote);
    setForm({ nombre: lote.nombre, pastura: lote.pastura || "", hectareas: lote.hectareas || "" });
    setCreando(true);
  }

  if (!campoPrincipal) {
    return (
      <div className="page page-narrow">
        <PageHeader icon={Layers} titulo="Lotes" />
        <EmptyState
          icon={MapPin}
          titulo="Configurá tu campo primero"
          texto="Para organizar lotes y potreros necesitás cargar tu campo."
          accion={<BtnPrimary icon={MapPin} onClick={() => nav("/campo")}>Ir a Mi campo</BtnPrimary>}
        />
      </div>
    );
  }

  // Animales sin lote
  const sinLote = stock.filter(a => !a.lote_id);
  // Animales por lote
  const porLote = (loteId) => stock.filter(a => a.lote_id === loteId);

  const PaletaColor = ["#2563eb","#16a34a","#d97706","#7c3aed","#dc2626","#0891b2","#059669","#b45309"];
  const colorLote = (i) => PaletaColor[i % PaletaColor.length];

  const abrirNuevo = () => { setCreando(true); setEditando(null); setForm({ nombre: "", pastura: "", hectareas: "" }); };

  return (
    <div className="page">
      <PageHeader
        icon={Layers}
        titulo="Lotes"
        sub={`${campoPrincipal.nombre} · ${lotes.length} ${lotes.length === 1 ? "lote" : "lotes"} · ${stock.length} animales`}
        accion={!creando && <BtnPrimary icon={Plus} onClick={abrirNuevo}>Nuevo lote</BtnPrimary>}
      />

      {/* Formulario crear/editar */}
      {creando && (
        <Card className="fade-up" style={{ marginBottom: 18, border: "1px solid var(--verde-border)", boxShadow: "0 0 0 4px var(--verde-dim)" }}>
          <SectionTitle icon={editando ? Pencil : Plus}>{editando ? "Editar lote" : "Nuevo lote"}</SectionTitle>
          <Label>Nombre del lote *</Label>
          <Input placeholder="Ej: Lote Norte, Potrero 3, Recría..." value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} autoFocus />
          <Label>Pastura del lote</Label>
          <ChipGrid options={TIPOS_PASTURA} value={form.pastura} onChange={v => setForm(f => ({ ...f, pastura: v }))} />
          <Label>Superficie (hectáreas)</Label>
          <Input type="number" inputMode="decimal" min="0" step="0.1" placeholder="Ej: 45.5" value={form.hectareas} onChange={e => setForm(f => ({ ...f, hectareas: e.target.value }))} style={{ maxWidth: 200 }} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <BtnSecondary onClick={() => { setCreando(false); setEditando(null); }}>Cancelar</BtnSecondary>
            <BtnPrimary icon={Check} onClick={guardarLote} disabled={!form.nombre.trim()}>{editando ? "Guardar cambios" : "Crear lote"}</BtnPrimary>
          </div>
        </Card>
      )}

      {/* Lista de lotes */}
      {loading && lotes.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40, color: "var(--sub)" }}>Cargando lotes...</Card>
      ) : lotes.length === 0 ? (
        !creando && (
          <EmptyState
            icon={Layers}
            titulo="Todavía no hay lotes"
            texto="Creá lotes o potreros para organizar tus animales y ver cuánto vale cada uno."
            accion={<BtnPrimary icon={Plus} onClick={abrirNuevo}>Crear el primer lote</BtnPrimary>}
          />
        )
      ) : (
        lotes.map((lote, idx) => {
          const animales = porLote(lote.id);
          const valorTotal = animales.reduce((sum, a) => sum + (a.proyecciones?.valorHoy || 0), 0);
          const pesoTotal  = animales.reduce((sum, a) => sum + (a.ia?.pesoEstimadoKg || 0), 0);
          const isOpen = loteSelec === lote.id;
          const color = colorLote(idx);

          return (
            <Card key={lote.id} style={{ marginBottom: 10, padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 18px" }}>
                <div style={{ width: 6, alignSelf: "stretch", borderRadius: 3, background: color, flexShrink: 0 }} />
                <button onClick={() => setLoteSelec(isOpen ? null : lote.id)} aria-expanded={isOpen} style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", padding: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: "var(--texto)" }}>{lote.nombre}</span>
                    <span className="num" style={{ fontSize: 12, fontWeight: 600, color: "var(--sub)", background: "var(--bg2)", padding: "1px 8px", borderRadius: 999 }}>
                      {animales.length} {animales.length === 1 ? "animal" : "animales"}
                    </span>
                  </div>
                  <div className="num" style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, color: "var(--sub)" }}>
                    {lote.pastura && <Dato icon={Leaf}>{TIPOS_PASTURA.find(p => p.id === lote.pastura)?.label || lote.pastura}</Dato>}
                    {lote.hectareas && <Dato icon={Ruler}>{lote.hectareas} ha</Dato>}
                    {animales.length > 0 && <Dato icon={Wallet}>{formatPesos(valorTotal)}</Dato>}
                    {pesoTotal > 0 && <Dato icon={Scale}>{pesoTotal.toLocaleString("es-AR")} kg</Dato>}
                  </div>
                </button>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button onClick={() => abrirEditar(lote)} className="btn btn-ghost btn-icon" aria-label="Editar lote" title="Editar"><Pencil size={17} /></button>
                  <button onClick={() => eliminarLote(lote.id)} className="btn btn-ghost btn-icon" aria-label="Eliminar lote" title="Eliminar" style={{ color: "var(--rojo)" }}><Trash2 size={17} /></button>
                  <button onClick={() => setLoteSelec(isOpen ? null : lote.id)} className="btn btn-ghost btn-icon" aria-label="Ver animales">
                    <ChevronDown size={18} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  </button>
                </div>
              </div>

              {/* Animales del lote */}
              {isOpen && (
                <div className="fade-in" style={{ padding: "12px 18px 16px", borderTop: "1px solid var(--borde)", background: "#fcfcfd" }}>
                  {animales.length === 0 ? (
                    <p style={{ color: "var(--sub)", fontSize: 14, textAlign: "center", padding: "8px 0" }}>
                      No hay animales en este lote. Movelos desde "Sin lote asignado".
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
        <Card style={{ marginTop: 18, padding: 0, overflow: "hidden", background: "#fafafa", borderStyle: "dashed" }}>
          <button onClick={() => setLoteSelec(loteSelec === "sin-lote" ? null : "sin-lote")} aria-expanded={loteSelec === "sin-lote"} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
            padding: "14px 18px", background: "none", border: "none", textAlign: "left",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--texto2)" }}>Sin lote asignado</span>
              <span className="num" style={{ fontSize: 12, fontWeight: 600, color: "var(--ambar)", background: "#fffbeb", padding: "1px 8px", borderRadius: 999 }}>
                {sinLote.length}
              </span>
            </span>
            <ChevronDown size={18} color="var(--sub)" style={{ transform: loteSelec === "sin-lote" ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          {loteSelec === "sin-lote" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 18px 16px" }}>
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

function Dato({ icon: Icono, children }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icono size={14} />{children}</span>;
}

// ── FILA ANIMAL ───────────────────────────────────────────────────────────────
function AnimalRow({ animal, lotes, onMover, colorLote }) {
  const [abierto, setAbierto] = useState(false);
  const ia = animal.ia || {};
  const proy = animal.proyecciones || {};

  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: "10px 12px", border: "1px solid var(--borde)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: "var(--texto)", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {animal.nombre}
          </div>
          <div className="num" style={{ fontSize: 12, color: "var(--sub)" }}>
            {TIPOS_ANIMAL.find(t => t.id === animal.animal?.tipo)?.label} · {ia.pesoEstimadoKg} kg · {formatPesos(proy.valorHoy)}
          </div>
        </div>
        <button onClick={() => setAbierto(!abierto)} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
          <ArrowRightLeft size={14} /> Mover
        </button>
      </div>

      {/* Selector de lote destino */}
      {abierto && (
        <div className="fade-in" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--borde)" }}>
          <p style={{ fontSize: 12, color: "var(--sub)", marginBottom: 8, fontWeight: 600 }}>Mover a:</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {lotes.map((l, i) => {
              const actual = animal.lote_id === l.id;
              return (
                <button key={l.id} onClick={() => onMover(animal.id, l.id)} disabled={actual} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 999, fontSize: 13, fontWeight: 600, opacity: 1,
                  border: `1px solid ${actual ? colorLote(i) : "var(--borde-fuerte)"}`,
                  background: actual ? `${colorLote(i)}14` : "#fff", color: "var(--texto2)",
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: colorLote(i) }} />
                  {l.nombre}
                  {actual && <Check size={13} strokeWidth={3} />}
                </button>
              );
            })}
            {animal.lote_id && (
              <button onClick={() => onMover(animal.id, null)} style={{
                padding: "6px 12px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                border: "1px dashed var(--borde-fuerte)", background: "#fff", color: "var(--sub)",
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
