import accessIcon from "../../../assets/icons/profile-menu/user-list.svg";
import chevronIcon from "../../../assets/icons/profile-menu/access.svg";
import logoutIcon from "../../../assets/icons/profile-menu/logout.svg";
import mailIcon from "../../../assets/icons/profile-menu/megaphone.svg";
import megaphoneIcon from "../../../assets/icons/profile-menu/mail.svg";
import userListIcon from "../../../assets/icons/profile-menu/chevron.svg";
import { useEffect, useState } from "react";
import profileAvatar from "../../../assets/images/profile-avatar.svg";
import { getCurrentUser } from "../../auth/api/auth.api.js";

const PROFILE_MENU_ITEMS = [
  { id: "profile", title: "프로필 관리", description: "프로필 이미지를 변경 할 수 있습니다.", icon: userListIcon },
  { id: "password", title: "비밀번호 변경", description: "계정 비밀번호를 변경합니다.", icon: accessIcon },
  { id: "notices", title: "공지사항", description: "서비스 업데이트 및 공지사항을 확인합니다.", icon: megaphoneIcon, divided: true },
  { id: "inquiry", title: "문의하기", description: "문의사항을 남기고 답변을 확인합니다.", icon: mailIcon },
  { id: "logout", title: "로그아웃", description: "현재 계정에서 로그아웃합니다.", icon: logoutIcon, divided: true, danger: true },
];

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("tikitaka_user") || "null") || {};
  } catch {
    return {};
  }
}

function getProfileValue(profile, keys, fallback) {
  return keys.map((key) => profile[key]).find((value) => value) || fallback;
}

function ProfileMenu({ onSelect }) {
  const [profile, setProfile] = useState(() => readStoredUser());

  useEffect(() => {
    let isMounted = true;

    getCurrentUser().then(({ data }) => {
      if (!isMounted) return;
      const nextProfile = { ...readStoredUser(), ...data };
      localStorage.setItem("tikitaka_user", JSON.stringify(nextProfile));
      setProfile(nextProfile);
    }).catch(() => {
      // Keep the last successfully stored profile when the request fails.
    });

    return () => { isMounted = false; };
  }, []);
  const name = getProfileValue(profile, ["name", "user_name", "username"], "사용자");
  const email = getProfileValue(profile, ["email"], "이메일 정보 없음");
  const accountType = getProfileValue(profile, ["account_type"], "");
  const role = { PROFESSOR: "교수", ASSISTANT: "조교", STUDENT: "학생" }[accountType] || "";
  const profileImage = getProfileValue(profile, ["profile_url", "profileUrl", "profile_image_url", "profileImageUrl"], "");

  return (
    <section className="dashboard-profile-menu" aria-label="프로필 메뉴">
      <header>
        <img src={profileImage || profileAvatar} alt={`${name} 프로필`} />
        <div>
          <strong>{name} <small>{role}</small></strong>
          <span>{email}</span>
        </div>
      </header>
      <ul>
        {PROFILE_MENU_ITEMS.map((item) => (
          <li className={`${item.divided ? "is-divided" : ""} ${item.danger ? "is-danger" : ""}`} key={item.id}>
            <button type="button" onClick={() => onSelect(item.id)}>
              <img className="dashboard-profile-menu__icon" src={item.icon} alt="" />
              <span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              {item.id !== "logout" ? <img className="dashboard-profile-menu__chevron" src={chevronIcon} alt="" /> : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ProfileMenu;
