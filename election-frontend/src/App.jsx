import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SubmitResult from "./pages/SubmitResult";
import ReportIncident from "./pages/ReportIncident";
import WardCollationReport from "./pages/WardCollationReport";
import PUDetail from "./pages/PUDetail";
import AdminFlags from "./pages/AdminFlags";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLocation from "./pages/AdminLocation";
import NationalWardCommand from "./pages/NationalWardCommand";
import PublicDashboard from "./pages/PublicDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";

// Layout
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Login />} />
        <Route path="/public" element={<PublicDashboard />} />

        {/* PROTECTED ROUTES INHERITING CORE SIDEBAR/HEADER LAYOUT */}
        <Route element={<Layout />}>

          {/* GENERAL DASHBOARD AXIS */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/*🗳️ POLLING AGENT CORE VIEWS */}
          <Route path="/submit" element={
            <ProtectedRoute allowedRoles={["POLLING_AGENT"]}>
              <SubmitResult />
            </ProtectedRoute>
          } />
          <Route path="/report-incident" element={
            <ProtectedRoute allowedRoles={["POLLING_AGENT"]}>
              <ReportIncident />
            </ProtectedRoute>
          } />

          {/* 📊 WARD AGENT LAYER VIEWS */}
          <Route path="/ward" element={
            <ProtectedRoute allowedRoles={["WARD_AGENT"]}>
              <WardCollationReport/>
            </ProtectedRoute>
          } />
          <Route path="/pu/:id" element={
            <ProtectedRoute allowedRoles={["WARD_AGENT"]}>
              <PUDetail />
            </ProtectedRoute>
          } />

          {/* 🖥️ GLOBAL ADMINISTRATIVE VIEWPORTS */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/flags" element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminFlags />
            </ProtectedRoute>
          } />
          <Route path="/admin/location" element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminLocation />
            </ProtectedRoute>
          } />
          <Route path="/admin/national-reports" element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <NationalWardCommand />
            </ProtectedRoute>
          } />

        </Route> {/* Correctly terminates the global Layout framework wrapper node */}

        {/* FALLBACK REDIRECT TO LOGIN CATCH-ALL */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </Router>
  );
}

export default App;