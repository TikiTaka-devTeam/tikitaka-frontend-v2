import ModalBackdrop from "../../../components/common/ModalBackdrop.jsx";
import deleteGuideIcon from "../../../assets/icons/documents/help-delete-guide.svg";
import helpCloseIcon from "../../../assets/icons/documents/help-close.svg";
import guideArrowIcon from "../../../assets/icons/documents/help-step.svg";
import stepBadgeIcon from "../../../assets/icons/documents/help-step-badge.svg";

function HelpStep({ className, number }) {
  return (
    <div className={`document-modify-help-step ${className}`} aria-hidden="true">
      <img src={stepBadgeIcon} alt="" />
      <span>{number}</span>
    </div>
  );
}

function DocumentModifyHelpOverlay({ onClose }) {
  return (
    <ModalBackdrop
      className="document-modify-help-backdrop"
      onClose={onClose}
    >
      <section
        className="document-modify-help"
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-modify-help-title"
        aria-describedby="document-modify-help-description"
      >
        <button
          type="button"
          className="document-modify-help-close"
          aria-label="도움말 닫기"
          onClick={onClose}
        >
          <img src={helpCloseIcon} alt="" />
        </button>

        <h2 id="document-modify-help-title">강의자료 수정 방법</h2>
        <p id="document-modify-help-description">
          필요한 기능을 한 화면에서 확인하세요
        </p>

        <HelpStep className="document-modify-help-step--upload" number="1" />
        <p className="document-modify-help-copy document-modify-help-copy--upload">
          수정할 강의자료를
          <br />
          업로드하세요
        </p>
        <span className="document-modify-help-arrow document-modify-help-arrow--upload" aria-hidden="true">
          <img src={guideArrowIcon} alt="" />
        </span>

        <HelpStep className="document-modify-help-step--preview" number="2" />
        <p className="document-modify-help-copy document-modify-help-copy--preview">
          파일을 누르면 가운데에서
          <br />
          페이지 미리보기를 확인할 수 있어요
        </p>
        <span className="document-modify-help-arrow document-modify-help-arrow--preview" aria-hidden="true">
          <img src={guideArrowIcon} alt="" />
        </span>
        <p className="document-modify-help-copy document-modify-help-copy--preview-panel">
          페이지 미리보기 화면은 여기에 나타나요!
        </p>

        <HelpStep className="document-modify-help-step--replace" number="3" />
        <p className="document-modify-help-copy document-modify-help-copy--replace">
          새 강의자료 페이지를 기존 페이지 쪽으로
          <br />
          끌어 놓으면 추가하거나 교체할 수 있어요
        </p>
        <span className="document-modify-help-arrow document-modify-help-arrow--replace" aria-hidden="true">
          <img src={guideArrowIcon} alt="" />
        </span>

        <HelpStep className="document-modify-help-step--delete" number="4" />
        <p className="document-modify-help-copy document-modify-help-copy--delete">
          기존 페이지를 선택한 뒤
          <br />
          삭제할 수 있어요
        </p>
        <img
          className="document-modify-help-delete-guide"
          src={deleteGuideIcon}
          alt=""
          aria-hidden="true"
        />

      </section>
    </ModalBackdrop>
  );
}

export default DocumentModifyHelpOverlay;
