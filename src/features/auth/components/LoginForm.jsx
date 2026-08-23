import { useState } from "react";
import { login } from "../api/auth.api.js";
import SocialLoginButtons from "./SocialLoginButtons.jsx";

function LoginForm({ onSignUp }) {
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const { data } = await login(formValues);
      const accessToken = data?.access_token ?? data?.accessToken;
      const refreshToken = data?.refresh_token ?? data?.refreshToken;
      const user =
        data?.user ??
        (data?.email || data?.role
          ? {
              email: data.email,
              role: data.role,
            }
          : null);

      if (!accessToken || !refreshToken) {
        throw new Error("로그인 응답에 토큰이 없습니다.");
      }

      localStorage.setItem("tikitaka_access_token", accessToken);
      localStorage.setItem("tikitaka_refresh_token", refreshToken);

      if (user) {
        localStorage.setItem("tikitaka_user", JSON.stringify(user));
      }

      setSuccessMessage("로그인되었습니다.");
      window.location.assign("/");
    } catch {
      setErrorMessage("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-form-panel" aria-labelledby="login-title">
      <div className="login-form-panel__inner">
        <div className="login-form-panel__header">
          <h1 id="login-title">안녕하세요!</h1>
          <p>오늘도 티키타카를 찾아주셔서 감사합니다.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-form__field">
            <span className="sr-only">이메일</span>
            <input
              type="email"
              name="email"
              placeholder="이메일"
              value={formValues.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </label>

          <label className="login-form__field">
            <span className="sr-only">비밀번호</span>
            <input
              type="password"
              name="password"
              placeholder="비밀번호"
              value={formValues.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </label>

          <button type="button" className="login-form__forgot">
            비밀번호 찾기
          </button>

          {errorMessage ? <p className="login-form__error">{errorMessage}</p> : null}
          {successMessage ? <p className="login-form__success">{successMessage}</p> : null}

          <button type="submit" className="login-form__submit" disabled={isSubmitting}>
            {isSubmitting ? "로그인 중" : "로그인"}
          </button>
        </form>

        <p className="login-form-panel__signup">
          {"아직 계정이 없으시다면? "}
          <button type="button" onClick={onSignUp}>{"회원가입 하러 가기!"}</button>
        </p>

        <div className="login-form-panel__divider">
          <span>간편 로그인</span>
        </div>

        <SocialLoginButtons />
      </div>
    </section>
  );
}

export default LoginForm;
