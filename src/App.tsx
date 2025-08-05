import { Routes, Route } from "react-router-dom";
import AdminLoginPage from "./pages/AdminLoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicVCardPage from "./pages/PublicVCardPage";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeFormPage from "./pages/EmployeeFormPage";
import BulkUploadPage from "./pages/BulkUploadPage";

// Placeholder components
function Home() {
  return <div className="p-6 text-xl">Welcome to SELCO V-Cards</div>;
}
function PublicVCard() {
  return <div className="p-6 text-xl">Public V-Card Page</div>;
}


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/vcard/:email" element={<PublicVCardPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/create"
        element={
          <ProtectedRoute>
            <EmployeeFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bulk"
        element={
          <ProtectedRoute>
            <BulkUploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/edit/:id"
        element={
          <ProtectedRoute>
            <EmployeeFormPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App; 

