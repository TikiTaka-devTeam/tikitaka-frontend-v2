import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { getCurrentUser, oauthLogin } from "../api/auth.api.js";
import { syncExistingWebPushSubscription } from "../../notifications/services/webPush.js";
import "../styles/login.css";

function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const completeOAuthLogin = async () => {
      const authorizationCode = searchParams.get("code");
      const returnedState = searchParams.get("state");
      const expectedState = sessionStorage.getItem("tikitaka_oauth_state");
      const provider = sessionStorage.getItem("tikitaka_oauth_provider");

      sessionStorage.removeItem("tikitaka_oauth_state");
      sessionStorage.removeItem("tikitaka_oauth_provider");

      if (
        !authorizationCode ||
        !provider ||
        !returnedState ||
        returnedState !== expectedState
      ) {
        setErrorMessage("OAuth 인증 정보를 확인하지 못했습니다.");
        return;
      }

      try {
        const { data } = await oauthLogin(provider, authorizationCode);

        if (!isMounted) return;

        if (data?.signup_required) {
          if (!data.signup_token) {
            throw new Error("OAuth 회원가입 토큰이 없습니다.");
          }

          sessionStorage.setItem(
            "tikitaka_oauth_signup",
            JSON.stringify({
              signupToken: data.signup_token,
              profile: data.oauth_profile || {},
            }),
          );
          navigate("/signup-terms", { replace: true });
          return;
        }

        if (!data?.access_token || !data?.refresh_token) {
          throw new Error("OAuth 로그인 응답에 토큰이 없습니다.");
        }

        localStorage.setItem("tikitaka_access_token", data.access_token);
        localStorage.setItem("tikitaka_refresh_token", data.refresh_token);

        let completeUser = data.user;

        try {
          const { data: currentUser } = await getCurrentUser();
          completeUser = { ...(data.user || {}), ...(currentUser || {}) };
        } catch {
          // OAuth 로그인 자체는 성공했으므로 기존 응답으로 계속 진행합니다.
        }

        if (!isMounted) return;

        if (completeUser) {
          localStorage.setItem("tikitaka_user", JSON.stringify(completeUser));
        }

        await syncExistingWebPushSubscription().catch(() => null);

        sessionStorage.removeItem("tikitaka_oauth_signup");
        const notificationRedirect = sessionStorage.getItem(
          "tikitaka_notification_redirect",
        );
        sessionStorage.removeItem("tikitaka_notification_redirect");
        navigate(notificationRedirect || "/dashboard", { replace: true });
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error.response?.data?.message ||
              error.message ||
              "OAuth 로그인에 실패했습니다.",
          );
        }
      }
    };

    void completeOAuthLogin();
    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams]);

  return (
    <main className="login-page">
      <section className="login-form-panel" aria-live="polite">
        <div className="login-form-panel__inner">
          <div className="login-form-panel__header">
            <h1>
              {errorMessage ? "로그인에 실패했습니다" : "로그인 중입니다"}
            </h1>
            <p>{errorMessage || "OAuth 인증 정보를 확인하고 있습니다."}</p>
          </div>
          {errorMessage ? (
            <button
              type="button"
              className="login-form__submit"
              onClick={() => navigate("/login", { replace: true })}
            >
              로그인 화면으로 돌아가기
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default OAuthCallbackPage;
