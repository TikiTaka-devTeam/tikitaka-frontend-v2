import googleLogoSrc from "../../../assets/images/logo_google.svg";
import kakaoLogoSrc from "../../../assets/images/logo_kakao.svg";

const OAUTH_CONFIG = {
  GOOGLE: {
    clientId: import.meta.env.GOOGLE_OAUTH_CLIENT_ID,
    redirectUri: import.meta.env.GOOGLE_OAUTH_REDIRECT_URI,
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scope: "openid email profile",
  },
  KAKAO: {
    clientId: import.meta.env.KAKAO_OAUTH_CLIENT_ID,
    redirectUri: import.meta.env.KAKAO_OAUTH_REDIRECT_URI,
    authorizationUrl: "https://kauth.kakao.com/oauth/authorize",
  },
};

function SocialLoginButtons() {
  const startOAuthLogin = (provider) => {
    const config = OAUTH_CONFIG[provider];

    if (!config?.clientId || !config?.redirectUri) {
      window.alert("OAuth 환경 설정을 확인해주세요.");
      return;
    }

    const state = crypto.randomUUID();
    sessionStorage.setItem("tikitaka_oauth_state", state);
    sessionStorage.setItem("tikitaka_oauth_provider", provider);

    const authorizationUrl = new URL(config.authorizationUrl);
    authorizationUrl.searchParams.set("client_id", config.clientId);
    authorizationUrl.searchParams.set(
      "redirect_uri",
      new URL(config.redirectUri, window.location.origin).toString(),
    );
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("state", state);

    if (config.scope) {
      authorizationUrl.searchParams.set("scope", config.scope);
    }

    window.location.assign(authorizationUrl.toString());
  };

  return (
    <div className="social-login-buttons">
      <button type="button" className="social-login-button social-login-button--google" onClick={() => startOAuthLogin("GOOGLE")}>
        <img
          className="social-login-button__google-mark"
          src={googleLogoSrc}
          alt=""
          aria-hidden="true"
        />
        <span>{"Continue with Google"}</span>
      </button>

      <button type="button" className="social-login-button social-login-button--kakao" onClick={() => startOAuthLogin("KAKAO")}>
        <img src={kakaoLogoSrc} alt="" aria-hidden="true" />
        <span>{"카카오로 로그인"}</span>
      </button>
    </div>
  );
}

export default SocialLoginButtons;
