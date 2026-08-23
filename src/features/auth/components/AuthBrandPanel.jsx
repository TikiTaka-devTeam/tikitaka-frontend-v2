import logoWhiteSrc from "../../../assets/images/logo_tikitaka_white.svg?url";

function AuthBrandPanel({ onSignUp }) {
  return (
    <section className="auth-brand-panel" aria-label="tikitaka service intro">
      <div className="auth-brand-panel__nav">
        <img className="auth-brand-panel__logo" src={logoWhiteSrc} alt="tikitaka" />
        <div className="auth-brand-panel__links">
          <button type="button" onClick={onSignUp}>Sign Up</button>
          <button type="button" className="auth-brand-panel__contact">
            Contact Us
          </button>
        </div>
      </div>

      <div className="auth-brand-panel__copy">
        <h1>{"기록을 쌓고, 기억을 남기세요"}</h1>
        <p>{"언제든 다시 꺼내볼 수 있도록"}</p>
      </div>
    </section>
  );
}

export default AuthBrandPanel;
