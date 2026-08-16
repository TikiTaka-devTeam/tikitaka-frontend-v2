import { Navigate, Route, Routes } from "react-router-dom";
import PlaceholderPage from "../components/common/PlaceholderPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PlaceholderPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
