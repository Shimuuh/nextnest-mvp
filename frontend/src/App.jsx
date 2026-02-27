import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AdminDashboard from "./pages/AdminDashboard";
import OrphanageDashboard from "./pages/OrphanageDashboard";
import ChildProfile from "./pages/ChildProfile";
import DonorDashboard from "./pages/DonorDashboard";
import RiskCheck from "./pages/RiskCheck";
import SchemeMatches from "./pages/SchemeMatches";
import Transition from "./pages/Transition";
import Login from "./pages/Login";
import Chatbot from "./components/Chatbot";

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) {
    // Redirect to their default dashboard if they try to access a restricted one
    const defaultPath = user.role === 'admin' ? '/' : user.role === 'donor' ? '/donor' : '/orphanage';
    return <Navigate to={defaultPath} />;
  }

  return children;
};

// Component to handle the root path based on user role
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'donor') return <Navigate to="/donor" />;
  if (user.role === 'orphanage') return <Navigate to="/orphanage" />;

  return <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          <Route path="/orphanage" element={
            <PrivateRoute roles={["orphanage", "admin"]}>
              <OrphanageDashboard />
            </PrivateRoute>
          } />

          <Route path="/children/:id" element={
            <PrivateRoute roles={["orphanage", "admin"]}>
              <ChildProfile />
            </PrivateRoute>
          } />

          <Route path="/donor" element={
            <PrivateRoute roles={["donor", "admin"]}>
              <DonorDashboard />
            </PrivateRoute>
          } />

          <Route path="/risk" element={
            <PrivateRoute roles={["orphanage", "admin"]}>
              <RiskCheck />
            </PrivateRoute>
          } />
          <Route path="/alerts" element={
            <PrivateRoute roles={["orphanage", "admin"]}>
              <RiskCheck />
            </PrivateRoute>
          } />

          <Route path="/schemes" element={
            <PrivateRoute roles={["orphanage", "admin"]}>
              <SchemeMatches />
            </PrivateRoute>
          } />

          <Route path="/transition" element={
            <PrivateRoute roles={["orphanage", "admin"]}>
              <Transition />
            </PrivateRoute>
          } />
          <Route path="/opportunities" element={
            <PrivateRoute roles={["orphanage", "admin"]}>
              <Transition />
            </PrivateRoute>
          } />

          <Route path="/children" element={
            <PrivateRoute roles={["orphanage", "admin"]}>
              <OrphanageDashboard />
            </PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Chatbot />
      </Router>
    </AuthProvider>
  );
}

export default App;
