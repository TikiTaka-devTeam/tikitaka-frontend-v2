import { useState } from "react";

import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";

import chevronIcon from "../../../assets/icons/inquiry-chevron.svg";

import "../styles/memberPermissionModal.css";

const PERMISSION_OPTIONS = [
  {
    value: "MEMBER_MANAGE",
    label: "멤버 관리",
    description: "이 Space의 멤버들을 관리할 수 있습니다",
  },
  {
    value: "LECTURE_MATERIAL_MANAGE",
    label: "강의자료 관리",
    description: "Space의 강의자료들을 관리할 수 있습니다",
  },
  {
    value: "NOTICE_MANAGE",
    label: "공지사항 관리",
    description: "Space의 공지사항을 관리할 수 있습니다",
  },
  {
    value: "QUESTION_MANAGE",
    label: "질문 관리",
    description: "Space에서 나온 질문들을 관리할 수 있습니다",
  },
  {
    value: "ASSIGNMENT_MANAGE",
    label: "과제 관리",
    description: "Space의 과제를 관리할 수 있습니다",
  },
];

function MemberPermissionModal({
  role,
  permissions,
  isLoading,
  errorMessage,
  readOnly = false,
  onRoleChange,
  onPermissionToggle,
  onCancel,
  onConfirm,
}) {
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(!readOnly);
  const isAssistant = role === "ASSISTANT";

  function handleRoleChange(nextRole) {
    onRoleChange(nextRole);
    setIsRoleMenuOpen(false);
  }

  return (
    <CompactModal
      onClose={onCancel}
      labelledBy="member-permission-modal-title"
      describedBy="member-permission-modal-description"
      className="member-permission-modal"
    >
      <header className="member-permission-modal__header">
        <h2 id="member-permission-modal-title">권한 관리</h2>
        <p id="member-permission-modal-description">
          {readOnly ? "권한을 확인하세요" : "조교 권한을 관리하세요"}
        </p>
      </header>

      <div className="member-permission-modal__divider" aria-hidden="true" />

      {isLoading ? (
        <p className="member-permission-modal__state">권한을 불러오는 중입니다.</p>
      ) : (
        <div className="member-permission-modal__body">
          <section className="member-permission-modal__role-section">
            <h3>{readOnly ? "역할" : "역할 부여"}</h3>
            <div className="member-permission-modal__role-select">
              {readOnly ? (
                <div className="member-permission-modal__role-control member-permission-modal__role-control--readonly">
                  <span>{isAssistant ? "조교" : "학생"}</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="member-permission-modal__role-control"
                  aria-haspopup="listbox"
                  aria-expanded={isRoleMenuOpen}
                  onClick={() => setIsRoleMenuOpen((previous) => !previous)}
                >
                  <span>{isAssistant ? "조교" : "학생"}</span>
                  <img
                    className={isRoleMenuOpen ? "is-open" : ""}
                    src={chevronIcon}
                    alt=""
                  />
                </button>
              )}

              {!readOnly && isRoleMenuOpen ? (
                <div className="member-permission-modal__role-menu" role="listbox">
                  {["ASSISTANT", "STUDENT"].map((option) => {
                    const isSelected = role === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={isSelected ? "is-selected" : ""}
                        onClick={() => handleRoleChange(option)}
                      >
                        <span>{option === "ASSISTANT" ? "조교" : "학생"}</span>
                        {isSelected ? <span aria-hidden="true">✓</span> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </section>

          {isAssistant ? (
            <section className="member-permission-modal__permissions">
              <h3>{readOnly ? "권한" : "권한 부여"}</h3>
              {PERMISSION_OPTIONS.map(({ value, label, description }) => {
                const isChecked = permissions.includes(value);

                return (
                  <div className="member-permission-modal__permission" key={value}>
                    <div>
                      <strong>{label}</strong>
                      <p>{description}</p>
                    </div>
                    {readOnly ? (
                      <span
                        role="switch"
                        aria-label={`${label} 권한`}
                        aria-checked={isChecked}
                        aria-readonly="true"
                        className={`member-permission-modal__switch${isChecked ? " is-on" : ""}`}
                      >
                        <span />
                      </span>
                    ) : (
                      <button
                        type="button"
                        role="switch"
                        aria-label={`${label} 권한`}
                        aria-checked={isChecked}
                        className={`member-permission-modal__switch${isChecked ? " is-on" : ""}`}
                        onClick={() => onPermissionToggle(value)}
                      >
                        <span />
                      </button>
                    )}
                  </div>
                );
              })}
            </section>
          ) : null}
        </div>
      )}

      {errorMessage ? (
        <p className="member-permission-modal__error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {readOnly ? (
        <div className="modal-actions member-permission-modal__actions">
          <button
            type="button"
            className="modal-actions__button modal-actions__cancel"
            onClick={onCancel}
          >
            닫기
          </button>
        </div>
      ) : (
        <ModalActions
          className="member-permission-modal__actions"
          onCancel={onCancel}
          onConfirm={onConfirm}
          confirmText="저장"
          confirmDisabled={isLoading || Boolean(errorMessage)}
        />
      )}
    </CompactModal>
  );
}

export default MemberPermissionModal;
