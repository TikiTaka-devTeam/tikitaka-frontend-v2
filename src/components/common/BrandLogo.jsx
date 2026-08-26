import { useNavigate } from "react-router-dom";
import logoBlueSrc from "../../assets/images/logo_tikitaka_blue.svg";
import logoWhiteSrc from "../../assets/images/logo_tikitaka_white.svg";
import "./brandLogo.css";

const LOGO_SOURCES = {
  blue: logoBlueSrc,
  white: logoWhiteSrc,
};

function BrandLogo({ variant = "blue", className = "", imageClassName = "" }) {
  const navigate = useNavigate();
  const logoSrc = LOGO_SOURCES[variant] ?? LOGO_SOURCES.blue;

  return (
    <button
      type="button"
      className={`brand-logo${className ? ` ${className}` : ""}`}
      aria-label="대시보드로 이동"
      onClick={() => navigate("/dashboard")}
    >
      <img
        className={imageClassName || undefined}
        src={logoSrc}
        alt="tikitaka"
      />
    </button>
  );
}

export default BrandLogo;
