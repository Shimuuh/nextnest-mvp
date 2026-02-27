import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import DonorDashboard from "./pages/DonorDashboard";
import RiskCheck from "./pages/RiskCheck";
import SchemeMatches from "./pages/SchemeMatches";
import Transition from "./pages/Transition";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/donor" element={<DonorDashboard />} />
        <Route path="/risk" element={<RiskCheck />} />
        <Route path="/schemes" element={<SchemeMatches />} />
        <Route path="/transition" element={<Transition />} />
      </Routes>
    </Router>
  );
}

export default App;
