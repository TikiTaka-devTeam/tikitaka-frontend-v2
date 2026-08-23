import { Navigate, Route, Routes } from "react-router-dom";
import PlaceholderPage from "../components/common/PlaceholderPage.jsx";
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import SignupCompletePage from "../features/auth/pages/SignupCompletePage.jsx";
import SignupInformPage from "../features/auth/pages/SignupInformPage.jsx";
import SignupTermsPage from "../features/auth/pages/SignupTermsPage.jsx";
import DashboardPage from "../features/dashboard/pages/DashboardPage.jsx";

function App() {
  const accessToken = localStorage.getItem("tikitaka_access_token");

  return (
    <Routes>
      <Route
        path="/"
        element={
          accessToken ? (
            <DashboardPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/spaces" element={<PlaceholderPage />} />

      <Route
        path="/login"
        element={
          accessToken ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />

      <Route
        path="/signup-terms"
        element={
          accessToken ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <SignupTermsPage />
          )
        }
      />

      <Route
        path="/signup-inform"
        element={
          accessToken ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <SignupInformPage />
          )
        }
      />

      <Route
        path="/signup-complete"
        element={
          accessToken ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <SignupCompletePage />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
