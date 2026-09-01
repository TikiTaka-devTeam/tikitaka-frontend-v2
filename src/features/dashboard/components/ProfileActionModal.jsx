import { useEffect, useMemo, useState } from "react";

import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";
import profileEditPencilIcon from "../../../assets/icons/profile-edit-pencil.svg";
import profileAvatar from "../../../assets/images/profile-avatar.svg";
import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";
import ModalBackdrop from "../../../components/common/ModalBackdrop.jsx";
import { logout, updateProfileImage } from "../../auth/api/auth.api.js";
import { getSystemNotice, getSystemNotices } from "../../notices/api/notices.api.js";
import "../../spaces/styles/saveStatusModal.css";

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
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [notices, setNotices] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isMounted = true;
    getSystemNotices().then(({ data }) => {
      if (!isMounted) return;
      setNotices(Array.isArray(data) ? data : []);
      setStatus("success");
    }).catch(() => {
      if (isMounted) setStatus("error");
    });
    return () => { isMounted = false; };
  }, []);

  const handleNoticeSelect = async (notice) => {
    const noticeId = notice.system_notice_id;
    if (!noticeId) return;
    setStatus("loading-detail");
    try {
      const { data } = await getSystemNotice(noticeId);
      setSelectedNotice(data);
      setStatus("success");
    } catch {
      setStatus("detail-error");
    }
  };

  return <><ModalHeader title="공지사항" onClose={onClose} /><div className="profile-action-modal__notices">{status === "loading" ? <p className="profile-action-modal__status">공지사항을 불러오는 중입니다.</p> : null}{status === "error" ? <p className="profile-action-modal__status" role="alert">공지사항을 불러오지 못했습니다.</p> : null}{status === "detail-error" ? <p className="profile-action-modal__status" role="alert">공지사항 상세 내용을 불러오지 못했습니다.</p> : null}{selectedNotice ? <article><button type="button" onClick={() => setSelectedNotice(null)}>← 목록</button><h3>{selectedNotice.title}</h3>{selectedNotice.created_at ? <time>{new Date(selectedNotice.created_at).toLocaleDateString("ko-KR")}</time> : null}<p>{selectedNotice.content}</p></article> : <ul>{notices.map((notice) => <li key={notice.system_notice_id}><button type="button" onClick={() => handleNoticeSelect(notice)}><strong>{notice.title}</strong>{notice.created_at ? <time>{new Date(notice.created_at).toLocaleDateString("ko-KR")}</time> : null}</button></li>)}</ul>}</div></>;
}

function InquiryContent({ onClose }) {
  const [message, setMessage] = useState("");
  const handleSubmit = (event) => {
    event.preventDefault();
    event.currentTarget.reset();
    setMessage("문의 내용이 임시 저장되었습니다.");
  };
  return <><ModalHeader title="문의하기" onClose={onClose} /><form className="profile-action-modal__form" onSubmit={handleSubmit}><label>문의 제목<input name="title" required /></label><label>문의 내용<textarea name="content" rows="5" required /></label>{message ? <p role="status">{message}</p> : null}<button className="profile-action-modal__primary" type="submit">문의 남기기</button></form></>;
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

  return <CompactModal className={`profile-action-modal profile-action-modal--${action}`} labelledBy={`profile-action-${action}`} onClose={onClose}>
    {action === "password" ? <PasswordContent onClose={onClose} /> : null}
    {action === "notices" ? <NoticesContent onClose={onClose} /> : null}
    {action === "inquiry" ? <InquiryContent onClose={onClose} /> : null}
    {action === "logout" ? <LogoutContent onClose={onClose} /> : null}
  </CompactModal>;
}

export default ProfileActionModal;
