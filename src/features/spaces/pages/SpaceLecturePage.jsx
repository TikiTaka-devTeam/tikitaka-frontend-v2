import { useLocation, useNavigate, useParams } from "react-router-dom";

import backIcon from "../../../assets/icons/space/space-back.svg";
import listIcon from "../../../assets/icons/space/space-list.svg";
import moreIcon from "../../../assets/icons/space/space-more.svg";
import uploadIcon from "../../../assets/icons/space/space-upload.svg";
import { AppToolbars } from "../../../components/common/AppToolbars.jsx";
import SpaceToolbar from "../components/SpaceToolbar.jsx";

import "../styles/spaceLecture.css";

function readUserRole() {
  try {
    const user = JSON.parse(localStorage.getItem("tikitaka_user") || "null");
    const role =
      user?.account_type ??
      user?.accountType ??
      user?.role ??
      user?.user?.account_type ??
      user?.user?.accountType ??
      user?.user?.role ??
      localStorage.getItem("tikitaka_account_type") ??
      localStorage.getItem("account_type") ??
      localStorage.getItem("role") ??
      "";

    return String(role).toUpperCase();
  } catch {
    return "";
  }
}

function SpaceLecturePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { spaceId } = useParams();
  const isProfessor = readUserRole() === "PROFESSOR";
  const spaceName = location.state?.spaceName || "실무중심산학협력프로젝트1";

  return (
    <main className="space-lecture-page">
      <div className="space-lecture-page__orb space-lecture-page__orb--left" />
      <div className="space-lecture-page__orb space-lecture-page__orb--right" />

      <div className="app-frame space-lecture-frame">
        <button
          type="button"
          className="space-lecture-back"
          aria-label="Space 목록으로 돌아가기"
          onClick={() => navigate("/spaces")}
        >
          <img src={backIcon} alt="" />
        </button>

        <header className="space-lecture-header">
          <h1>{spaceName}</h1>
          <p>강의자료</p>
        </header>

        <AppToolbars
          showBottomNavigation={false}
          onSearch={() => navigate("/search")}
        />

        <div className="space-lecture-list-indicator" aria-hidden="true">
          <img src={listIcon} alt="" />
          <span />
        </div>

        <section
          className="space-lecture-content"
          aria-label={`${spaceName} 강의자료`}
          data-space-id={spaceId}
        >
          {isProfessor ? (
            <button type="button" className="lecture-material-card">
              <span className="lecture-material-card__upload">
                <img src={uploadIcon} alt="" />
              </span>
              <span className="lecture-material-card__details">
                <strong>강의자료 추가</strong>
                <small>PDF, 이미지 또는 문서를 업로드하세요.</small>
                <img src={moreIcon} alt="" />
              </span>
            </button>
          ) : (
            <p className="space-lecture-empty">
              강의자료가 아직 존재하지 않습니다.
            </p>
          )}
        </section>

        <div className="space-lecture-bottom-safe-area" aria-hidden="true" />
        <SpaceToolbar activeItem="lecture" />
      </div>
    </main>
  );
}

export default SpaceLecturePage;
