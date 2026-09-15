import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import backIcon from "../../../assets/icons/go-back.svg";
import materialThumbnail from "../../../assets/images/ci-cd-pipeline-notes.png";
import listIcon from "../../../assets/icons/space/space-list.svg";
import moreIcon from "../../../assets/icons/space/space-more.svg";
import uploadIcon from "../../../assets/icons/space/space-upload.svg";
import sortSelectedIcon from "../../../assets/icons/square-arrow-down-02.svg";
import DeleteIcon from "../../../assets/icons/delete.svg?react";
import PencilEditIcon from "../../../assets/icons/pencil-edit.svg?react";
import { AppToolbars } from "../../../components/common/AppToolbars.jsx";
import DeleteCompleteModal from "../components/DeleteCompleteModal.jsx";
import MaterialDeleteConfirmModal from "../components/MaterialDeleteConfirmModal.jsx";
import MaterialSaveCompleteModal from "../components/MaterialSaveCompleteModal.jsx";
import MaterialSaveConfirmModal from "../components/MaterialSaveConfirmModal.jsx";
import MaterialUploadModal from "../components/MaterialUploadModal.jsx";
import SpaceToolbar from "../components/SpaceToolbar.jsx";
import {
  deleteDocument,
  getDocuments,
  uploadDocument,
} from "../api/documentsApi.js";

import "../styles/spaceLecture.css";

