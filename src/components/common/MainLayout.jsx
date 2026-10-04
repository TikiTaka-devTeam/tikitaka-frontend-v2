import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "./BrandLogo.jsx";
import { AppToolbars } from "./AppToolbars.jsx";
import "./mainLayout.css";
import usePageTransitionScrollLock from "./usePageTransitionScrollLock.js";

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  usePageTransitionScrollLock(location.pathname, leaving);
  const timerRef = useRef(null);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const transitionTo = (path) => {
    if (timerRef.current !== null || path === location.pathname || (path === "/dashboard" && location.pathname === "/")) return;
    setLeaving(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      navigate(path);
      setLeaving(false);
    }, 120);
  };

  return <div className={`main-layout${leaving ? " main-layout--leaving" : ""}`}>
    <div className="app-frame main-layout__chrome">
      <BrandLogo variant="blue" className="app-brand" onNavigate={transitionTo} />
      <AppToolbars onSearch={() => navigate("/search")} onNavigate={transitionTo} navigationDisabled={leaving} />
    </div>
    <Outlet />
  </div>;
}
