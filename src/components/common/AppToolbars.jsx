import { useLocation, useNavigate } from "react-router-dom";
import searchIcon from "../../assets/icons/dashboard-search.svg";
import notificationIcon from "../../assets/icons/dashboard-notification.svg";
import homeIcon from "../../assets/icons/dashboard-home.svg";
import homeBlackIcon from "../../assets/icons/dashboard-home-black.svg";
import spacesIcon from "../../assets/icons/dashboard-spaces.svg";
import userIcon from "../../assets/icons/userIcon.png";
import "./appToolbars.css";

const DEFAULT_NAV_ITEMS = [{ label: "Dashboard", path: "/dashboard", icon: homeIcon }, { label: "Spaces", path: "/spaces", icon: spacesIcon }];
function readProfileImage() { try { const user = JSON.parse(localStorage.getItem("tikitaka_user") || "null"); return user?.profile_url || user?.profileUrl || user?.profile_image_url || user?.profileImageUrl || ""; } catch { return ""; } }

export function UtilityToolbar({ onSearch, onNotifications, profilePath = "/profile-setting", profileImage }) {
  const navigate = useNavigate(); const resolvedProfileImage = profileImage ?? readProfileImage();
  return <nav className="dashboard-utility" aria-label="빠른 메뉴">
    <button type="button" aria-label="통합 검색" onClick={onSearch}><img src={searchIcon} alt="" /></button>
    <button type="button" aria-label="알림" onClick={onNotifications}><img src={notificationIcon} alt="" /></button>
    <button type="button" aria-label="내 정보" onClick={() => navigate(profilePath)}><img className="dashboard-utility__profile" src={resolvedProfileImage || userIcon} alt="" /></button>
  </nav>;
}

export function SearchToolbar({ value, onChange, onSubmit }) {
  function handleSubmit(event) {
    event.preventDefault();
    onSubmit?.();
  }

  return <form className="dashboard-search-toolbar" role="search" onSubmit={handleSubmit}>
    <label className="sr-only" htmlFor="global-search">통합 검색</label>
    <input id="global-search" name="query" type="search" placeholder="Space, 강의자료, 공지사항, 질문 검색" value={value} onChange={onChange} autoFocus />
    <button type="submit" aria-label="검색"><img src={searchIcon} alt="" /></button>
  </form>;
}

export function BottomNavigation({ items = DEFAULT_NAV_ITEMS }) {
  const location = useLocation(); const navigate = useNavigate();
  return <nav className="dashboard-bottom-nav" aria-label="주요 메뉴">{items.map(({ label, path, icon }) => {
    const isActive = location.pathname === path || location.pathname.startsWith(`${path}/`);
    const resolvedIcon = path === "/dashboard" && location.pathname !== "/dashboard" ? homeBlackIcon : icon;
    return <button className={isActive ? "is-active" : undefined} type="button" aria-current={isActive ? "page" : undefined} onClick={() => navigate(path)} key={path}><img src={resolvedIcon} alt="" /><span>{label}</span></button>;
  })}</nav>;
}

export function AppToolbars(props) { return <><UtilityToolbar {...props} /><BottomNavigation items={props.items} /></>; }
