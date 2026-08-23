import { useLocation, useNavigate } from "react-router-dom";

import SignupStepper from "../components/SignupStepper.jsx";

import "../styles/signupComplete.css";

function SignupCompletePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const name = location.state?.name || "회원";
  const profileUrl = location.state?.profileUrl || "";

  return (
    <main className="signup-inform-page">
      <section className="signup-inform-card">
        <h1>회원가입</h1>
        <div className="title-line-thick" />

        <SignupStepper currentStep={4} />

        <div className="section-title">가입 완료</div>
        <div className="title-line-thin" />

        <div className="signup-complete-content">
            <div className="signup-complete-profile">
              {profileUrl && (
                <img src={profileUrl} alt={`${name} 프로필 사진`} />
              )}
            </div>

            <div className="signup-complete-message">
              <strong>회원가입 완료</strong>
              <p>
                {name} 님의
                <br />
                회원가입이 완료되었습니다!
              </p>
            </div>

            <button
              className="signup-complete-login-button"
              type="button"
              onClick={() => navigate("/login", { replace: true })}
            >
              로그인으로 돌아가기
            </button>
          </div>

        <div className="title-line-thin signup-inform-bottom-line" />
      </section>
    </main>
  );
}

export default SignupCompletePage;
