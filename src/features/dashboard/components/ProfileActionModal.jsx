import { useEffect, useMemo, useState } from "react";

import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";
import hidePasswordIcon from "../../../assets/icons/HidePassword.svg";
import inquiryChevronIcon from "../../../assets/icons/inquiry-chevron.svg";
import passwordAccessIcon from "../../../assets/icons/password-access.svg";
import questionSubmitIcon from "../../../assets/icons/question-submit.svg";
import profileEditPencilIcon from "../../../assets/icons/profile-edit-pencil.svg";
import logoutIcon from "../../../assets/icons/profile-menu/logout.svg";
import watchPasswordIcon from "../../../assets/icons/WatchPassword.svg";
import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";
import ModalBackdrop from "../../../components/common/ModalBackdrop.jsx";
import SystemErrorModal from "../../../components/common/SystemErrorModal.jsx";
import { getProfileInitial } from "../../../utils/profileInitial.js";
import {
  changePassword,
  createInquiry,
  logout,
  updateProfileImage,
} from "../../auth/api/auth.api.js";
import {
  clearStoredPushSubscriptionId,
  disableWebPush,
  enableWebPush,
  getWebPushState,
} from "../../notifications/services/webPush.js";
import {
  getSystemNotice,
  getSystemNotices,
} from "../../notices/api/notices.api.js";
import "../../spaces/styles/deleteStatusModal.css";
import "../../spaces/styles/saveStatusModal.css";

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("tikitaka_user") || "null") || {};
  } catch {
    return {};
  }
}

function ProfileEditDialog({ file, message, onCancel, onFileChange, onSave }) {
  const profile = readStoredUser();
  const name =
    profile.name || profile.user_name || profile.username || "사용자";
  const storedImage =
    profile.profile_url ||
    profile.profileUrl ||
    profile.profile_image_url ||
    profile.profileImageUrl ||
    "";
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : ""),
    [file],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <ModalBackdrop onClose={onCancel} className="modal-backdrop--light">
      <section
        className="profile-edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-title"
        aria-describedby="profile-edit-description"
      >
        <header>
          <h2 id="profile-edit-title">프로필 관리</h2>
          <p id="profile-edit-description">프로필 이미지를 변경합니다</p>
        </header>
        <div className="profile-edit-dialog__divider" />
        <div className="profile-edit-dialog__body">
          <label
            className="profile-edit-dialog__avatar"
            aria-label="프로필 이미지 파일 선택"
          >
            {previewUrl || storedImage ? (
              <img
                src={previewUrl || storedImage}
                alt={`${name} 프로필`}
              />
            ) : (
              <span
                className="profile-edit-dialog__avatar-placeholder"
                aria-hidden="true"
              >
                {getProfileInitial(name)}
              </span>
            )}
            <span className="profile-edit-dialog__avatar-edit">
              <img src={profileEditPencilIcon} alt="" />
            </span>
            <input type="file" accept="image/*" onChange={onFileChange} />
          </label>
          <div
            className={`profile-edit-dialog__filename ${file ? "has-file" : ""}`}
          >
            {file?.name || "파일명"}
          </div>
          {message ? (
            <p className="profile-edit-dialog__message" role="alert">
              {message}
            </p>
          ) : null}
        </div>
        <ModalActions
          className="profile-edit-dialog__actions"
          onCancel={onCancel}
          onConfirm={onSave}
          confirmDisabled={!file}
          cancelText="취소"
          confirmText="저장"
        />
      </section>
    </ModalBackdrop>
  );
}

