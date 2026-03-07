import { useState } from "react";

export default function Login({ onLogin, loading, error }) {
  const [username, setUsername] = useState("");

  async function handleSubmit() {
    if (!username.trim()) return;
    await onLogin(username.trim());
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #f0fdf4 0%, #f8fafc 50%, #eff6ff 100%)",
      padding: 16,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, background: "#dcfce7",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40, margin: "0 auto 16px",
            boxShadow: "0 4px 16px rgba(22,163,74,0.2)",
          }}>🐄</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", fontFamily: "Georgia, serif", marginBottom: 6 }}>
            Ganadr<span style={{ color: "#16a34a" }}>IA</span>
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", letterSpacing: "0.05em" }}>
            Gestión Ganadera Inteligente
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "#fff", borderRadius: 16, padding: "36px 32px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
          border: "1px solid #e2e8f0",
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
            Ingresá a tu cuenta
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28, lineHeight: 1.5 }}>
            Escribí tu nombre de usuario para acceder. Si es la primera vez, te creamos una cuenta automáticamente.
          </p>

          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>
            Nombre de usuario
          </label>
          <input
            type="text"
            placeholder="Ej: juan_lopez"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            autoFocus
            style={{
              width: "100%", padding: "14px 16px", fontSize: 16,
              border: "1.5px solid #cbd5e1", borderRadius: 10,
              outline: "none", marginBottom: 8, boxSizing: "border-box",
              transition: "border-color 0.2s",
              fontFamily: "inherit",
            }}
            onFocus={e => e.target.style.borderColor = "#16a34a"}
            onBlur={e => e.target.style.borderColor = "#cbd5e1"}
          />
          <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 24 }}>
            Solo letras, números y guiones. Sin contraseña.
          </p>

          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
              padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 16,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !username.trim()}
            style={{
              width: "100%", padding: "14px", borderRadius: 10, fontSize: 16,
              fontWeight: 700, border: "none", cursor: loading ? "not-allowed" : "pointer",
              background: loading || !username.trim() ? "#d1fae5" : "#16a34a",
              color: loading || !username.trim() ? "#6ee7b7" : "#fff",
              transition: "all 0.2s",
              boxShadow: !loading && username.trim() ? "0 2px 8px rgba(22,163,74,0.3)" : "none",
            }}
          >
            {loading ? "Ingresando..." : "Ingresar →"}
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 24 }}>
          Tus datos se guardan de forma segura en la nube ☁️
        </p>
      </div>
    </div>
  );
}
