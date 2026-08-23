import { useNavigate } from "react-router-dom";

import AuthBrandPanel from "../components/AuthBrandPanel.jsx";
import LoginForm from "../components/LoginForm.jsx";
import "../styles/login.css";

function LoginPage() {
  const navigate = useNavigate();

  return (
    <main className="login-page">
      <AuthBrandPanel onSignUp={() => navigate("/signup-terms")} />
      <LoginForm onSignUp={() => navigate("/signup-terms")} />
    </main>
  );
}

export default LoginPage;