import { useEffect, useState } from "react";

import BrandLogo from "../../../components/common/BrandLogo.jsx";

function AuthBrandPanel({ onSignUp }) {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState("idle");

  useEffect(() => {
    if (!isContactOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsContactOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isContactOpen]);

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmitting(true);
    setSubmitState("idle");

    const formData = new FormData(form);

    try {
      const response = await fetch(
        "https://formsubmit.co/ajax/tikitakadev2026@gmail.com",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("Contact form submission failed");
      }

      form.reset();
      setSubmitState("success");
    } catch {
      setSubmitState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="auth-brand-panel" aria-label="tikitaka service intro">
        <div className="auth-brand-panel__nav">
          <BrandLogo
            variant="white"
            imageClassName="auth-brand-panel__logo"
            interactive={false}
          />
          <div className="auth-brand-panel__links">
            <button type="button" onClick={onSignUp}>
              Sign Up
            </button>
            <button
              type="button"
              className="auth-brand-panel__contact"
              onClick={() => {
                setSubmitState("idle");
                setIsContactOpen(true);
              }}
            >
              Contact Us
            </button>
          </div>
        </div>

        <div className="auth-brand-panel__copy">
          <h1>{"기록을 쌓고, 기억을 남기세요"}</h1>
          <p>{"언제든 다시 꺼내볼 수 있도록"}</p>
        </div>
      </section>

      {isContactOpen && (
        <div
          className="auth-contact-modal__backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsContactOpen(false);
            }
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
                onClick={() => setIsContactOpen(false)}
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
                  onClick={() => setIsContactOpen(false)}
                >
                  확인
                </button>
              </div>
            ) : (
              <form
                className="auth-contact-form"
                onSubmit={handleContactSubmit}
              >
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
                {submitState === "error" && (
                  <p className="auth-contact-form__error" role="alert">
                    문의 전송에 실패했습니다. 잠시 후 다시 시도해주세요.
                  </p>
                )}
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
      )}
    </>
  );
}

export default AuthBrandPanel;
