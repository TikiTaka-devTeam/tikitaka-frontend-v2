import { useNavigate } from "react-router-dom";
import searchIcon from "../../../assets/icons/dashboard-search.svg";
import notificationIcon from "../../../assets/icons/dashboard-notification.svg";
import homeIcon from "../../../assets/icons/dashboard-home.svg";
import spacesIcon from "../../../assets/icons/dashboard-spaces.svg";
import cellularIcon from "../../../assets/icons/dashboard-cellular.svg";
import wifiIcon from "../../../assets/icons/dashboard-wifi.svg";
import batteryIcon from "../../../assets/icons/dashboard-battery.svg";
import userIcon from "../../../assets/icons/userIcon.png";
import { SPACES_PATH } from "../data/dashboard.js";

function readProfileImage() {
  try {
    const user = JSON.parse(localStorage.getItem("tikitaka_user") || "null");
    return user?.profile_url || user?.profileUrl || user?.profile_image_url || user?.profileImageUrl || "";
  } catch {
    return "";
  }
}

export function SystemStatusBar() {
  return (
    <div className="dashboard-status" aria-label="시스템 상태">
      <span>9:41</span><span>Mon Jun 6</span>
      <div><img src={cellularIcon} alt="" /><img src={wifiIcon} alt="" /><span>65%</span><img src={batteryIcon} alt="" /></div>
    </div>
  );
}

export function UtilityToolbar() {
  const navigate = useNavigate();
  const profileImage = readProfileImage();

  return (
    <nav className="dashboard-utility" aria-label="빠른 메뉴">
      <button type="button" aria-label="검색"><img src={searchIcon} alt="" /></button>
      <button type="button" aria-label="알림"><img src={notificationIcon} alt="" /></button>
      <button type="button" aria-label="내 정보" onClick={() => navigate("/profile-setting")}>
        <img className="dashboard-utility__profile" src={profileImage || userIcon} alt="" />
      </button>
    </nav>
  );
}

export function BottomNavigation() {
  const navigate = useNavigate();

  return (
    <nav className="dashboard-bottom-nav" aria-label="주요 메뉴">
      <button className="is-active" type="button" aria-current="page" onClick={() => navigate("/dashboard")}>
        <img src={homeIcon} alt="" /><span>Dashboard</span>
      </button>
      <button type="button" onClick={() => navigate(SPACES_PATH)}>
        <img src={spacesIcon} alt="" /><span>Spaces</span>
      </button>
    </nav>
  );
}
