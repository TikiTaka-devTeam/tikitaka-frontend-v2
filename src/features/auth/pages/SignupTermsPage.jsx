import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SignupStepper from "../components/SignupStepper";
import TermsSection from "../components/TermsSection";

import {
  serviceTerms,
  privacyTerms,
} from "../data/terms";

import "../styles/signupTerms.css";

function SignupTermsPage() {
  const navigate = useNavigate();
  const [serviceAgree, setServiceAgree] =
    useState(false);

  const [privacyAgree, setPrivacyAgree] =
    useState(false);

  const isValid =
    serviceAgree && privacyAgree;

  const handleNext = () => {
    if (!isValid) {
      alert("필수 약관에 동의해주세요.");
      return;
    }

    navigate("/signup-inform");
  };

  return (
    <div className="signup-container">
      <div className="signup-card">

        <h1>회원가입</h1>
        <div className="title-line-thick"></div>

        <SignupStepper currentStep={1} />

        <div className="section-title">
          약관 동의
        </div>
        <div className="title-line-thin"></div>

        <TermsSection
          title="서비스 이용 약관 동의"
          checked={serviceAgree}
          onChange={() =>
            setServiceAgree(!serviceAgree)
          }
          content={serviceTerms}
        />
        <div className="blank-space"></div>
        <TermsSection
          title="개인정보 수집 및 이용 약관 동의"
          checked={privacyAgree}
          onChange={() =>
            setPrivacyAgree(!privacyAgree)
          }
          content={privacyTerms}
        />
        <div className="title-line-thin"></div>

        <div className="button-group">
          <button
            className="prev-btn"
            onClick={() => navigate("/login")}
          >
            이전
          </button>

          <button
            className="next-btn"
            disabled={!isValid}
            onClick={handleNext}
          >
            다음
          </button>
        </div>

      </div>
    </div>
  );
}

export default SignupTermsPage;
