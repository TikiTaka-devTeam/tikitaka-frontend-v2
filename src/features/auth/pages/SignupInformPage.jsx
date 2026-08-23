import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import SignupStepper from "../components/SignupStepper.jsx";
import { checkEmailDuplicate, signup, createProfileImage } from "../api/auth.api.js";

import addImgIcon from "../../../assets/icons/addImg.svg";
import hidePasswordIcon from "../../../assets/icons/HidePassword.svg";
import watchPasswordIcon from "../../../assets/icons/WatchPassword.svg";
import "../styles/signupInform.css";

const campusOptions = [
  "단국대학교 죽전캠퍼스",
  "단국대학교 천안캠퍼스",
  "서울대학교",
  "연세대학교",
  "고려대학교",
  "성균관대학교",
  "한양대학교",
  "중앙대학교",
  "경희대학교",
  "한국외국어대학교",
  "서울시립대학교",
  "숭실대학교",
  "인하대학교",
  "건국대학교",
  "동국대학교",
  "홍익대학교",
  "서강대학교",
  "이화여자대학교",
  "숙명여자대학교",
  "세종대학교",
  "광운대학교",
  "국민대학교",
  "상명대학교",
  "가천대학교",
  "명지대학교",
  "인제대학교",
  "안양대학교",
  "수원대학교"
];

const initialForm = {
  name: "",
  email: "",
  password: "",
  passwordConfirm: "",
  phonePrefix: "010",
  phoneNumber: "",
  verificationCode: "",
  role: "",
  univ: "",
  major: "",
  memberIdNumber: "",
  profileUrl: "",
};

const VERIFICATION_TIME_LIMIT = 300;
const DEVELOPMENT_VERIFICATION_CODE = "111111";

