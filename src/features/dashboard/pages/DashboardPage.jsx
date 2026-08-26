import { useState } from "react";
import { AppToolbars } from "../../../components/common/AppToolbars.jsx";
import BrandLogo from "../../../components/common/BrandLogo.jsx";
import { NextClassCard, TaskSummaryCard } from "../components/DashboardCards.jsx";
import WeeklyTimetable from "../components/WeeklyTimetable.jsx";
import "../styles/dashboard.css";

function DashboardPage() {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const now = new Date();
  const semesterLabel = `${now.getFullYear()}년 ${now.getMonth() < 6 ? 1 : 2}학기`;

  return (
    <main className="dashboard-page">
      <div className="dashboard-page__orb dashboard-page__orb--left" aria-hidden="true" />
      <div className="dashboard-page__orb dashboard-page__orb--right" aria-hidden="true" />
      <AppToolbars />

      <div className="dashboard-shell">
        <header className="dashboard-brand">
          <BrandLogo />
          <p>{semesterLabel}</p>
        </header>
        <div className="dashboard-content">
          <div className="dashboard-timetable-scroll">
            <WeeklyTimetable
              semesterLabel={semesterLabel}
              selectedCourseId={selectedCourse?.id}
              onCourseSelect={setSelectedCourse}
            />
          </div>
          <aside className="dashboard-sidebar">
            <NextClassCard selectedCourse={selectedCourse} />
            <TaskSummaryCard selectedCourse={selectedCourse} />
          </aside>
        </div>
      </div>
    </main>
  );
}

export default DashboardPage;
