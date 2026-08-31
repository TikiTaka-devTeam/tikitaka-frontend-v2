import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import BrandLogo from "../../../components/common/BrandLogo.jsx";
import { AppToolbars } from "../../../components/common/AppToolbars.jsx";

import CreateSpaceModal from "../components/CreateSpaceModal.jsx";
import SaveCompleteModal from "../components/SaveCompleteModal.jsx";
import SaveConfirmModal from "../components/SaveConfirmModal.jsx";
import SpaceCard from "../components/SpaceCard.jsx";
import SpaceEmptyState from "../components/SpaceEmptyState.jsx";

import "../styles/spaces.css";

function SpacesPage() {
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useState("active");
  const [spaces] = useState([]);

  const [spaceModalStep, setSpaceModalStep] =
    useState(null);

  const [pendingSpaceData, setPendingSpaceData] =
    useState(null);

  const visibleSpaces = useMemo(() => {
    return spaces.filter((space) => {
      if (selectedTab === "active") {
        return !space.archived;
      }

      return space.archived;
    });
  }, [spaces, selectedTab]);

  const handleAddSpace = () => {
    setPendingSpaceData(null);
    setSpaceModalStep("create");
  };

  const handleCloseCreateModal = () => {
    setPendingSpaceData(null);
    setSpaceModalStep(null);
  };

  const handleCreateSpaceSave = (spaceData) => {
    setPendingSpaceData(spaceData);
    setSpaceModalStep("confirm");
  };

  const handleConfirmCancel = () => {
    setSpaceModalStep("create");
  };

  const handleConfirmSave = () => {
    console.log(
      "생성할 Space:",
      pendingSpaceData,
    );

    setSpaceModalStep("complete");
  };

  const handleCompleteConfirm = () => {
    setPendingSpaceData(null);
    setSpaceModalStep(null);
  };

  const handleArchive = (spaceId) => {
    console.log("Space 보관:", spaceId);
  };

  const handleActivate = (spaceId) => {
    console.log("Space 활성화:", spaceId);
  };

  const handleEdit = (spaceId) => {
    console.log("Space 수정:", spaceId);
  };

  const handleDelete = (spaceId) => {
    console.log("Space 삭제:", spaceId);
  };

  const handleSearch = () => {
    navigate("/search");
  };

  const handleNotifications = () => {
    console.log("알림");
  };

  return (
    <main className="spaces-page">
      <div className="app-frame spaces-frame">
        <BrandLogo
          variant="blue"
          className="app-brand"
        />

        <AppToolbars
          onSearch={handleSearch}
          onNotifications={handleNotifications}
        />

        <div className="app-container spaces-container">
          <div className="spaces-header">
            <div className="spaces-header__left">
              <h1 className="spaces-title">
                Space 목록
              </h1>

              <div
                className="spaces-tabs"
                role="tablist"
                aria-label="Space 상태"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={
                    selectedTab === "active"
                  }
                  className={`spaces-tab ${
                    selectedTab === "active"
                      ? "spaces-tab--selected"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedTab("active")
                  }
                >
                  활성화
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={
                    selectedTab === "archived"
                  }
                  className={`spaces-tab ${
                    selectedTab === "archived"
                      ? "spaces-tab--selected"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedTab("archived")
                  }
                >
                  보관됨
                </button>
              </div>
            </div>

            <button
              type="button"
              className="add-space-button"
              onClick={handleAddSpace}
            >
              Add Space
            </button>
          </div>

          {visibleSpaces.length > 0 && (
            <div className="space-grid">
              {visibleSpaces.map((space) => (
                <SpaceCard
                  key={space.id}
                  space={space}
                  onArchive={handleArchive}
                  onActivate={handleActivate}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {visibleSpaces.length === 0 && (
          <SpaceEmptyState />
        )}
      </div>

      {spaceModalStep === "create" && (
        <CreateSpaceModal
          initialData={pendingSpaceData}
          onClose={handleCloseCreateModal}
          onSave={handleCreateSpaceSave}
        />
      )}

      {spaceModalStep === "confirm" && (
        <SaveConfirmModal
          onCancel={handleConfirmCancel}
          onConfirm={handleConfirmSave}
        />
      )}

      {spaceModalStep === "complete" && (
        <SaveCompleteModal
          onConfirm={handleCompleteConfirm}
        />
      )}
    </main>
  );
}

export default SpacesPage;