function formatPhoneNumber(prefix, number) {
  const digits = number.replace(/\D/g, "");

  if (digits.length === 8) {
    return `${prefix}-${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  return `${prefix}-${digits}`;
}

function formatVerificationTime(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainingSeconds = String(seconds % 60).padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

function getIsDuplicateEmail(data) {
  if (data === true) {
    return true;
  }

  if (typeof data?.duplicated === "boolean") {
    return data.duplicated;
  }

  if (typeof data?.duplicate === "boolean") {
    return data.duplicate;
  }

  if (typeof data?.exists === "boolean") {
    return data.exists;
  }

  if (typeof data?.available === "boolean") {
    return !data.available;
  }

  return false;
}

function isDuplicateEmailError(error) {
  const status = error.response?.status;
  const message = error.response?.data?.message || "";

  return (
    status === 409 ||
    message.includes("중복") ||
    message.toLowerCase().includes("already") ||
    message.toLowerCase().includes("exist")
  );
}

function SignupInformPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState("");
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationTimeLeft, setVerificationTimeLeft] = useState(
    VERIFICATION_TIME_LIMIT,
  );
  const [selectedProfileFile, setSelectedProfileFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [phoneErrorMessage, setPhoneErrorMessage] = useState("");

  const passwordsMatch =
    form.password.length > 0 && form.password === form.passwordConfirm;

  const isValid = useMemo(
    () =>
      form.name.trim() &&
      form.email.trim() &&
      emailChecked &&
      form.password.length >= 8 &&
      passwordsMatch &&
      form.phoneNumber.trim().length === 8 &&
      form.role &&
      form.univ &&
      form.major.trim() &&
      form.memberIdNumber.trim(),
    [emailChecked, form, passwordsMatch],
  );

  useEffect(() => {
    if (!phoneCodeSent || phoneVerified || verificationTimeLeft <= 0) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setVerificationTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [phoneCodeSent, phoneVerified, verificationTimeLeft]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "phoneNumber" || name === "verificationCode"
          ? value.replace(/\D/g, "")
          : value,
    }));

    if (name === "email") {
      setEmailChecked(false);
      setEmailErrorMessage("");
    }

    if (name === "phoneNumber") {
      setPhoneVerified(false);
      setPhoneCodeSent(false);
      setVerificationTimeLeft(VERIFICATION_TIME_LIMIT);
      setPhoneErrorMessage("");
    }
  };

  const handleEmailCheck = async () => {
    const email = form.email.trim();

    if (!email) {
      setEmailChecked(false);
      setEmailErrorMessage("이메일을 입력해주세요.");
      return;
    }

    setIsCheckingEmail(true);
    setEmailChecked(false);
    setEmailErrorMessage("");

    try {
      const response = await checkEmailDuplicate(email);

      if (getIsDuplicateEmail(response.data)) {
        setEmailErrorMessage("이미 사용 중인 이메일입니다.");
        return;
      }

      setEmailChecked(true);
      setErrorMessage("");
    } catch (error) {
      if (isDuplicateEmailError(error)) {
        setEmailErrorMessage("이미 사용 중인 이메일입니다.");
        return;
      }

      setEmailErrorMessage("중복된 이메일입니다.");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleSendCode = () => {
    const phoneNumber = form.phoneNumber.trim();

    if (!phoneNumber) {
      setPhoneErrorMessage("휴대폰 번호를 입력해주세요.");
      return;
    }

    if (phoneNumber.length !== 8) {
      setPhoneErrorMessage("휴대폰 번호는 8자리여야 합니다.");
      return;
    }

    setPhoneCodeSent(true);
    setPhoneVerified(false);
    setVerificationTimeLeft(VERIFICATION_TIME_LIMIT);
    setForm((prev) => ({ ...prev, verificationCode: "" }));
    setPhoneErrorMessage("");
    setErrorMessage("");
  };

  const handleExtendTime = () => {
    setVerificationTimeLeft(VERIFICATION_TIME_LIMIT);
  };

  const handleVerifyCode = () => {
    if (!form.verificationCode.trim()) {
      setErrorMessage("인증번호를 입력해주세요.");
      return;
    }

    if (
      verificationTimeLeft <= 0 ||
      form.verificationCode.trim() !== DEVELOPMENT_VERIFICATION_CODE
    ) {
      window.alert("인증번호가 틀렸습니다.");
      setPhoneVerified(false);
      return;
    }

    setPhoneVerified(true);
    setErrorMessage("");
  };

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedProfileFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSelectedProfileFile(null);
      setErrorMessage("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((prev) => ({
          ...prev,
          profileUrl: reader.result,
        }));
        setSelectedProfileFile(file);
        setErrorMessage("");
      }
    };

    reader.onerror = () => {
      setErrorMessage("프로필 사진을 불러오지 못했습니다.");
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isValid) {
      setErrorMessage("필수 정보를 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      let profileImageKeyToSend = null;
      let profileUrlToShow = form.profileUrl;

      if (selectedProfileFile) {
        const uploadResult = await createProfileImage(selectedProfileFile);

        profileImageKeyToSend = uploadResult.objectKey;
        profileUrlToShow = uploadResult.profileUrl || form.profileUrl;
      }

      const payload = {
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        univ: form.univ,
        major: form.major.trim(),
        role: form.role,
        phoneNumber: formatPhoneNumber(form.phonePrefix, form.phoneNumber),
        memberIdNumber: form.memberIdNumber.trim(),
      };

      if (profileImageKeyToSend) {
        payload.profile_image_key = profileImageKeyToSend;
      }

      await signup(payload);

      navigate("/signup-complete", {
        replace: true,
        state: {
          name: form.name.trim(),
          profileUrl: profileUrlToShow,
        },
      });
    } catch (error) {
      if (isDuplicateEmailError(error)) {
        setEmailChecked(false);
        setEmailErrorMessage("이미 사용 중인 이메일입니다.");
        return;
      }

      const message =
        error.response?.data?.message ||
        error.message ||
        "회원가입에 실패했습니다. 입력 정보를 확인해주세요.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="signup-inform-page">
      <form className="signup-inform-card" onSubmit={handleSubmit}>
        <h1>회원가입</h1>
        <div className="title-line-thick" />

        <SignupStepper currentStep={2} />

        <div className="section-title">정보 입력</div>
        <div className="title-line-thin" />

        <div className="signup-inform-scroll">
          <label className="signup-inform-field">
            <span>이름</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="실명을 입력해주세요. 수업 시 사용되는 이름입니다."
            />
          </label>

          <label className="signup-inform-field">
            <span>이메일</span>
            <div className="signup-inform-inline">
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="이메일을 입력해주세요."
              />
              <button
                className={`signup-inform-action ${
                  emailChecked ? "is-done" : ""
                }`}
                type="button"
                disabled={isCheckingEmail}
                onClick={handleEmailCheck}
              >
                {isCheckingEmail ? "확인 중" : emailChecked ? "완료" : "중복 확인"}
              </button>
            </div>
            {emailErrorMessage && (
              <p className="signup-inform-field-error">
                {emailErrorMessage}
              </p>
            )}
          </label>

          <label className="signup-inform-field">
            <span>비밀번호</span>
            <div className="signup-inform-password">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="비밀번호를 입력해주세요. (8자 이상)"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                <img
                  src={showPassword ? watchPasswordIcon : hidePasswordIcon}
                  alt=""
                />
              </button>
            </div>
            {form.password && form.password.length < 8 && (
              <p className="signup-inform-field-error">
                비밀번호는 8자리 이상으로 입력해주세요.
              </p>
            )}
          </label>

          <label className="signup-inform-field">
            <span>비밀번호 확인</span>
            <div className="signup-inform-password">
              <input
                name="passwordConfirm"
                type={showPasswordConfirm ? "text" : "password"}
                value={form.passwordConfirm}
                onChange={handleChange}
                placeholder="확인을 위하여 위와 동일하게 입력해주세요."
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm((prev) => !prev)}
                aria-label={
                  showPasswordConfirm ? "비밀번호 확인 숨기기" : "비밀번호 확인 보기"
                }
              >
                <img
                  src={
                    showPasswordConfirm ? watchPasswordIcon : hidePasswordIcon
                  }
                  alt=""
                />
              </button>
            </div>
            {form.passwordConfirm && !passwordsMatch && (
              <p className="signup-inform-field-error">
                비밀번호가 일치하지 않습니다.
              </p>
            )}
          </label>

          <div className="signup-inform-field">
            <span>휴대폰 번호</span>
            <div className="signup-inform-phone">
              <select
                name="phonePrefix"
                value={form.phonePrefix}
                onChange={handleChange}
              >
                <option value="010">010</option>
                <option value="011">011</option>
                <option value="016">016</option>
              </select>
              <input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                maxLength={8}
                placeholder="- 없이 입력해주세요."
              />
              <button
                className={`signup-inform-action ${
                  phoneCodeSent ? "is-done" : ""
                }`}
                type="button"
                onClick={handleSendCode}
              >
                {phoneCodeSent ? "인증번호 재전송" : "인증번호 전송"}
              </button>
            </div>
            {phoneErrorMessage && (
              <p className="signup-inform-field-error">
                {phoneErrorMessage}
              </p>
            )}
            {phoneCodeSent && (
              <div className="signup-inform-verification">
                <div className="signup-inform-code">
                  <input
                    name="verificationCode"
                    value={form.verificationCode}
                    onChange={handleChange}
                    placeholder="인증번호를 입력해주세요."
                  />
                  <button
                    className={`signup-inform-action ${
                      phoneVerified ? "is-done" : ""
                    }`}
                    type="button"
                    onClick={handleVerifyCode}
                  >
                    {phoneVerified ? "인증 완료" : "인증번호 확인"}
                  </button>
                </div>
                <div className="signup-inform-code-meta">
                  <span>
                    입력대기시간 :{" "}
                    <strong>
                      {formatVerificationTime(verificationTimeLeft)}
                    </strong>
                  </span>
                  <button type="button" onClick={handleExtendTime}>
                    시간연장
                  </button>
                </div>
                <p className="signup-inform-code-help">
                  인증번호는 받은 시점으로부터 5분간만 유효합니다.
                </p>
              </div>
            )}
          </div>

          <div className="signup-inform-role-row">
            <span>역할</span>
            <div className="signup-inform-role-options">
              <button
                className={form.role === "STUDENT" ? "is-selected" : ""}
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, role: "STUDENT" }))
                }
              >
                학생
              </button>
              <button
                className={form.role === "PROFESSOR" ? "is-selected" : ""}
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, role: "PROFESSOR" }))
                }
              >
                교수
              </button>
            </div>
          </div>

          <div className="signup-inform-grid">
            <label className="signup-inform-field">
              <span>학교</span>
              <select name="univ" value={form.univ} onChange={handleChange}>
                <option value="">학교를 선택해주세요.</option>
                {campusOptions.map((campus) => (
                  <option key={campus} value={campus}>
                    {campus}
                  </option>
                ))}
              </select>
            </label>

            <label className="signup-inform-field">
              <span>1전공</span>
              <input
                name="major"
                value={form.major}
                onChange={handleChange}
                placeholder="1전공을 입력해주세요. ex) 컴퓨터공학과"
              />
            </label>
          </div>

          <label className="signup-inform-field">
            <span>학번</span>
            <input
              name="memberIdNumber"
              value={form.memberIdNumber}
              onChange={handleChange}
              placeholder="학번을 입력해주세요. 강의자에게 표시되는 학번입니다."
            />
          </label>

          <div className="signup-inform-profile">
            <div className="signup-inform-profile-copy">
              <strong>프로필 사진 (선택)</strong>
              <p>로그인 후 다시 선택할 수 있습니다.</p>
            </div>
            <div className="signup-inform-profile-uploader">
              <div className="signup-inform-profile-preview">
                {form.profileUrl && (
                  <img src={form.profileUrl} alt="선택한 프로필 사진" />
                )}
              </div>
              <label
                className="signup-inform-profile-button"
                aria-label="프로필 사진 추가"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                />
                <img src={addImgIcon} alt="" />
              </label>
            </div>
          </div>
        </div>

        {errorMessage && (
          <p className="signup-inform-error" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="title-line-thin signup-inform-bottom-line" />

        <div className="button-group">
          <button
            className="prev-btn"
            type="button"
            onClick={() => navigate("/signup-terms")}
          >
            이전
          </button>
          <button
            className="next-btn"
            type="submit"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? "처리 중" : "다음"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default SignupInformPage;
