import googleLogoSrc from "../../../assets/images/logo_google.svg";
import kakaoLogoSrc from "../../../assets/images/logo_kakao.svg";

function SocialLoginButtons() {
  return (
    <div className="social-login-buttons">
      <button type="button" className="social-login-button social-login-button--google">
        <img
          className="social-login-button__google-mark"
          src={googleLogoSrc}
          alt=""
          aria-hidden="true"
        />
        <span>{"Continue with Google"}</span>
      </button>

      <button type="button" className="social-login-button social-login-button--kakao">
        <img src={kakaoLogoSrc} alt="" aria-hidden="true" />
        <span>{"카카오로 로그인"}</span>
      </button>
    </div>
  );
}

export default SocialLoginButtons;
