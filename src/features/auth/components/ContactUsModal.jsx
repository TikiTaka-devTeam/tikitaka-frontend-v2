import { useEffect, useState } from "react";

import "../styles/login.css";

function ContactUsModal({ onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState("idle");

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmitting(true);
    setSubmitState("idle");

    try {
      const response = await fetch(
        "https://formsubmit.co/ajax/tikitakadev2026@gmail.com",
        {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        },
      );

      if (!response.ok) throw new Error("Contact form submission failed");
      form.reset();
      setSubmitState("success");
    } catch {
      setSubmitState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="auth-contact-modal__backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="auth-contact-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-contact-modal-title"
      >
        <div className="auth-contact-modal__header">
          <div>
            <p className="auth-contact-modal__eyebrow">CONTACT US</p>
            <h2 id="auth-contact-modal-title">문의하기</h2>
          </div>
          <button
            type="button"
            className="auth-contact-modal__close"
            aria-label="문의 팝업 닫기"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {submitState === "success" ? (
          <div className="auth-contact-modal__result" role="status">
            <strong>문의가 접수되었습니다.</strong>
            <p>확인 후 빠르게 답변드리겠습니다.</p>
            <button
              type="button"
              className="auth-contact-modal__submit"
              onClick={onClose}
            >
              확인
            </button>
          </div>
        ) : (
          <form className="auth-contact-form" onSubmit={handleSubmit}>
            <input
              type="hidden"
              name="_subject"
              value="tikitaka Contact Us 문의"
              readOnly
            />
            <label>
              이름
              <input name="name" type="text" required autoFocus />
            </label>
            <label>
              <span className="auth-contact-form__label-text">
                이메일 <em>(선택)</em>
              </span>
              <input name="email" type="email" />
            </label>
            <label>
              전화번호
              <input name="phone" type="tel" required />
            </label>
            <label>
              문의 내용
              <textarea name="message" rows="5" required />
            </label>
            {submitState === "error" ? (
              <p className="auth-contact-form__error" role="alert">
                문의 전송에 실패했습니다. 잠시 후 다시 시도해주세요.
              </p>
            ) : null}
            <button
              type="submit"
              className="auth-contact-modal__submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "전송 중..." : "문의하기"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ContactUsModal;
