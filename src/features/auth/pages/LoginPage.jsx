import { useNavigate } from "react-router-dom";

import AuthBrandPanel from "../components/AuthBrandPanel.jsx";
import LoginForm from "../components/LoginForm.jsx";
import "../styles/login.css";

function LoginPage() {
  const navigate = useNavigate();

  const handleSignUp = () => {
    sessionStorage.removeItem("tikitaka_oauth_signup");
    navigate("/signup-terms");
  };

  return (
    <main className="login-page">
      <AuthBrandPanel onSignUp={handleSignUp} />
      <LoginForm onSignUp={handleSignUp} />
    </main>
  );
}

export default LoginPage;
