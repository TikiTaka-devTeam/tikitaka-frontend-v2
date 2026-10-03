import { useState } from "react";

import BrandLogo from "../../../components/common/BrandLogo.jsx";
import ContactUsModal from "./ContactUsModal.jsx";

function AuthBrandPanel({ onSignUp }) {
  const [isContactOpen, setIsContactOpen] = useState(false);
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
              onClick={() => setIsContactOpen(true)}
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

      {isContactOpen ? (
        <ContactUsModal onClose={() => setIsContactOpen(false)} />
      ) : null}
    </>
  );
}

export default AuthBrandPanel;
