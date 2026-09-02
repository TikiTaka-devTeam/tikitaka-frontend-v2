import { useEffect, useMemo, useState } from "react";

import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";
import inquiryChevronIcon from "../../../assets/icons/inquiry-chevron.svg";
import profileEditPencilIcon from "../../../assets/icons/profile-edit-pencil.svg";
import profileAvatar from "../../../assets/images/profile-avatar.svg";
import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";
import ModalBackdrop from "../../../components/common/ModalBackdrop.jsx";
import { logout, updateProfileImage } from "../../auth/api/auth.api.js";
import { getSystemNotices } from "../../notices/api/notices.api.js";
import "../../spaces/styles/saveStatusModal.css";

const MOCK_SYSTEM_NOTICE = {
  system_notice_id: "mock-system-notice",
  title: "서비스 공지사항 테스트",
  content: "공지사항 출력용 목업입니다. 실제 공지사항은 서버에서 불러옵니다.",
  created_at: "2026-09-02T00:00:00+09:00",
};

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("tikitaka_user") || "null") || {};
  } catch {
    return {};
  }
}

function ModalHeader({ title, onClose }) {
  const titleIds = { "프로필 관리": "profile-action-profile", "비밀번호 변경": "profile-action-password", "공지사항": "profile-action-notices", "문의하기": "profile-action-inquiry", "로그아웃": "profile-action-logout" };
  return <header className="profile-action-modal__header"><h2 id={titleIds[title]}>{title}</h2><button type="button" aria-label={`${title} 닫기`} onClick={onClose}>×</button></header>;
}

function ProfileEditDialog({ file, message, onCancel, onFileChange, onSave }) {
  const profile = readStoredUser();
  const name = profile.name || profile.user_name || profile.username || "사용자";
  const storedImage = profile.profile_url || profile.profileUrl || profile.profile_image_url || profile.profileImageUrl || "";
  const previewUrl = useMemo(() => (
    file ? URL.createObjectURL(file) : ""
  ), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return <ModalBackdrop onClose={onCancel} className="modal-backdrop--light"><section className="profile-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title" aria-describedby="profile-edit-description"><header><h2 id="profile-edit-title">프로필 관리</h2><p id="profile-edit-description">프로필 이미지를 변경합니다</p></header><div className="profile-edit-dialog__divider" /><div className="profile-edit-dialog__body"><label className="profile-edit-dialog__avatar" aria-label="프로필 이미지 파일 선택"><img src={previewUrl || storedImage || profileAvatar} alt={`${name} 프로필`} /><span><img src={profileEditPencilIcon} alt="" /></span><input type="file" accept="image/*" onChange={onFileChange} /></label><div className={`profile-edit-dialog__filename ${file ? "has-file" : ""}`}>{file?.name || "파일명"}</div>{message ? <p className="profile-edit-dialog__message" role="alert">{message}</p> : null}</div><ModalActions className="profile-edit-dialog__actions" onCancel={onCancel} onConfirm={onSave} confirmDisabled={!file} cancelText="취소" confirmText="저장" /></section></ModalBackdrop>;
}

function ProfileSaveStatusModal({ stage, isSaving, onCancel, onConfirm }) {
  const isComplete = stage === "complete";
  return <CompactModal onClose={isComplete ? onConfirm : onCancel} backdropClassName="modal-backdrop--light" labelledBy={`profile-save-${stage}-title`} describedBy={`profile-save-${stage}-description`} className="profile-save-status-modal"><div className="save-status-modal__icon-box" aria-hidden="true"><img src={confirmCheckIcon} alt="" /></div><div className="save-status-modal__text"><h2 id={`profile-save-${stage}-title`} className="save-status-modal__title">{isComplete ? "저장되었습니다" : "저장하시겠습니까?"}</h2><p id={`profile-save-${stage}-description`} className="save-status-modal__description">{isComplete ? "프로필 이미지가 변경되었습니다" : "변경한 프로필 정보를 저장합니다"}</p></div><ModalActions className={isComplete ? "profile-save-complete__actions" : "profile-save-confirm__actions"} onCancel={onCancel} onConfirm={onConfirm} cancelText="취소" confirmText={isComplete ? "확인" : isSaving ? "변경 중" : "변경"} confirmDisabled={isSaving} showCancel={!isComplete} /></CompactModal>;
}

function ProfileEditFlow({ onClose, onProfileUpdated }) {
  const [profile, setProfile] = useState(() => readStoredUser());
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState("edit");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleImageChange = (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) {
      setMessage("이미지 파일만 선택할 수 있습니다.");
      return;
    }
    setFile(selectedFile);
    setMessage("");
  };

  const handleConfirm = async () => {
    if (!file || isSaving) return;
    setIsSaving(true);
    setMessage("");
    try {
      const { profileUrl } = await updateProfileImage(file);
      const nextProfile = { ...profile, profile_url: profileUrl, profileUrl };
      localStorage.setItem("tikitaka_user", JSON.stringify(nextProfile));
      setProfile(nextProfile);
      onProfileUpdated(profileUrl);
      setStage("complete");
    } catch (error) {
      setMessage(error.message || "프로필 이미지를 변경하지 못했습니다.");
      setStage("edit");
    } finally {
      setIsSaving(false);
    }
  };

  if (stage === "edit") return <ProfileEditDialog file={file} message={message} onCancel={onClose} onFileChange={handleImageChange} onSave={() => setStage("confirm")} />;
  return <ProfileSaveStatusModal stage={stage} isSaving={isSaving} onCancel={() => setStage("edit")} onConfirm={stage === "confirm" ? handleConfirm : onClose} />;
}

