import "../styles/signupTerms.css";

function SignupStepper({ currentStep }) {
  const steps = ["약관 동의", "정보 입력", "가입 완료"];

  return (
    <div className="signup-stepper">
      <div className="step-track">
        {steps.map((step, index) => (
          <div key={step} className="step-track-item">
            <div
              className={`step-dot ${
                currentStep > index + 1
                  ? "completed"
                  : currentStep === index + 1
                    ? "active"
                    : "inactive"
              }`}
            />
            {index < steps.length - 1 && (
              <div
                className={`step-connector ${
                  currentStep > index + 1 ? "completed" : ""
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="step-labels">
        {steps.map((step, index) => (
          <span
            key={step}
            className={`step-label ${
              currentStep >= index + 1 ? "active" : "inactive"
            }`}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}

export default SignupStepper;
