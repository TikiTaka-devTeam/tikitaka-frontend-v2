import { Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "../features/auth/pages/LoginPage.jsx";
import OAuthCallbackPage from "../features/auth/pages/OAuthCallbackPage.jsx";
import SignupCompletePage from "../features/auth/pages/SignupCompletePage.jsx";
import SignupInformPage from "../features/auth/pages/SignupInformPage.jsx";
import SignupTermsPage from "../features/auth/pages/SignupTermsPage.jsx";

import DashboardPage from "../features/dashboard/pages/DashboardPage.jsx";
import DocumentModifyPage from "../features/documents/pages/DocumentModifyPage.jsx";
import SearchPage from "../features/search/pages/SearchPage.jsx";
import SpaceLecturePage from "../features/spaces/pages/SpaceLecturePage.jsx";
import SpacesPage from "../features/spaces/pages/SpacesPage.jsx";

import SpaceNoticePage from "../features/notices/pages/SpaceNoticePage.jsx";

import StudentLecturePage from "../features/lecture/pages/StudentLecturePage.jsx";
import ProfessorLecturePage from "../features/lecture/pages/ProfessorLecturePage.jsx";

function App() {
  const accessToken = localStorage.getItem("tikitaka_access_token");

  return (
    <Routes>
      <Route
        path="/"
        element={
          accessToken ? <DashboardPage /> : <Navigate to="/login" replace />
        }
      />

      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/spaces" element={<SpacesPage />} />
      <Route path="/spaces/:spaceId" element={<SpaceLecturePage />} />
      <Route
        path="/spaces/:spaceId/documents/:documentId/modify"
        element={<DocumentModifyPage />}
      />

      <Route
        path="/spaces/:spaceId/notices"
        element={<SpaceNoticePage />}
      />

      <Route
        path="/spaces/:spaceId/documents/:documentId/lecture/student"
        element={<StudentLecturePage />}
      />

      <Route
        path="/spaces/:spaceId/documents/:documentId/lecture/professor"
        element={<ProfessorLecturePage />}
      />

      <Route
        path="/login"
        element={
          accessToken ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />

      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

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
          <Route
        path="/spaces/:spaceId/notices"
        element={<SpaceNoticePage />}
      />
    </Routes>
  );
}

export default App;
