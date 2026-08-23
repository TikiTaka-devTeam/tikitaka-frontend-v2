import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import leftArrowIcon from "../../../assets/icons/left_arrow.png";
import userIcon from "../../../assets/icons/userIcon.png";
import addImgIcon from "../../../assets/icons/addImg.svg";
import { getCurrentUser, logout, updateProfileImage } from "../api/auth.api.js";
import {
  clearRegisteredDeviceToken,
  sendPushTestNotification,
  unregisterStoredDeviceToken,
} from "../../notifications/api/push.api.js";
import "../styles/profileSetting.css";

const PROFILE_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("tikitaka_user") || "null") || {};
  } catch {
    return {};
  }
}

function getUserValue(user, keys, fallback = "") {
  for (const key of keys) {
    const value = user?.[key];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return fallback;
}

function SettingRow({ label, value, isAction = false, disabled = false, onClick }) {
  if (isAction) {
    return (
      <button
        type="button"
        className="profile-setting-row"
        disabled={disabled}
        onClick={onClick}
      >
        <span>{label}</span>
        {value ? <span className="profile-setting-row__value">{value}</span> : null}
      </button>
    );
  }

  return (
    <div className="profile-setting-row">
      <span>{label}</span>
      {value ? <span className="profile-setting-row__value">{value}</span> : null}
    </div>
  );
}

function ProfileSettingPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => readStoredUser());
  const [failedProfileImage, setFailedProfileImage] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUpdatingProfileImage, setIsUpdatingProfileImage] = useState(false);
  const [isSendingTestPush, setIsSendingTestPush] = useState(false);
  const [profileImageError, setProfileImageError] = useState("");
  const [testPushMessage, setTestPushMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const { data } = await getCurrentUser();

        if (!isMounted) {
          return;
        }

        setProfile((prevProfile) => ({ ...prevProfile, ...data }));
        localStorage.setItem(
          "tikitaka_user",
          JSON.stringify({ ...readStoredUser(), ...data }),
        );
      } catch {
        if (isMounted) {
          setProfile(readStoredUser());
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = getUserValue(profile, ["name", "user_name", "username"], "사용자");
  const email = getUserValue(profile, ["email"], "");
  const phoneNumber = getUserValue(
    profile,
    ["phone_number", "phoneNumber", "phone"],
    "",
  );
  const profileImage = String(getUserValue(
    profile,
    ["profile_url", "profileUrl", "profile_image_url", "profileImageUrl"],
    "",
  )).trim();

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await unregisterStoredDeviceToken();
      await logout();
    } catch {
      // Even if the server request fails, clear local credentials.
    } finally {
      clearRegisteredDeviceToken();
      localStorage.removeItem("tikitaka_access_token");
      localStorage.removeItem("tikitaka_refresh_token");
      localStorage.removeItem("tikitaka_user");
      window.location.replace("/login");
    }
  };

  const handleSendTestPush = async () => {
    if (isSendingTestPush) {
      return;
    }

    setIsSendingTestPush(true);
    setTestPushMessage("");

    try {
      await sendPushTestNotification();
      setTestPushMessage("테스트 알림을 발송했습니다.");
    } catch {
      setTestPushMessage("테스트 알림 발송에 실패했습니다.");
    } finally {
      setIsSendingTestPush(false);
    }
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "";

    if (
      !file.type.startsWith("image/") ||
      !PROFILE_IMAGE_EXTENSIONS.includes(extension)
    ) {
      setProfileImageError("jpg, jpeg, png, gif, webp 이미지만 업로드할 수 있습니다.");
      return;
    }

    setIsUpdatingProfileImage(true);
    setProfileImageError("");

    try {
      const { profileUrl } = await updateProfileImage(file);

      if (!profileUrl) {
        throw new Error("새 프로필 이미지 주소를 가져오지 못했습니다.");
      }

      setFailedProfileImage("");
      setProfile((prevProfile) => {
        const nextProfile = {
          ...prevProfile,
          profile_url: profileUrl,
          profileUrl,
        };

        localStorage.setItem(
          "tikitaka_user",
          JSON.stringify({ ...readStoredUser(), ...nextProfile }),
        );

        return nextProfile;
      });
    } catch (error) {
      setProfileImageError(
        error.message || "프로필 이미지를 변경하지 못했습니다.",
      );
    } finally {
      setIsUpdatingProfileImage(false);
    }
  };

  return (
    <main className="profile-setting-page">
      <header className="profile-setting-header">
        <button
          type="button"
          className="profile-setting-back"
          aria-label="뒤로 가기"
          onClick={() => navigate(-1)}
        >
          <img src={leftArrowIcon} alt="" />
        </button>
        <h1>내 정보</h1>
      </header>

      <section className="profile-setting-hero" aria-label="프로필">
        <div className="profile-setting-avatar">
          {profileImage && profileImage !== failedProfileImage ? (
            <img
              src={profileImage}
              alt={`${displayName} 프로필`}
              onError={() => setFailedProfileImage(profileImage)}
            />
          ) : (
            <img src={userIcon} alt={`${displayName} 프로필`} />
          )}
          <label
            className="profile-setting-avatar__plus"
            aria-label="프로필 이미지 변경"
            aria-disabled={isUpdatingProfileImage}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              disabled={isUpdatingProfileImage}
              onChange={handleProfileImageChange}
            />
            <img src={addImgIcon} alt="" />
          </label>
        </div>
        <strong>{displayName}</strong>
        {email ? <p>{email}</p> : null}
        {profileImageError ? (
          <p className="profile-setting-avatar__error" role="alert">
            {profileImageError}
          </p>
        ) : null}
      </section>

      <section className="profile-setting-panel" aria-label="내 정보 설정">
        <div className="profile-setting-group">
          <h2>계정</h2>
          <SettingRow label="이메일" value={email} />
          <SettingRow label="전화번호" value={phoneNumber} />
          <SettingRow label="비밀번호 변경" />
        </div>

        <div className="profile-setting-group">
          <h2>앱 설정</h2>
          <SettingRow label="다크모드" value="시스템 기본값" />
          <SettingRow label="알림 설정" />
          <SettingRow
            label={isSendingTestPush ? "테스트 알림 발송 중" : "테스트 알림 보내기"}
            isAction
            disabled={isSendingTestPush}
            onClick={handleSendTestPush}
          />
          {testPushMessage ? (
            <p className="profile-setting-message" role="status">
              {testPushMessage}
            </p>
          ) : null}
        </div>

        <div className="profile-setting-group">
          <h2>이용 안내</h2>
          <SettingRow label="앱 버전" />
          <SettingRow label="공지사항" />
          <SettingRow label="문의하기" />
        </div>

        <div className="profile-setting-group profile-setting-group--last">
          <h2>기타</h2>
          <SettingRow label="회원 탈퇴" />
          <SettingRow
            label={isLoggingOut ? "로그아웃 중" : "로그아웃"}
            isAction
            onClick={handleLogout}
          />
        </div>
      </section>
    </main>
  );
}

export default ProfileSettingPage;
