import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppToolbars } from "../../../components/common/AppToolbars.jsx";
import BrandLogo from "../../../components/common/BrandLogo.jsx";
import {
  NextClassCard,
  TaskSummaryCard,
} from "../components/DashboardCards.jsx";
import NotificationPanel from "../components/NotificationPanel.jsx";
import ProfileActionModal from "../components/ProfileActionModal.jsx";
import ProfileMenu from "../components/ProfileMenu.jsx";
import WeeklyTimetable from "../components/WeeklyTimetable.jsx";

import "../styles/dashboard.css";

function DashboardPage() {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profileAction, setProfileAction] = useState(null);
  const [profileImage, setProfileImage] = useState(undefined);

  const now = new Date();

  const semesterLabel = `${now.getFullYear()}년 ${
    now.getMonth() < 6 ? 1 : 2
  }학기`;

  return (
    <main className="dashboard-page">
      <div
        className="dashboard-background"
        aria-hidden="true"
      >
        <div className="dashboard-page__orb dashboard-page__orb--left" />
        <div className="dashboard-page__orb dashboard-page__orb--right" />
      </div>

      <div className="app-frame dashboard-frame">
        <BrandLogo
          variant="blue"
          className="app-brand"
        />

        <AppToolbars
          onSearch={() => navigate("/search")}
          onNotifications={() => {
            setIsProfileMenuOpen(false);
            setIsNotificationsOpen((isOpen) => !isOpen);
          }}
          onProfile={() => {
            setIsNotificationsOpen(false);
            setIsProfileMenuOpen((isOpen) => !isOpen);
          }}
          profileImage={profileImage}
        />

        {isNotificationsOpen ? (
          <NotificationPanel onClose={() => setIsNotificationsOpen(false)} />
        ) : null}

        {isProfileMenuOpen ? (
          <ProfileMenu onSelect={(action) => {
            setIsProfileMenuOpen(false);
            setProfileAction(action);
          }} />
        ) : null}

        {profileAction ? (
          <ProfileActionModal
            action={profileAction}
            onClose={() => setProfileAction(null)}
            onProfileUpdated={setProfileImage}
          />
        ) : null}

        <div className="app-container dashboard-shell">
          <header className="dashboard-brand">
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
              <NextClassCard
                selectedCourse={selectedCourse}
              />

              <TaskSummaryCard
                selectedCourse={selectedCourse}
              />
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

export default DashboardPage;