function ProfileSaveStatusModal({ stage, isSaving, onCancel, onConfirm }) {
  const isComplete = stage === "complete";
  return (
    <CompactModal
      onClose={isComplete ? onConfirm : onCancel}
      backdropClassName="modal-backdrop--light"
      labelledBy={`profile-save-${stage}-title`}
      describedBy={`profile-save-${stage}-description`}
      className="profile-save-status-modal"
    >
      <div className="save-status-modal__icon-box" aria-hidden="true">
        <img src={confirmCheckIcon} alt="" />
      </div>
      <div className="save-status-modal__text">
        <h2
          id={`profile-save-${stage}-title`}
          className="save-status-modal__title"
        >
          {isComplete ? "저장되었습니다" : "저장하시겠습니까?"}
        </h2>
        <p
          id={`profile-save-${stage}-description`}
          className="save-status-modal__description"
        >
          {isComplete
            ? "프로필 이미지가 변경되었습니다"
            : "변경한 프로필 정보를 저장합니다"}
        </p>
      </div>
      <ModalActions
        className={
          isComplete
            ? "profile-save-complete__actions"
            : "profile-save-confirm__actions"
        }
        onCancel={onCancel}
        onConfirm={onConfirm}
        cancelText="취소"
        confirmText={isComplete ? "확인" : isSaving ? "변경 중" : "변경"}
        confirmDisabled={isSaving}
        showCancel={!isComplete}
      />
    </CompactModal>
  );
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
    } catch {
      setMessage("");
      setStage("error");
    } finally {
      setIsSaving(false);
    }
  };

  if (stage === "edit")
    return (
      <ProfileEditDialog
        file={file}
        message={message}
        onCancel={onClose}
        onFileChange={handleImageChange}
        onSave={() => setStage("confirm")}
      />
    );
  if (stage === "error")
    return (
      <SystemErrorModal
        onInquiry={() => setStage("inquiry")}
        onClose={() => window.location.assign("/dashboard")}
      />
    );
  if (stage === "inquiry") return <InquiryContent onClose={onClose} />;
  return (
    <ProfileSaveStatusModal
      stage={stage}
      isSaving={isSaving}
      onCancel={() => setStage("edit")}
      onConfirm={stage === "confirm" ? handleConfirm : onClose}
    />
  );
}

