import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "";
const STORAGE_KEY = "ganader-ia-user";

export function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(username) {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error de login");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch(e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  return { user, login, logout, loading, error };
}
