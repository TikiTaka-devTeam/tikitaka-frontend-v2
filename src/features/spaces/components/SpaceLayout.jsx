import { useLocation, useNavigate } from "react-router-dom";
import backIcon from "../../../assets/icons/go-back.svg";
import { AppToolbars } from "../../../components/common/AppToolbars.jsx";
import { useSpaceAccess } from "../context/SpaceAccessContext.js";
import SpaceArchiveStatus from "./SpaceArchiveStatus.jsx";
import SpaceToolbar from "./SpaceToolbar.jsx";
import "../styles/space-layout.css";

const TABS = {
  "": ["lecture", "강의자료"],
  "/notices": ["notice", "공지사항"],
  "/questions": ["question", "질문"],
  "/assignments": ["assignment", "과제"],
  "/assignments/professor": ["assignment", "과제"],
  "/members": ["member", "멤버"],
};

export default function SpaceLayout({ children }) {
  const { spaceId, spaceName } = useSpaceAccess();
  const location = useLocation();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const transitionTimerRef = useRef(null);
  useEffect(() => () => {
    window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = null;
  }, [spaceId]);

  const transitionTo = (destination, options) => {
    if (transitionTimerRef.current !== null) return;
    setLeaving(true);
    transitionTimerRef.current = window.setTimeout(() => {
      transitionTimerRef.current = null;
      navigate(destination, options);
      setLeaving(false);
    }, 120);
  };
  const tab = TABS[location.pathname.slice(`/spaces/${spaceId}`.length)];
  const noticeMode = new URLSearchParams(location.search).get("mode");
  if (!tab || (tab[0] === "notice" && ["create", "edit"].includes(noticeMode))) return children;

  return <div className={`space-layout${leaving ? " space-layout--leaving" : ""}`}>
    <div className="app-frame space-layout__chrome">
      <button type="button" className="space-layout__back" aria-label="Space 목록으로 돌아가기" onClick={() => navigate("/spaces")}>
        <img src={backIcon} alt="" />
      </button>
      <header className="space-layout__header">
        <h1>{spaceName || location.state?.spaceName || "Space"}</h1>
        <p>{tab[1]} <SpaceArchiveStatus /></p>
      </header>
      <AppToolbars showBottomNavigation={false} onSearch={() => navigate("/search")} />
    </div>
    {children}
    <SpaceToolbar activeItem={tab[0]} spaceId={spaceId} spaceName={spaceName} onNavigate={transitionTo} transitioning={leaving} />
  </div>;
}
import { useEffect, useRef, useState } from "react";
