import { Routes, Route } from "react-router-dom";
import Header from "./components/Header.jsx";
import Home from "./pages/Home.jsx";
import Analizar from "./pages/Analizar.jsx";
import Stock from "./pages/Stock.jsx";
import Campo from "./pages/Campo.jsx";
import { Notif } from "./components/UI.jsx";
import { useStock } from "./hooks/useStock.js";
import { useNotif } from "./hooks/useNotif.js";
import { useCampos } from "./hooks/useCampos.js";

export default function App() {
  const { stock, agregarAnimal, eliminarAnimal, totales } = useStock();
  const { notif, mostrar } = useNotif();
  const { campos, guardarCampo, campoPrincipal } = useCampos();

  return (
    <>
      <Notif notif={notif} />
      <Header stockCount={stock.length} tieneCampo={!!campoPrincipal} />
      <Routes>
        <Route path="/"         element={<Home stockCount={stock.length} campoPrincipal={campoPrincipal} />} />
        <Route path="/analizar" element={<Analizar onGuardar={agregarAnimal} notif={mostrar} campoPrincipal={campoPrincipal} />} />
        <Route path="/stock"    element={<Stock stock={stock} onEliminar={eliminarAnimal} totales={totales} />} />
        <Route path="/campo"    element={<Campo campos={campos} onGuardar={guardarCampo} />} />
      </Routes>
    </>
  );
}
