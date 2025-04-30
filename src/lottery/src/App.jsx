import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SelectNumbers from "./pages/SelectNumbers";
import History from "./pages/History";
import AdminPanel from "./pages/AdminPanel";
import LotteryPage from "./pages/LotteryPage";

function App() {
  return (
    <BrowserRouter basename="/lottery">
      <Routes>
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/" element={<LotteryPage />} />
        <Route path="/select/:part" element={<SelectNumbers />} />
        <Route path="/history" element={<History />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