function PasswordContent({ onClose }) {
  const [stage, setStage] = useState("edit");
  const [values, setValues] = useState({
    currentPassword: "",
    nextPassword: "",
    confirmation: "",
  });
  const [errors, setErrors] = useState({});
  const [visibility, setVisibility] = useState({
    currentPassword: false,
    nextPassword: false,
    confirmation: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const toggleVisibility = (name) => {
    setVisibility((current) => ({ ...current, [name]: !current[name] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!values.currentPassword)
      nextErrors.currentPassword = "현재 비밀번호를 입력해주세요.";
    if (values.nextPassword.length < 8)
      nextErrors.nextPassword = "비밀번호는 8자리 이상으로 입력해주세요.";
    if (values.nextPassword !== values.confirmation)
      nextErrors.confirmation = "비밀번호가 일치하지 않습니다.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || isSaving) return;
    setIsSaving(true);

    try {
      await changePassword({
        current_password: values.currentPassword,
        new_password: values.nextPassword,
      });
      setStage("complete");
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 401) {
        setErrors({
          currentPassword:
            error.response?.data?.message ||
            "현재 비밀번호가 일치하지 않습니다.",
        });
      } else {
        setStage("error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    await disableWebPush().catch(() => null);
    clearStoredPushSubscriptionId();
    localStorage.removeItem("tikitaka_access_token");
    localStorage.removeItem("tikitaka_refresh_token");
    localStorage.removeItem("tikitaka_user");
    window.location.replace("/login");
  };

  if (stage === "error")
    return (
      <SystemErrorModal
        onInquiry={() => setStage("inquiry")}
        onClose={() => window.location.assign("/dashboard")}
      />
    );
  if (stage === "inquiry") return <InquiryContent onClose={onClose} />;

  if (stage === "complete") {
    return (
      <CompactModal
        onClose={handleComplete}
        backdropClassName="modal-backdrop--light"
        labelledBy="password-complete-modal-title"
        describedBy="password-complete-modal-description"
        className="delete-status-modal"
      >
        <div className="delete-status-modal__icon-box" aria-hidden="true">
          <img
            className="password-status-modal__icon"
            src={passwordAccessIcon}
            alt=""
          />
        </div>
        <div className="delete-status-modal__text">
          <h2
            id="password-complete-modal-title"
            className="delete-status-modal__title"
          >
            변경되었습니다
          </h2>
          <p
            id="password-complete-modal-description"
            className="delete-status-modal__description"
          >
            비밀번호가 변경되어 재로그인이 필요합니다
          </p>
        </div>
        <ModalActions
          className="delete-complete-modal__actions"
          onConfirm={handleComplete}
          confirmText="확인"
          showCancel={false}
        />
      </CompactModal>
    );
  }

  const fields = [
    {
      name: "currentPassword",
      label: "현재 비밀번호",
      placeholder: "현재 비밀번호 확인",
    },
    { name: "nextPassword", label: "새 비밀번호", placeholder: "8자 이상" },
    {
      name: "confirmation",
      label: "새 비밀번호 확인",
      placeholder: "새 비밀번호 확인",
    },
  ];

  return (
    <ModalBackdrop onClose={onClose} className="modal-backdrop--light">
      <form
        className="password-change-dialog"
        aria-labelledby="password-change-title"
        aria-describedby="password-change-description"
        onSubmit={handleSubmit}
      >
        <header>
          <h2 id="password-change-title">비밀번호 변경</h2>
          <p id="password-change-description">
            계정 보호를 위해 새로운 비밀번호를 설정합니다
          </p>
        </header>
        <div className="password-change-dialog__divider" />
        <div className="password-change-dialog__body">
          {fields.map((field) => (
            <label className="password-change-control" key={field.name}>
              <span>{field.label}</span>
              <span
                className={`password-change-control__input ${errors[field.name] ? "has-error" : ""}`}
              >
                <input
                  name={field.name}
                  type={visibility[field.name] ? "text" : "password"}
                  value={values[field.name]}
                  placeholder={field.placeholder}
                  autoComplete={
                    field.name === "currentPassword"
                      ? "current-password"
                      : "new-password"
                  }
                  onChange={handleChange}
                />
                <button
                  type="button"
                  aria-label={
                    visibility[field.name]
                      ? `${field.label} 숨기기`
                      : `${field.label} 보기`
                  }
                  onClick={() => toggleVisibility(field.name)}
                >
                  <img
                    src={
                      visibility[field.name]
                        ? watchPasswordIcon
                        : hidePasswordIcon
                    }
                    alt=""
                  />
                </button>
              </span>
              {errors[field.name] ? (
                <small role="alert">* {errors[field.name]}</small>
              ) : null}
            </label>
          ))}
        </div>
        <ModalActions
          className="password-change-dialog__actions"
          onCancel={onClose}
          cancelText="취소"
          confirmText={isSaving ? "변경 중" : "변경"}
          confirmType="submit"
          confirmDisabled={isSaving}
        />
      </form>
    </ModalBackdrop>
  );
}

function PushNotificationContent({ onClose }) {
  const [state, setState] = useState({
    supported: true,
    enabled: false,
    permission: "default",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    getWebPushState()
      .then((nextState) => {
        if (isMounted) setState(nextState);
      })
      .catch(() => {
        if (isMounted) setMessage("알림 상태를 확인하지 못했습니다.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = async () => {
    if (isSaving || isLoading) return;
    setIsSaving(true);
    setMessage("");

    try {
      if (state.enabled) {
        await disableWebPush();
        setState((current) => ({ ...current, enabled: false }));
        setMessage("웹 푸시 알림을 해제했습니다.");
      } else {
        await enableWebPush();
        setState({ supported: true, enabled: true, permission: "granted" });
        setMessage("웹 푸시 알림을 설정했습니다.");
      }
    } catch (error) {
      setMessage(
        error?.message || "웹 푸시 알림 설정을 변경하지 못했습니다.",
      );
      const nextState = await getWebPushState().catch(() => null);
      if (nextState) setState(nextState);
    } finally {
      setIsSaving(false);
    }
  };

  const isPermissionDenied = state.permission === "denied";
  const statusText = isLoading
    ? "상태 확인 중"
    : !state.supported
      ? "지원하지 않는 브라우저"
      : state.enabled
        ? "켜짐"
        : isPermissionDenied
          ? "브라우저에서 차단됨"
          : "꺼짐";

  return (
    <ModalBackdrop onClose={onClose} className="modal-backdrop--light">
      <section
        className="push-notification-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-notification-title"
        aria-describedby="push-notification-description"
      >
        <header>
          <h2 id="push-notification-title">웹 푸시 알림</h2>
          <p id="push-notification-description">
            브라우저가 닫혀 있어도 중요한 서비스 알림을 받습니다.
          </p>
        </header>
        <div className="push-notification-dialog__divider" />
        <div className="push-notification-dialog__body">
          <div className="push-notification-dialog__status">
            <span>현재 상태</span>
            <strong className={state.enabled ? "is-enabled" : ""}>
              {statusText}
            </strong>
          </div>
          <p>
            알림을 켜면 공지사항, 질문, 과제 및 강의자료 관련 알림이 이
            브라우저의 시스템 알림으로 표시됩니다.
          </p>
          {isPermissionDenied ? (
            <p className="push-notification-dialog__message" role="alert">
              브라우저 사이트 설정에서 알림 권한을 허용한 후 다시 시도해주세요.
            </p>
          ) : message ? (
            <p className="push-notification-dialog__message" role="status">
              {message}
            </p>
          ) : null}
        </div>
        <ModalActions
          className="push-notification-dialog__actions"
          onCancel={onClose}
          onConfirm={handleToggle}
          cancelText="닫기"
          confirmText={
            isSaving
              ? "처리 중"
              : state.enabled
                ? "알림 끄기"
                : "알림 켜기"
          }
          confirmDisabled={
            isLoading ||
            isSaving ||
            !state.supported ||
            (isPermissionDenied && !state.enabled)
          }
        />
      </section>
    </ModalBackdrop>
  );
}

function NoticesContent({ onClose }) {
  const [notices, setNotices] = useState([]);
  const [status, setStatus] = useState("loading");
  const [selectedNoticeId, setSelectedNoticeId] = useState("");
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [detailStatus, setDetailStatus] = useState("idle");

  useEffect(() => {
    let isMounted = true;
    getSystemNotices()
      .then(({ data }) => {
        if (!isMounted) return;
        const systemNotices = Array.isArray(data?.system_notices)
          ? data.system_notices
          : [];
        setNotices(systemNotices);
        setStatus("success");
      })
      .catch(() => {
        if (!isMounted) return;
        setNotices([]);
        setStatus("error");
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedNoticeId) return undefined;

    const controller = new AbortController();

    getSystemNotice(selectedNoticeId, { signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        setSelectedNotice((current) => ({ ...current, ...data }));
        setDetailStatus("success");
        setNotices((current) =>
          current.map((notice) =>
            notice.system_notice_id === selectedNoticeId
              ? { ...notice, is_read: true }
              : notice,
          ),
        );
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED") setDetailStatus("error");
      });

    return () => controller.abort();
  }, [selectedNoticeId]);

  const openDetail = (notice) => {
    setSelectedNotice(notice);
    setDetailStatus("loading");
    setSelectedNoticeId(notice.system_notice_id);
  };

  const closeDetail = () => {
    setSelectedNoticeId("");
    setSelectedNotice(null);
    setDetailStatus("idle");
  };

  const formatNoticeDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  return (
    <ModalBackdrop
      onClose={selectedNoticeId ? closeDetail : onClose}
      className="modal-backdrop--light"
    >
      <section
        className="profile-notices-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-notices-title"
        aria-describedby="profile-notices-description"
      >
        <header>
          <h2 id="profile-notices-title">
            {selectedNoticeId ? selectedNotice?.title ?? "공지사항" : "공지사항"}
          </h2>
          <p id="profile-notices-description">
            {selectedNoticeId
              ? formatNoticeDate(selectedNotice?.created_at)
              : "tikitaka의 업데이트와 서비스 안내를 확인합니다."}
          </p>
        </header>
        <div className="profile-notices-dialog__divider" />
        <div
          className={`profile-notices-dialog__body${selectedNoticeId ? " is-detail" : ""}`}
        >
          {selectedNoticeId ? (
            <>
              {detailStatus === "loading" ? (
                <p className="profile-notices-dialog__status">
                  공지사항을 불러오는 중입니다.
                </p>
              ) : null}
              {detailStatus === "error" ? (
                <p className="profile-notices-dialog__status" role="alert">
                  공지사항을 불러오지 못했습니다.
                </p>
              ) : null}
              {detailStatus === "success" ? (
                <p className="profile-notices-dialog__content">
                  {selectedNotice?.content ?? ""}
                </p>
              ) : null}
            </>
          ) : (
            <>
              {status === "loading" ? (
                <p className="profile-notices-dialog__status">
                  공지사항을 불러오는 중입니다.
                </p>
              ) : null}
              {status === "error" ? (
                <p className="profile-notices-dialog__status" role="alert">
                  공지사항을 불러오지 못했습니다.
                </p>
              ) : null}
              {status === "success" && notices.length === 0 ? (
                <p className="profile-notices-dialog__status">
                  등록된 공지사항이 없습니다.
                </p>
              ) : null}
              {notices.map((notice) => (
                <button
                  type="button"
                  className="profile-notice-card"
                  key={notice.system_notice_id}
                  onClick={() => openDetail(notice)}
                >
                  <h3>{notice.title}</h3>
                  {notice.created_at ? (
                    <time dateTime={notice.created_at}>
                      {formatNoticeDate(notice.created_at)}
                    </time>
                  ) : null}
                </button>
              ))}
            </>
          )}
        </div>
        <ModalActions
          className="profile-notices-dialog__actions"
          onConfirm={selectedNoticeId ? closeDetail : onClose}
          confirmText="닫기"
          showCancel={false}
        />
      </section>
    </ModalBackdrop>
  );
}

function InquiryContent({ onClose }) {
  const [requestBody, setRequestBody] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setRequestBody({
      type: formData.get("category"),
      title: formData.get("title"),
      content: formData.get("content"),
    });
  };

  const handleConfirm = async () => {
    if (!requestBody || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await createInquiry(requestBody);
      setIsComplete(true);
    } catch {
      setHasError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasError)
    return (
      <SystemErrorModal
        onInquiry={() => setHasError(false)}
        onClose={() => window.location.assign("/dashboard")}
      />
    );

  if (isComplete) {
    return (
      <CompactModal
        onClose={onClose}
        backdropClassName="modal-backdrop--light"
        labelledBy="inquiry-complete-modal-title"
        describedBy="inquiry-complete-modal-description"
        className="save-status-modal"
      >
        <div className="save-status-modal__icon-box" aria-hidden="true">
          <img
            className="inquiry-confirm-modal__icon"
            src={questionSubmitIcon}
            alt=""
          />
        </div>
        <div className="save-status-modal__text">
          <h2
            id="inquiry-complete-modal-title"
            className="save-status-modal__title"
          >
            등록 완료되었습니다
          </h2>
          <p
            id="inquiry-complete-modal-description"
            className="save-status-modal__description"
          >
            확인 후 메일로 연락드리겠습니다. 감사합니다.
          </p>
        </div>
        <ModalActions
          className="save-complete-modal__actions"
          onConfirm={onClose}
          confirmText="확인"
          showCancel={false}
        />
      </CompactModal>
    );
  }

  if (requestBody) {
    return (
      <CompactModal
        onClose={() => setRequestBody(null)}
        backdropClassName="modal-backdrop--light"
        labelledBy="inquiry-confirm-modal-title"
        describedBy="inquiry-confirm-modal-description"
        className="save-status-modal"
      >
        <div className="save-status-modal__icon-box" aria-hidden="true">
          <img
            className="inquiry-confirm-modal__icon"
            src={questionSubmitIcon}
            alt=""
          />
        </div>
        <div className="save-status-modal__text">
          <h2
            id="inquiry-confirm-modal-title"
            className="save-status-modal__title"
          >
            해당 내용으로 등록하시겠습니까?
          </h2>
          <p
            id="inquiry-confirm-modal-description"
            className="save-status-modal__description"
          >
            등록한 문의는 수정할 수 없습니다
          </p>
        </div>
        <ModalActions
          className="save-confirm-modal__actions"
          onCancel={() => setRequestBody(null)}
          onConfirm={handleConfirm}
          cancelText="취소"
          confirmText={isSubmitting ? "등록 중" : "등록"}
          confirmDisabled={isSubmitting}
        />
      </CompactModal>
    );
  }

  return (
    <ModalBackdrop onClose={onClose} className="modal-backdrop--light">
      <form
        className="profile-inquiry-dialog"
        aria-labelledby="profile-inquiry-title"
        aria-describedby="profile-inquiry-description"
        onSubmit={handleSubmit}
      >
        <header>
          <h2 id="profile-inquiry-title">문의하기</h2>
          <p id="profile-inquiry-description">
            오류 제보, 기능 제안 또는 서비스 이용 문의를 남겨주세요
          </p>
        </header>
        <div className="profile-inquiry-dialog__divider" />
        <div className="profile-inquiry-dialog__body">
          <label className="profile-inquiry-control">
            <span>분류</span>
            <span className="profile-inquiry-control__select">
              <select name="category" defaultValue="ERROR_REPORT">
                <option value="ERROR_REPORT">오류 제보</option>
                <option value="SUGGESTION_OTHER">기능 제안</option>
                <option value="ACCOUNT_USAGE">서비스 이용 문의</option>
              </select>
              <img src={inquiryChevronIcon} alt="" />
            </span>
          </label>
          <label className="profile-inquiry-control">
            <span>제목</span>
            <input name="title" placeholder="문의 제목을 적어주세요" required />
          </label>
          <label className="profile-inquiry-control">
            <span>문의 내용</span>
            <textarea
              name="content"
              placeholder="문의 내용을 적어주세요"
              required
            />
          </label>
        </div>
        <ModalActions
          className="profile-inquiry-dialog__actions"
          onCancel={onClose}
          cancelText="취소"
          confirmText="등록"
          confirmType="submit"
        />
      </form>
    </ModalBackdrop>
  );
}

function LogoutContent({ onClose }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await disableWebPush();
    } catch {
      /* Browser subscription cleanup must not prevent logout. */
    }
    clearStoredPushSubscriptionId();

    try {
      await logout();
    } catch {
      /* Local credentials still need to be cleared. */
    }

    localStorage.removeItem("tikitaka_access_token");
    localStorage.removeItem("tikitaka_refresh_token");
    localStorage.removeItem("tikitaka_user");
    setIsComplete(true);
    setIsLoggingOut(false);
  };

  const handleMoveToLogin = () => {
    window.location.replace("/login");
  };

  if (isComplete) {
    return (
      <CompactModal
        onClose={handleMoveToLogin}
        backdropClassName="modal-backdrop--light"
        labelledBy="logout-complete-modal-title"
        describedBy="logout-complete-modal-description"
        className="delete-status-modal"
      >
        <div className="delete-status-modal__icon-box" aria-hidden="true">
          <img className="logout-status-modal__icon" src={logoutIcon} alt="" />
        </div>
        <div className="delete-status-modal__text">
          <h2
            id="logout-complete-modal-title"
            className="delete-status-modal__title"
          >
            로그아웃되었습니다
          </h2>
          <p
            id="logout-complete-modal-description"
            className="delete-status-modal__description"
          >
            로그인 화면으로 이동합니다
          </p>
        </div>
        <ModalActions
          className="delete-complete-modal__actions"
          onConfirm={handleMoveToLogin}
          confirmText="확인"
          showCancel={false}
        />
      </CompactModal>
    );
  }

  return (
    <CompactModal
      onClose={onClose}
      backdropClassName="modal-backdrop--light"
      labelledBy="logout-confirm-modal-title"
      describedBy="logout-confirm-modal-description"
      className="delete-status-modal"
    >
      <div className="delete-status-modal__icon-box" aria-hidden="true">
        <img className="logout-status-modal__icon" src={logoutIcon} alt="" />
      </div>
      <div className="delete-status-modal__text">
        <h2
          id="logout-confirm-modal-title"
          className="delete-status-modal__title"
        >
          로그아웃하시겠습니까?
        </h2>
        <p
          id="logout-confirm-modal-description"
          className="delete-status-modal__description"
        >
          다시 이용하려면 로그인이 필요합니다
        </p>
      </div>
      <ModalActions
        className="delete-confirm-modal__actions"
        onCancel={onClose}
        onConfirm={handleLogout}
        cancelText="취소"
        confirmText={isLoggingOut ? "로그아웃 중" : "로그아웃"}
        confirmDisabled={isLoggingOut}
      />
    </CompactModal>
  );
}

function ProfileActionModal({ action, onClose, onProfileUpdated }) {
  if (action === "profile") {
    return (
      <ProfileEditFlow onClose={onClose} onProfileUpdated={onProfileUpdated} />
    );
  }

  if (action === "password") {
    return <PasswordContent onClose={onClose} />;
  }

  if (action === "push") {
    return <PushNotificationContent onClose={onClose} />;
  }

  if (action === "notices") {
    return <NoticesContent onClose={onClose} />;
  }

  if (action === "inquiry") {
    return <InquiryContent onClose={onClose} />;
  }

  if (action === "logout") {
    return <LogoutContent onClose={onClose} />;
  }

  return null;
}

export default ProfileActionModal;