function PasswordContent({ onClose }) {
  const [message, setMessage] = useState("");
  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextPassword = String(data.get("nextPassword"));
    const confirmation = String(data.get("confirmation"));
    if (nextPassword.length < 8) return setMessage("비밀번호는 8자 이상 입력해주세요.");
    if (nextPassword !== confirmation) return setMessage("새 비밀번호가 일치하지 않습니다.");
    setMessage("입력 내용을 확인했습니다. 서버 API 연결 후 변경됩니다.");
  };
  return <><ModalHeader title="비밀번호 변경" onClose={onClose} /><form className="profile-action-modal__form" onSubmit={handleSubmit}><label>현재 비밀번호<input name="currentPassword" type="password" required /></label><label>새 비밀번호<input name="nextPassword" type="password" required /></label><label>새 비밀번호 확인<input name="confirmation" type="password" required /></label>{message ? <p role="status">{message}</p> : null}<button className="profile-action-modal__primary" type="submit">변경하기</button></form></>;
}

function NoticesContent({ onClose }) {
  const [notices, setNotices] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isMounted = true;
    getSystemNotices().then(({ data }) => {
      if (!isMounted) return;
      const systemNotices = Array.isArray(data) ? data : [];
      setNotices(systemNotices.length > 0 ? systemNotices : [MOCK_SYSTEM_NOTICE]);
      setStatus("success");
    }).catch(() => {
      if (!isMounted) return;
      setNotices([MOCK_SYSTEM_NOTICE]);
      setStatus("success");
    });
    return () => { isMounted = false; };
  }, []);

  const formatNoticeDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  return <ModalBackdrop onClose={onClose} className="modal-backdrop--light"><section className="profile-notices-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-notices-title" aria-describedby="profile-notices-description"><header><h2 id="profile-notices-title">공지사항</h2><p id="profile-notices-description">tikitaka의 업데이트와 서비스 안내를 확인합니다.</p></header><div className="profile-notices-dialog__divider" /><div className="profile-notices-dialog__body">{status === "loading" ? <p className="profile-notices-dialog__status">공지사항을 불러오는 중입니다.</p> : null}{status === "error" ? <p className="profile-notices-dialog__status" role="alert">공지사항을 불러오지 못했습니다.</p> : null}{status === "success" && notices.length === 0 ? <p className="profile-notices-dialog__status">등록된 공지사항이 없습니다.</p> : null}{notices.map((notice) => <article className="profile-notice-card" key={notice.system_notice_id}><h3>{notice.title}</h3>{notice.created_at ? <time dateTime={notice.created_at}>{formatNoticeDate(notice.created_at)}</time> : null}<p>{notice.content}</p></article>)}</div><ModalActions className="profile-notices-dialog__actions" onConfirm={onClose} confirmText="닫기" showCancel={false} /></section></ModalBackdrop>;
}

function InquiryContent({ onClose }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const requestBody = {
      category: formData.get("category"),
      title: formData.get("title"),
      content: formData.get("content"),
    };

    console.log(JSON.stringify(requestBody, null, 2));
  };
  return <ModalBackdrop onClose={onClose} className="modal-backdrop--light"><form className="profile-inquiry-dialog" aria-labelledby="profile-inquiry-title" aria-describedby="profile-inquiry-description" onSubmit={handleSubmit}><header><h2 id="profile-inquiry-title">문의하기</h2><p id="profile-inquiry-description">오류 제보, 기능 제안 또는 서비스 이용 문의를 남겨주세요</p></header><div className="profile-inquiry-dialog__divider" /><div className="profile-inquiry-dialog__body"><label className="profile-inquiry-control"><span>분류</span><span className="profile-inquiry-control__select"><select name="category" defaultValue="ERROR_REPORT"><option value="ERROR_REPORT">오류 제보</option><option value="FEATURE_REQUEST">기능 제안</option><option value="SERVICE_INQUIRY">서비스 이용 문의</option></select><img src={inquiryChevronIcon} alt="" /></span></label><label className="profile-inquiry-control"><span>제목</span><input name="title" placeholder="문의 제목을 적어주세요" required /></label><label className="profile-inquiry-control"><span>문의 내용</span><textarea name="content" placeholder="문의 내용을 적어주세요" required /></label></div><ModalActions className="profile-inquiry-dialog__actions" onCancel={onClose} cancelText="취소" confirmText="등록" confirmType="submit" /></form></ModalBackdrop>;
}

function LogoutContent({ onClose }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try { await logout(); } catch { /* Local credentials still need to be cleared. */ }
    localStorage.removeItem("tikitaka_access_token");
    localStorage.removeItem("tikitaka_refresh_token");
    localStorage.removeItem("tikitaka_user");
    window.location.replace("/login");
  };
  return <><ModalHeader title="로그아웃" onClose={onClose} /><div className="profile-action-modal__logout"><p>현재 계정에서 로그아웃하시겠습니까?</p><div><button type="button" onClick={onClose}>취소</button><button type="button" disabled={isLoggingOut} onClick={handleLogout}>{isLoggingOut ? "로그아웃 중" : "로그아웃"}</button></div></div></>;
}

function ProfileActionModal({ action, onClose, onProfileUpdated }) {
  if (action === "profile") {
    return <ProfileEditFlow onClose={onClose} onProfileUpdated={onProfileUpdated} />;
  }

  if (action === "notices") {
    return <NoticesContent onClose={onClose} />;
  }

  if (action === "inquiry") {
    return <InquiryContent onClose={onClose} />;
  }

  return <CompactModal className={`profile-action-modal profile-action-modal--${action}`} labelledBy={`profile-action-${action}`} onClose={onClose}>
    {action === "password" ? <PasswordContent onClose={onClose} /> : null}
    {action === "logout" ? <LogoutContent onClose={onClose} /> : null}
  </CompactModal>;
}

export default ProfileActionModal;
