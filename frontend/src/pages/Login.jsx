import { useState } from "react";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { Logo, Aviso } from "../components/UI.jsx";

export default function Login({ onLogin, loading, error }) {
  const [username, setUsername] = useState("");
  const listo = !!username.trim() && !loading;

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!username.trim()) return;
    await onLogin(username.trim());
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(1200px 500px at 50% -10%, #dcfce7 0%, var(--bg) 60%)",
      padding: 16,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <Logo size={56} conTexto={false} />
          <h1 style={{ fontSize: 30, fontWeight: 800, marginTop: 14 }}>
            Ganader<span style={{ color: "var(--verde)" }}>IA</span>
          </h1>
          <p style={{ fontSize: 15, color: "var(--sub)", marginTop: 4 }}>
            Peso, valor y engorde de tu hacienda con IA
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: "#fff", borderRadius: 18, padding: "28px 24px",
          boxShadow: "0 10px 30px rgba(15,23,42,0.08)", border: "1px solid var(--borde)",
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Ingresá a tu cuenta</h2>
          <p style={{ fontSize: 14, color: "var(--sub)", marginBottom: 22 }}>
            Escribí tu usuario. Si es la primera vez, la cuenta se crea sola.
          </p>

          <label htmlFor="usuario" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--texto2)", marginBottom: 8 }}>
            Usuario
          </label>
          <input
            id="usuario"
            type="text"
            placeholder="Ej: juan_lopez"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
            autoCapitalize="none"
            autoComplete="username"
            style={{ width: "100%", padding: "13px 14px", fontSize: 16, marginBottom: 6 }}
          />
          <p style={{ fontSize: 12, color: "var(--sub2)", marginBottom: 20 }}>
            Letras, números y guiones. Sin contraseña.
          </p>

          {error && <Aviso tipo="error" icon={AlertTriangle} style={{ marginBottom: 16 }}>{error}</Aviso>}

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!listo}>
            {loading ? "Ingresando..." : <>Ingresar <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
