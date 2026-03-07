import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import Home from "./pages/Home.jsx";
import Analizar from "./pages/Analizar.jsx";
import Stock from "./pages/Stock.jsx";
import Campo from "./pages/Campo.jsx";
import Clima from "./pages/Clima.jsx";
import Login from "./pages/Login.jsx";
import { Notif } from "./components/UI.jsx";
import { useStock } from "./hooks/useStock.js";
import { useNotif } from "./hooks/useNotif.js";
import { useCampos } from "./hooks/useCampos.js";
import { useAuth } from "./hooks/useAuth.js";

export default function App() {
  const { user, login, logout, loading: authLoading, error: authError } = useAuth();
  const { stock, agregarAnimal, eliminarAnimal, totales } = useStock(user);
  const { notif, mostrar } = useNotif();
  const { campos, guardarCampo, campoPrincipal } = useCampos(user);

  // Sin login → pantalla de login
  if (!user) {
    return <Login onLogin={login} loading={authLoading} error={authError} />;
  }

  return (
    <>
      <Notif notif={notif} />
      <Header stockCount={stock.length} tieneCampo={!!campoPrincipal} user={user} onLogout={logout} />
      <Routes>
        <Route path="/"         element={<Home stockCount={stock.length} campoPrincipal={campoPrincipal} />} />
        <Route path="/analizar" element={<Analizar onGuardar={agregarAnimal} notif={mostrar} campoPrincipal={campoPrincipal} />} />
        <Route path="/stock"    element={<Stock stock={stock} onEliminar={eliminarAnimal} totales={totales} />} />
        <Route path="/campo"    element={<Campo campos={campos} onGuardar={guardarCampo} user={user} />} />
        <Route path="/clima"    element={<Clima campoPrincipal={campoPrincipal} />} />
        <Route path="*"         element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
