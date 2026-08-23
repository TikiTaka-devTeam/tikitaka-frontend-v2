import { useNavigate } from "react-router-dom";
import logoSrc from "../../../assets/images/logo_tikitaka_blue.svg";
import { BottomNavigation, SystemStatusBar, UtilityToolbar } from "../components/DashboardChrome.jsx";
import { NextClassCard, TaskSummaryCard } from "../components/DashboardCards.jsx";
import WeeklyTimetable from "../components/WeeklyTimetable.jsx";
import "../styles/dashboard.css";

function DashboardPage() {
  const navigate = useNavigate();
  const now = new Date();
  const semesterLabel = `${now.getFullYear()}년 ${now.getMonth() < 6 ? 1 : 2}학기`;

  return (
    <main className="dashboard-page">
      <div className="dashboard-page__orb dashboard-page__orb--left" aria-hidden="true" />
      <div className="dashboard-page__orb dashboard-page__orb--right" aria-hidden="true" />
      <SystemStatusBar />
      <UtilityToolbar />

      <div className="dashboard-shell">
        <header className="dashboard-brand">
          <button type="button" onClick={() => navigate("/dashboard")} aria-label="대시보드로 이동">
            <img src={logoSrc} alt="tikitaka" />
          </button>
          <p>{semesterLabel}</p>
        </header>
        <div className="dashboard-content">
          <div className="dashboard-timetable-scroll">
            <WeeklyTimetable semesterLabel={semesterLabel} />
          </div>
          <aside className="dashboard-sidebar">
            <NextClassCard />
            <TaskSummaryCard />
          </aside>
        </div>
      </div>

      <BottomNavigation />
    </main>
  );
}

export default DashboardPage;