function normalizeDocument(document, fileName) {
  return {
    id: document.document_id,
    title: document.title,
    fileName: fileName || `${document.title}.pdf`,
    thumbnailUrl: document.thumbnail_url,
    pageCount: document.page_count,
    uploadedAt: document.uploaded_at,
  };
}

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
  const [materialModalStep, setMaterialModalStep] = useState(null);
  const [pendingMaterial, setPendingMaterial] = useState(null);
  const [materialSaveError, setMaterialSaveError] = useState("");
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [materialsLoadError, setMaterialsLoadError] = useState("");
  const [openMaterialMenuId, setOpenMaterialMenuId] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [deleteModalStep, setDeleteModalStep] = useState(null);
  const [deleteMaterialError, setDeleteMaterialError] = useState("");
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);
  const [isScrollIndicatorVisible, setIsScrollIndicatorVisible] =
    useState(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState("latest");
  const scrollIndicatorTimerRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadDocuments = async () => {
      setIsLoadingMaterials(true);
      setMaterialsLoadError("");

      try {
        const documents = await getDocuments(spaceId, {
          signal: controller.signal,
        });
        setMaterials(
          Array.isArray(documents) ? documents.map(normalizeDocument) : [],
        );
      } catch (error) {
        if (error.code !== "ERR_CANCELED") {
          setMaterialsLoadError(
            error.response?.data?.message ||
              error.response?.data?.detail ||
              "강의자료를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingMaterials(false);
      }
    };

    loadDocuments();

    return () => controller.abort();
  }, [spaceId]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrollIndicatorVisible(true);
      window.clearTimeout(scrollIndicatorTimerRef.current);
      scrollIndicatorTimerRef.current = window.setTimeout(() => {
        setIsScrollIndicatorVisible(false);
      }, 700);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.clearTimeout(scrollIndicatorTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const closeSortModal = (event) => {
      if (!event.target.closest(".space-lecture-sort")) {
        setIsSortModalOpen(false);
      }
    };

    const closeSortModalWithEscape = (event) => {
      if (event.key === "Escape") {
        setIsSortModalOpen(false);
      }
    };

    document.addEventListener("mousedown", closeSortModal);
    document.addEventListener("keydown", closeSortModalWithEscape);

    return () => {
      document.removeEventListener("mousedown", closeSortModal);
      document.removeEventListener("keydown", closeSortModalWithEscape);
    };
  }, []);

  useEffect(() => {
    const closeMenu = (event) => {
      if (!event.target.closest(".lecture-material-card__menu-wrapper")) {
        setOpenMaterialMenuId(null);
      }
    };
    const closeMenuWithEscape = (event) => {
      if (event.key === "Escape") setOpenMaterialMenuId(null);
    };

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeMenuWithEscape);

    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeMenuWithEscape);
    };
  }, []);

  const closeMaterialModal = () => {
    setMaterialModalStep(null);
    setPendingMaterial(null);
    setSelectedMaterial(null);
    setMaterialSaveError("");
  };

  const handleConfirmMaterialSave = async () => {
    if (!pendingMaterial || isUploadingMaterial) return;

    setMaterialSaveError("");

    try {
      setIsUploadingMaterial(true);
      const uploadedDocument = await uploadDocument(spaceId, pendingMaterial);

      setMaterials((currentMaterials) => [
        ...currentMaterials,
        normalizeDocument(uploadedDocument, pendingMaterial.file.name),
      ]);
      setMaterialModalStep("complete");
    } catch (error) {
      setMaterialSaveError(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "강의자료 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsUploadingMaterial(false);
    }
  };

  const formatUploadedDate = (uploadedAt) => {
    if (!uploadedAt) return "-";

    const date = new Date(uploadedAt);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(date)
      .replaceAll(". ", ".")
      .replace(/\.$/, "");
  };

  const sortedMaterials = useMemo(() => {
    return [...materials].sort((first, second) => {
      if (sortOrder === "name") {
        return String(first.title ?? "").localeCompare(
          String(second.title ?? ""),
          "ko-KR",
        );
      }

      return new Date(second.uploadedAt).getTime() - new Date(first.uploadedAt).getTime();
    });
  }, [materials, sortOrder]);

  const selectSortOrder = (nextSortOrder) => {
    setSortOrder(nextSortOrder);
    setIsSortModalOpen(false);
  };

  const openEditModal = (material) => {
    setOpenMaterialMenuId(null);
    navigate(`/spaces/${spaceId}/documents/${material.id}/modify`, {
      state: {
        material,
        spaceName,
      },
    });
  };

  const openDeleteModal = (material) => {
    setSelectedMaterial(material);
    setOpenMaterialMenuId(null);
    setDeleteMaterialError("");
    setDeleteModalStep("confirm");
  };

  const handleConfirmMaterialDelete = async () => {
    if (!selectedMaterial || isDeletingMaterial) return;

    setDeleteMaterialError("");

    try {
      setIsDeletingMaterial(true);
      await deleteDocument(selectedMaterial.id);
      setMaterials((currentMaterials) =>
        currentMaterials.filter(
          (material) => material.id !== selectedMaterial.id,
        ),
      );
      setDeleteModalStep("complete");
    } catch (error) {
      setDeleteMaterialError(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "강의자료 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsDeletingMaterial(false);
    }
  };

  return (
    <main className="space-lecture-page space-page-transition">
      <div className="space-lecture-background" aria-hidden="true">
        <div className="space-lecture-page__orb space-lecture-page__orb--left" />
        <div className="space-lecture-page__orb space-lecture-page__orb--right" />
      </div>

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

        <div className="space-lecture-sort">
          <button
            type="button"
            className="space-lecture-sort__trigger"
            aria-label="강의자료 정렬 기준"
            aria-expanded={isSortModalOpen}
            aria-haspopup="dialog"
            onClick={() => setIsSortModalOpen((isOpen) => !isOpen)}
          >
            <img
              src={listIcon}
              alt=""
              className={isSortModalOpen ? "is-active" : undefined}
            />
          </button>

          <span
            className={`space-lecture-sort__scroll-indicator${
              isScrollIndicatorVisible ? " is-visible" : ""
            }`}
            aria-hidden="true"
          />

          {isSortModalOpen && (
            <div className="space-lecture-sort__modal" role="dialog" aria-label="정렬 기준">
              <strong>정렬 기준</strong>
              <button
                type="button"
                className={sortOrder === "latest" ? "is-selected" : undefined}
                onClick={() => selectSortOrder("latest")}
              >
                <span>최신순</span>
                {sortOrder === "latest" && <img src={sortSelectedIcon} alt="" />}
              </button>
              <button
                type="button"
                className={sortOrder === "name" ? "is-selected" : undefined}
                onClick={() => selectSortOrder("name")}
              >
                <span>이름순</span>
                {sortOrder === "name" && <img src={sortSelectedIcon} alt="" />}
              </button>
            </div>
          )}
        </div>

        <section
          className="space-lecture-content"
          aria-label={`${spaceName} 강의자료`}
          data-space-id={spaceId}
        >
          {isProfessor && !isLoadingMaterials && !materialsLoadError && (
            <button
              type="button"
              className="lecture-material-card"
              onClick={() => {
                setSelectedMaterial(null);
                setPendingMaterial(null);
                setMaterialModalStep("form");
              }}
            >
              <span className="lecture-material-card__upload">
                <img src={uploadIcon} alt="" />
              </span>
              <span className="lecture-material-card__details">
                <strong>강의자료 추가</strong>
                <small>PDF, 이미지 또는 문서를 업로드하세요.</small>
              </span>
            </button>
          )}

          {isLoadingMaterials && (
            <p
              className="space-lecture-status space-lecture-status--loading"
              role="status"
            >
              강의자료를 불러오는 중입니다.
            </p>
          )}

          {!isLoadingMaterials && materialsLoadError && (
            <p className="space-lecture-status space-lecture-status--error" role="alert">
              {materialsLoadError}
            </p>
          )}

          {!isLoadingMaterials && !materialsLoadError && sortedMaterials.map((material) => (
            <article
              key={material.id}
              className="lecture-material-card lecture-material-card--document"
            >
              <div className="lecture-material-card__preview">
                <img
                  src={material.thumbnailUrl || materialThumbnail}
                  alt={`${material.title} 첫 페이지`}
                />
              </div>
              <div className="lecture-material-card__details">
                <strong>{material.title}</strong>
                <small>
                  {formatUploadedDate(material.uploadedAt)} · {material.pageCount ?? 0}페이지
                </small>
                {isProfessor && (
                  <div className="lecture-material-card__menu-wrapper">
                    <button
                      type="button"
                      className={`lecture-material-card__more-button ${
                        openMaterialMenuId === material.id ? "is-active" : ""
                      }`}
                      aria-label={`${material.title} 관리 메뉴`}
                      aria-expanded={openMaterialMenuId === material.id}
                      onClick={() =>
                        setOpenMaterialMenuId((currentId) =>
                          currentId === material.id ? null : material.id,
                        )
                      }
                    >
                      <img src={moreIcon} alt="" />
                    </button>

                    {openMaterialMenuId === material.id && (
                      <div className="lecture-material-menu">
                        <button type="button" onClick={() => openEditModal(material)}>
                          <PencilEditIcon aria-hidden="true" />
                          <span>수정</span>
                        </button>
                        <button
                          type="button"
                          className="lecture-material-menu__delete"
                          onClick={() => openDeleteModal(material)}
                        >
                          <DeleteIcon aria-hidden="true" />
                          <span>삭제</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}

          {!isProfessor &&
            !isLoadingMaterials &&
            !materialsLoadError &&
            materials.length === 0 && (
              <p className="space-lecture-empty">
                강의자료가 아직 존재하지 않습니다.
              </p>
            )}
        </section>

        <SpaceToolbar activeItem="lecture" spaceId={spaceId} spaceName={spaceName} />
      </div>

      {isProfessor && materialModalStep === "form" && (
        <MaterialUploadModal
          initialMaterial={pendingMaterial}
          onClose={closeMaterialModal}
          onSave={(material) => {
            setMaterialSaveError("");
            setPendingMaterial(material);
            setMaterialModalStep("confirm");
          }}
        />
      )}

      {isProfessor && materialModalStep === "confirm" && pendingMaterial && (
        <MaterialSaveConfirmModal
          error={materialSaveError}
          isEditing={false}
          isSubmitting={isUploadingMaterial}
          onCancel={() => {
            if (isUploadingMaterial) return;
            setMaterialSaveError("");
            setMaterialModalStep("form");
          }}
          onConfirm={handleConfirmMaterialSave}
        />
      )}

      {isProfessor && materialModalStep === "complete" && (
        <MaterialSaveCompleteModal
          isEditing={Boolean(selectedMaterial)}
          onConfirm={closeMaterialModal}
        />
      )}

      {isProfessor && deleteModalStep === "confirm" && selectedMaterial && (
        <MaterialDeleteConfirmModal
          error={deleteMaterialError}
          isDeleting={isDeletingMaterial}
          onCancel={() => {
            if (isDeletingMaterial) return;
            setDeleteModalStep(null);
            setSelectedMaterial(null);
            setDeleteMaterialError("");
          }}
          onConfirm={handleConfirmMaterialDelete}
        />
      )}

      {isProfessor && deleteModalStep === "complete" && (
        <DeleteCompleteModal
          description="삭제한 강의자료는 다시 복구할 수 없습니다"
          onConfirm={() => {
            setDeleteModalStep(null);
            setSelectedMaterial(null);
            setDeleteMaterialError("");
          }}
        />
      )}
    </main>
  );
}

export default SpaceLecturePage;
