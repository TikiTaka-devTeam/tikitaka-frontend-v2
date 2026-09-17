import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import checkmarkOffIcon from "../../../assets/icons/documents/checkmark-off.svg";
import checkmarkOnIcon from "../../../assets/icons/documents/checkmark-on.svg";
import deletedWatermarkIcon from "../../../assets/icons/documents/deleted_watermark.svg";
import documentTitlePenIcon from "../../../assets/icons/documents/document-modify-title-pen.svg";
import helpIcon from "../../../assets/icons/documents/help.svg";
import goBackIcon from "../../../assets/icons/go-back.svg";
import noteIcon from "../../../assets/icons/documents/note.svg";
import pageAddedIcon from "../../../assets/icons/documents/page-added.svg";
import redoIcon from "../../../assets/icons/documents/redo.svg";
import saveIcon from "../../../assets/icons/documents/save.svg";
import selectedPageDeleteIcon from "../../../assets/icons/documents/selected-page-delete.svg";
import undoIcon from "../../../assets/icons/documents/undo.svg";
import { apiClient } from "../../../lib/api/client.js";
import {
  getDocumentDownloadUrl,
  getDocumentSlides,
} from "../../lecture/api/lectureApi.js";
import {
  completeRevision,
  createDocumentRevision,
  createRevisionOperation,
  getDocumentRevision,
  redoRevision,
  undoRevision,
  uploadRevisionSourcePdf,
} from "../../lecture/api/revisionApi.js";
import { createUuid } from "../../lecture/utils/lectureData.js";

import DocumentModifyHelpOverlay from "../components/DocumentModifyHelpOverlay.jsx";
import DocumentRevisionSaveModal from "../components/DocumentRevisionSaveModal.jsx";
import PdfPageCanvas from "../components/PdfPageCanvas.jsx";
import "../styles/documentModify.css";

GlobalWorkerOptions.workerSrc = pdfWorker;

const MIN_PREVIEW_ZOOM = 0.5;
const MAX_PREVIEW_ZOOM = 3;
const PREVIEW_ZOOM_STEP = 0.25;

function getRevisionStorageKey(documentId) {
  return `tikitaka_document_revision:${documentId}`;
}

function normalizeRevisionSlides(revision) {
  return (
    revision?.revision_slides
    ?? revision?.revisionSlides
    ?? []
  ).map((slide) => ({
    page: Number(slide.source_page_number ?? slide.sourcePageNumber),
    revisionSlideId: slide.revision_slide_id ?? slide.revisionSlideId,
    thumbnailUrl: slide.thumbnail_url ?? slide.thumbnailUrl,
  })).filter(({ page }) => Number.isInteger(page) && page > 0);
}

function isVisiblePreviewPage(page) {
  return !(
    page?.sourceType === "REVISION"
    && page?.status === "DELETE_PENDING"
  );
}

function findVisiblePreviewPage(pages, preferredPageId) {
  const preferredPageIndex = pages.findIndex(
    ({ pageId }) => pageId === preferredPageId,
  );
  const preferredPage = pages[preferredPageIndex];

  if (preferredPage && isVisiblePreviewPage(preferredPage)) {
    return preferredPage;
  }

  if (preferredPageIndex >= 0) {
    return pages.slice(preferredPageIndex + 1).find(isVisiblePreviewPage)
      ?? pages.slice(0, preferredPageIndex).reverse().find(isVisiblePreviewPage)
      ?? null;
  }

  return pages.find(isVisiblePreviewPage) ?? null;
}

function hydrateRevisionPreview(revision, originalPages, knownPages = []) {
  let originalIndex = 0;
  let revisionIndex = 0;
  const revisionSlides = normalizeRevisionSlides(revision);
  const knownRevisionPages = knownPages.filter(
    ({ sourceType }) => sourceType === "REVISION",
  );
  const serverPages = revision?.preview_pages ?? revision?.previewPages ?? [];

  return [...serverPages]
    .sort((first, second) => Number(first.position) - Number(second.position))
    .map((page, index) => {
      const sourceType = page.source_type ?? page.sourceType;
      const sourcePageNumber = Number(
        page.source_page_number ?? page.sourcePageNumber,
      );
      const pageId = page.page_id ?? page.pageId;
      const knownRevisionPage = sourceType === "REVISION"
        ? knownRevisionPages[revisionIndex++]
        : null;
      const knownPage = knownPages.find((candidate) => candidate.pageId === pageId)
        ?? knownRevisionPage;
      const originalPage = sourceType === "ORIGINAL"
        ? originalPages[originalIndex++]
        : null;
      const revisionSlide = sourceType === "REVISION"
        ? revisionSlides.find((slide) => (
          slide.thumbnailUrl
          && slide.thumbnailUrl === (page.thumbnail_url ?? page.thumbnailUrl)
        ))
        : null;

      return {
        ...originalPage,
        ...knownPage,
        pageId,
        position: Number(page.position) || index + 1,
        sourcePage: knownPage?.sourcePage
          ?? originalPage?.sourcePage
          ?? revisionSlide?.page
          ?? (Number.isInteger(sourcePageNumber) ? sourcePageNumber : index + 1),
        sourceType,
        status: page.status ?? "ACTIVE",
        thumbnailUrl: page.thumbnail_url ?? page.thumbnailUrl,
      };
    });
}

function getRevisionStartErrorMessage(error) {
  const response = error?.response?.data;
  const errorCode = response?.code ?? response?.error_code ?? response?.error?.code;

  if (errorCode === "REVISION_ALREADY_ACTIVE") {
    return "다른 사용자가 이 강의자료를 수정하고 있습니다.";
  }

  if (errorCode === "REVISION_NOT_EDITABLE") {
    return "강의자료 수정 내용을 처리하고 있어 지금은 편집할 수 없습니다.";
  }

  return response?.message
    ?? response?.detail
    ?? "강의자료 수정 세션을 시작하지 못했습니다.";
}

function createPdfLoadingTask(pdfUrl) {
  const apiBaseUrl = new URL(
    apiClient.defaults.baseURL,
    window.location.origin,
  );
  const resolvedPdfUrl = new URL(
    pdfUrl,
    `${apiBaseUrl.href.replace(/\/$/, "")}/`,
  );
  const accessToken = localStorage.getItem("tikitaka_access_token");
  const shouldAuthorize = accessToken && resolvedPdfUrl.origin === apiBaseUrl.origin;

  return getDocument({
    url: resolvedPdfUrl.href,
    ...(shouldAuthorize
      ? { httpHeaders: { Authorization: `Bearer ${accessToken}` } }
      : {}),
  });
}

function SlideBlock({
  added = false,
  checked,
  deleted = false,
  disabled = false,
  draggable = false,
  emptyMessage,
  imageUrl,
  page,
  pdfPage = page,
  pdfDocument,
  selected,
  onCheck,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSelect,
  dragging = false,
}) {
  return (
    <div
      className={[
        "document-modify-slide-block",
        selected ? "is-selected" : "",
        deleted ? "is-deleted" : "",
        draggable ? "is-draggable" : "",
        dragging ? "is-dragging" : "",
      ].filter(Boolean).join(" ")}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <button
        type="button"
        className="document-modify-slide-preview"
        aria-label={`${page}페이지 미리보기`}
        draggable="false"
        onClick={onSelect}
      >
        {imageUrl && !pdfDocument ? (
          <img
            className="document-modify-slide-thumbnail-image"
            src={imageUrl}
            alt=""
          />
        ) : (
          <PdfPageCanvas
            className="document-modify-pdf-page--thumbnail"
            emptyMessage={emptyMessage}
            pageNumber={pdfPage}
            pdfDocument={pdfDocument}
          />
        )}
        <span>{page}</span>
      </button>
      <button
        type="button"
        className="document-modify-slide-check"
        aria-label={deleted
          ? `${page}페이지 삭제 예정`
          : `${page}페이지 ${checked ? "선택 해제" : "선택"}`}
        aria-pressed={checked}
        disabled={deleted || disabled}
        onClick={onCheck}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <img src={checked ? checkmarkOnIcon : checkmarkOffIcon} alt="" />
      </button>
      {deleted && (
        <img
          className="document-modify-slide-deleted-watermark"
          src={deletedWatermarkIcon}
          alt=""
          aria-hidden="true"
        />
      )}
      {added && !deleted && (
        <img
          className="document-modify-slide-added"
          src={pageAddedIcon}
          alt="새로 추가된 페이지"
        />
      )}
    </div>
  );
}

function FloatingSlideBlock({ imageUrl, page, pdfDocument, position }) {
  return (
    <div
      className="document-modify-drag-preview"
      style={{
        left: `${position.x - position.offsetX}px`,
        top: `${position.y - position.offsetY}px`,
      }}
      aria-hidden="true"
    >
      {imageUrl && !pdfDocument ? (
        <img
          className="document-modify-slide-thumbnail-image"
          src={imageUrl}
          alt=""
        />
      ) : (
        <PdfPageCanvas
          className="document-modify-pdf-page--thumbnail"
          pageNumber={page}
          pdfDocument={pdfDocument}
        />
      )}
      <span>{page}</span>
    </div>
  );
}

function InsertDropZone({ active }) {
  return (
    <div
      className={`document-modify-insert-zone${active ? " is-active" : ""}`}
      aria-hidden="true"
    />
  );
}

function DocumentModifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { documentId, spaceId } = useParams();
  const revisionFileInputRef = useRef(null);
  const revisionSessionRef = useRef(null);
  const revisionCreationPromiseRef = useRef(null);
  const revisionPreviewRef = useRef(null);
  const pointerDragRef = useRef(null);
  const scrollEndTimerRef = useRef(null);
  const originalPageListRef = useRef(null);
  const revisionPageListRef = useRef(null);
  const [selectedPage, setSelectedPage] = useState(1);
  const [selectedSource, setSelectedSource] = useState("original");
  const [checkedPreviewPageIds, setCheckedPreviewPageIds] = useState([]);
  const [checkedRevisionPages, setCheckedRevisionPages] = useState([]);
  const [deletedOriginalPages, setDeletedOriginalPages] = useState([]);
  const [originalPdfDocument, setOriginalPdfDocument] = useState(null);
  const [originalPdfError, setOriginalPdfError] = useState("");
  const [revisionFile, setRevisionFile] = useState(null);
  const [revisionPdfDocument, setRevisionPdfDocument] = useState(null);
  const [revisionPdfError, setRevisionPdfError] = useState("");
  const [revisionSlides, setRevisionSlides] = useState([]);
  const [previewPages, setPreviewPages] = useState(() => {
    const pageCount = Math.max(1, Number(location.state?.material?.pageCount) || 1);
    return Array.from({ length: pageCount }, (_, index) => ({
      pageId: `original-${index + 1}`,
      sourcePage: index + 1,
      sourceType: "ORIGINAL",
      status: "ACTIVE",
    }));
  });
  const baseOriginalPagesRef = useRef(previewPages);
  const [revisionSession, setRevisionSession] = useState(null);
  const [isUploadingRevision, setIsUploadingRevision] = useState(false);
  const [isRenderingRevisionPdf, setIsRenderingRevisionPdf] = useState(false);
  const [isApplyingInsert, setIsApplyingInsert] = useState(false);
  const [isApplyingDelete, setIsApplyingDelete] = useState(false);
  const [isApplyingHistory, setIsApplyingHistory] = useState(false);
  const [isCompletingRevision, setIsCompletingRevision] = useState(false);
  const [saveModalStep, setSaveModalStep] = useState(null);
  const [saveModalError, setSaveModalError] = useState("");
  const [draggedRevisionPage, setDraggedRevisionPage] = useState(null);
  const [activeInsertPosition, setActiveInsertPosition] = useState(null);
  const [dragPreview, setDragPreview] = useState(null);
  const [selectedPreviewPageId, setSelectedPreviewPageId] = useState("original-1");
  const [isSelectedPageAdded, setIsSelectedPageAdded] = useState(false);
  const [notice, setNotice] = useState("");
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [scrollingPanel, setScrollingPanel] = useState(null);

  const material = location.state?.material ?? {};
  const spaceName = location.state?.spaceName ?? "강의 Space";
  const initialDocumentName = material.title ?? material.fileName ?? "강의자료.pdf";
  const [documentName, setDocumentName] = useState(initialDocumentName);
  const [documentNameDraft, setDocumentNameDraft] = useState(initialDocumentName);
  const [isEditingDocumentName, setIsEditingDocumentName] = useState(false);
  const selectedRevisionSlide = revisionSlides.find(({ page }) => page === selectedPage);
  const revisionSourceFileName = revisionSession?.source_file_name
    ?? revisionSession?.sourceFileName;
  const revisionSourcePdfUrl = revisionSession?.source_pdf_url
    ?? revisionSession?.sourcePdfUrl;
  const hasReadyRevisionSlides = revisionSlides.length > 0
    && revisionSlides.every(({ revisionSlideId }) => revisionSlideId);
  const isRevisionPdfPending = Boolean(
    (revisionFile || revisionSourcePdfUrl)
    && !revisionPdfDocument
    && !revisionPdfError,
  );
  const isRevisionPanelLoading = isUploadingRevision
    || isRenderingRevisionPdf
    || isRevisionPdfPending;
  const isApplyingRevisionOperation = isApplyingInsert
    || isApplyingDelete
    || isApplyingHistory
    || isCompletingRevision;
  const canUndo = Boolean(revisionSession?.can_undo ?? revisionSession?.canUndo);
  const canRedo = Boolean(revisionSession?.can_redo ?? revisionSession?.canRedo);
  const isRevisionEditable = revisionSession?.status === "EDITING";
  const isRevisionInteractionLocked = !isRevisionEditable
    || isApplyingRevisionOperation;
  const visiblePreviewPages = previewPages.filter(isVisiblePreviewPage);
  const selectedPreviewPage = previewPages.find(
    ({ pageId }) => pageId === selectedPreviewPageId,
  );
  const selectedPdfDocument = selectedSource === "revision"
    ? revisionPdfDocument
    : originalPdfDocument;
  const selectedPdfError = selectedSource === "revision"
    ? revisionPdfError
    : originalPdfError;
  const isSelectedPageDeleted = selectedPreviewPage?.status === "DELETE_PENDING"
    || (selectedSource === "original" && deletedOriginalPages.includes(selectedPage));

  const getErrorMessage = (error, fallback) => (
    error?.response?.data?.message
    || error?.response?.data?.detail
    || fallback
  );

  const updateRevisionSession = useCallback((nextSession) => {
    const mergedSession = {
      ...revisionSessionRef.current,
      ...nextSession,
    };

    revisionSessionRef.current = mergedSession;
    setRevisionSession(mergedSession);

    if (mergedSession.revision_id) {
      localStorage.setItem(
        getRevisionStorageKey(documentId),
        mergedSession.revision_id,
      );
    }

    return mergedSession;
  }, [documentId]);

  useEffect(() => {
    if (!documentId) return undefined;

    let cancelled = false;
    let loadingTask;

    const loadOriginalPdf = async () => {
      try {
        setOriginalPdfError("");
        const slidesResponse = await getDocumentSlides(documentId);
        const pdfUrl = slidesResponse?.pdf_url ?? slidesResponse?.pdfUrl;

        if (!pdfUrl) throw new Error("PDF URL이 없습니다.");

        let pdf;

        try {
          loadingTask = createPdfLoadingTask(pdfUrl);
          pdf = await loadingTask.promise;
        } catch (slidesPdfError) {
          loadingTask?.destroy();

          const downloadResponse = await getDocumentDownloadUrl(documentId);
          const downloadUrl = downloadResponse?.download_url ?? downloadResponse?.downloadUrl;

          if (!downloadUrl || downloadUrl === pdfUrl) throw slidesPdfError;

          loadingTask = createPdfLoadingTask(downloadUrl);
          pdf = await loadingTask.promise;
        }

        if (cancelled) {
          pdf.destroy();
          return;
        }

        const responseSlides = (slidesResponse?.slides ?? [])
          .map((slide) => ({
            pageId: slide.slide_id ?? slide.slideId,
            sourcePage: Number(slide.page_number ?? slide.pageNumber),
            sourceType: "ORIGINAL",
            status: slide.status ?? "ACTIVE",
          }))
          .filter(({ sourcePage }) => (
            Number.isInteger(sourcePage) && sourcePage >= 1 && sourcePage <= pdf.numPages
          ))
          .sort((first, second) => first.sourcePage - second.sourcePage);
        const responsePages = responseSlides.map(({ sourcePage }) => sourcePage);
        const nextPages = responsePages.length > 0
          ? responsePages
          : Array.from({ length: pdf.numPages }, (_, index) => index + 1);
        const nextPreviewPages = responseSlides.length > 0
          ? responseSlides
          : nextPages.map((sourcePage) => ({
            pageId: `original-${sourcePage}`,
            sourcePage,
            sourceType: "ORIGINAL",
            status: "ACTIVE",
          }));

        setOriginalPdfDocument(pdf);
        baseOriginalPagesRef.current = nextPreviewPages;

        const restoredPages = revisionPreviewRef.current
          ? hydrateRevisionPreview(revisionPreviewRef.current, nextPreviewPages)
          : nextPreviewPages;
        const firstPage = findVisiblePreviewPage(restoredPages);

        setPreviewPages(restoredPages);
        setSelectedPreviewPageId(firstPage?.pageId ?? null);
        setSelectedSource(firstPage?.sourceType === "REVISION" ? "revision" : "original");
        setSelectedPage(firstPage?.sourcePage ?? nextPages[0]);
        setIsSelectedPageAdded(firstPage?.sourceType === "REVISION");
      } catch {
        if (!cancelled) {
          setOriginalPdfDocument(null);
          setOriginalPdfError("기존 강의자료 PDF를 불러오지 못했습니다.");
        }
      }
    };

    loadOriginalPdf();

    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [documentId]);

  useEffect(() => {
    if (!documentId) return;

    let cancelled = false;

    const initializeRevision = async () => {
      try {
        if (!revisionCreationPromiseRef.current) {
          revisionCreationPromiseRef.current = (async () => {
            const storageKey = getRevisionStorageKey(documentId);
            const storedRevisionId = localStorage.getItem(storageKey);

            if (storedRevisionId) {
              try {
                const storedRevision = await getDocumentRevision(
                  documentId,
                  storedRevisionId,
                );

                if (storedRevision?.status === "CANCELED") {
                  localStorage.removeItem(storageKey);

                  if (!cancelled) {
                    setNotice("수정 세션이 만료되어 새 세션을 시작합니다.");
                  }

                  return createDocumentRevision(documentId);
                }

                return storedRevision;
              } catch (error) {
                if (![403, 404].includes(error?.response?.status)) throw error;
                localStorage.removeItem(storageKey);
              }
            }

            return createDocumentRevision(documentId);
          })();
        }
        const activeRevision = await revisionCreationPromiseRef.current;
        const revisionId = activeRevision?.revision_id ?? activeRevision?.revisionId;
        const isNewRevision = activeRevision?.__httpStatus === 201;

        if (!revisionId) {
          throw new Error("수정 세션 ID가 없습니다.");
        }

        if (!cancelled) {
          const normalizedRevision = {
            ...activeRevision,
            revision_id: revisionId,
          };

          if (normalizedRevision.status === "PROCESSING") {
            updateRevisionSession(normalizedRevision);
            localStorage.removeItem(getRevisionStorageKey(documentId));
            setRevisionSlides([]);
            setNotice("강의자료 수정 내용을 저장하고 있습니다.");
            return;
          }

          if (isNewRevision) {
            setIsHelpOpen(true);
          }

          revisionPreviewRef.current = normalizedRevision;
          updateRevisionSession(normalizedRevision);
          setRevisionSlides(normalizeRevisionSlides(normalizedRevision));

          if (normalizedRevision.title) {
            setDocumentName(normalizedRevision.title);
            setDocumentNameDraft(normalizedRevision.title);
          }

          const restoredPages = hydrateRevisionPreview(
            normalizedRevision,
            baseOriginalPagesRef.current,
          );
          const firstPage = findVisiblePreviewPage(restoredPages);

          if (firstPage) {
            setPreviewPages(restoredPages);
            setSelectedPreviewPageId(firstPage.pageId);
            setSelectedSource(firstPage.sourceType === "REVISION" ? "revision" : "original");
            setSelectedPage(firstPage.sourcePage);
            setIsSelectedPageAdded(firstPage.sourceType === "REVISION");
          }
        }
      } catch (error) {
        if (!cancelled) {
          setNotice(getRevisionStartErrorMessage(error));
        }
      }
    };

    initializeRevision();

    return () => {
      cancelled = true;
    };
  }, [documentId, updateRevisionSession]);

  useEffect(() => {
    if (revisionFile || !revisionSourcePdfUrl) return undefined;

    let cancelled = false;
    const loadingTask = createPdfLoadingTask(revisionSourcePdfUrl);

    const loadRevisionPdf = async () => {
      try {
        setIsRenderingRevisionPdf(true);
        setRevisionPdfError("");
        const pdf = await loadingTask.promise;

        if (cancelled) {
          pdf.destroy();
          return;
        }

        setRevisionPdfDocument(pdf);
        setIsRenderingRevisionPdf(false);
      } catch {
        if (!cancelled) {
          setRevisionPdfDocument(null);
          setRevisionPdfError("새 강의자료 PDF를 불러오지 못했습니다.");
          setIsRenderingRevisionPdf(false);
        }
      }
    };

    loadRevisionPdf();

    return () => {
      cancelled = true;
      loadingTask.destroy();
    };
  }, [revisionFile, revisionSourcePdfUrl]);

  useEffect(() => {
    if (!revisionFile) {
      return undefined;
    }

    let cancelled = false;
    let loadingTask;

    const createRevisionSlides = async () => {
      try {
        setIsRenderingRevisionPdf(true);
        setRevisionPdfError("");
        setRevisionPdfDocument(null);
        const data = await revisionFile.arrayBuffer();
        loadingTask = getDocument({ data });
        const pdf = await loadingTask.promise;

        if (cancelled) {
          pdf.destroy();
          return;
        }

        setRevisionPdfDocument(pdf);
        setIsRenderingRevisionPdf(false);
        setRevisionSlides((currentSlides) => (
          Array.from({ length: pdf.numPages }, (_, index) => {
            const page = index + 1;
            return currentSlides.find((slide) => slide.page === page) ?? { page };
          })
        ));
      } catch {
        if (!cancelled) {
          setRevisionPdfDocument(null);
          setRevisionSlides([]);
          setRevisionPdfError("새 강의자료 PDF를 불러오지 못했습니다.");
          setIsRenderingRevisionPdf(false);
          setNotice("PDF 페이지를 불러오지 못했습니다.");
        }
      }
    };

    createRevisionSlides();

    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [revisionFile]);

  useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(() => {
      setNotice("");
    }, 5500);

    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => () => {
    window.clearTimeout(scrollEndTimerRef.current);
  }, []);

  const handlePanelScroll = (panel) => {
    setScrollingPanel(panel);
    window.clearTimeout(scrollEndTimerRef.current);
    scrollEndTimerRef.current = window.setTimeout(() => {
      setScrollingPanel(null);
    }, 650);
  };

  useEffect(() => {
    const pageLists = [
      originalPageListRef.current,
      revisionPageListRef.current,
    ].filter(Boolean);
    const handleWheel = (event) => {
      const list = event.currentTarget;

      if (list.scrollHeight <= list.clientHeight) return;

      const deltaScale = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? list.clientHeight
          : 1;

      event.preventDefault();
      list.scrollTop += event.deltaY * deltaScale;
    };

    pageLists.forEach((list) => {
      list.addEventListener("wheel", handleWheel, { passive: false });
    });

    return () => {
      pageLists.forEach((list) => {
        list.removeEventListener("wheel", handleWheel);
      });
    };
  }, [revisionSlides.length]);

  const toggleCheckedPage = (setCheckedPages, page) => {
    setCheckedPages((currentPages) => (
      currentPages.includes(page)
        ? currentPages.filter((currentPage) => currentPage !== page)
        : [...currentPages, page]
    ));
  };

  const deleteCheckedPreviewPages = async () => {
    if (checkedPreviewPageIds.length === 0 || isRevisionInteractionLocked) return;

    const pagesToDelete = previewPages.filter((page) => (
      page.status !== "DELETE_PENDING"
      && checkedPreviewPageIds.includes(page.pageId)
    ));
    const session = revisionSessionRef.current;

    if (
      pagesToDelete.length !== checkedPreviewPageIds.length
      || pagesToDelete.some(({ pageId }) => !pageId)
      || !session?.revision_id
    ) {
      setNotice("수정 세션 준비가 완료된 후 다시 시도해 주세요.");
      return;
    }

    const deletedPageIds = new Set(pagesToDelete.map(({ pageId }) => pageId));
    const nextPreviewPages = previewPages.map((page) => (
      deletedPageIds.has(page.pageId)
        ? { ...page, status: "DELETE_PENDING" }
        : page
    ));
    const firstDeletedPage = pagesToDelete[0];
    const selectedPageAfterDelete = findVisiblePreviewPage(
      nextPreviewPages,
      firstDeletedPage.pageId,
    );

    setIsApplyingDelete(true);

    try {
      const operation = await createRevisionOperation(
        documentId,
        session.revision_id,
        {
          client_operation_id: createUuid(),
          base_preview_version: session.preview_version,
          type: "DELETE",
          page_ids: pagesToDelete.map(({ pageId }) => pageId),
        },
      );

      updateRevisionSession(operation);
      setPreviewPages(nextPreviewPages);
      setDeletedOriginalPages((currentPages) => (
        [...new Set([
          ...currentPages,
          ...pagesToDelete
            .filter(({ sourceType }) => sourceType === "ORIGINAL")
            .map(({ sourcePage }) => sourcePage),
        ])]
      ));
      if (selectedPageAfterDelete) {
        setSelectedSource(
          selectedPageAfterDelete.sourceType === "REVISION" ? "revision" : "original",
        );
        setSelectedPage(selectedPageAfterDelete.sourcePage);
        setSelectedPreviewPageId(selectedPageAfterDelete.pageId);
        setIsSelectedPageAdded(selectedPageAfterDelete.sourceType === "REVISION");
      } else {
        setSelectedPreviewPageId(null);
      }
      setCheckedPreviewPageIds([]);
      setNotice(`${pagesToDelete.length}개 페이지를 삭제 예정으로 변경했습니다.`);

      try {
        const serverPreview = await getDocumentRevision(
          documentId,
          session.revision_id,
        );
        const restoredPages = hydrateRevisionPreview(
          serverPreview,
          baseOriginalPagesRef.current,
          nextPreviewPages,
        );

        revisionPreviewRef.current = serverPreview;
        updateRevisionSession(serverPreview);
        setRevisionSlides(normalizeRevisionSlides(serverPreview));
        setPreviewPages(restoredPages);
        setDeletedOriginalPages(
          restoredPages
            .filter((page) => (
              page.sourceType === "ORIGINAL"
              && page.status === "DELETE_PENDING"
            ))
            .map(({ sourcePage }) => sourcePage),
        );

        const selectedServerPage = findVisiblePreviewPage(
          restoredPages,
          selectedPageAfterDelete?.pageId,
        );

        if (selectedServerPage) {
          setSelectedSource(
            selectedServerPage.sourceType === "REVISION" ? "revision" : "original",
          );
          setSelectedPage(selectedServerPage.sourcePage);
          setSelectedPreviewPageId(selectedServerPage.pageId);
          setIsSelectedPageAdded(selectedServerPage.sourceType === "REVISION");
        } else {
          setSelectedPreviewPageId(null);
        }
      } catch {
        setNotice(
          `${pagesToDelete.length}개 페이지를 삭제했지만 서버 미리보기를 새로 불러오지 못했습니다.`,
        );
      }
    } catch (error) {
      const shouldRestore = !error?.response || error.response.status === 409;

      if (shouldRestore) {
        try {
          const serverPreview = await getDocumentRevision(
            documentId,
            session.revision_id,
          );
          const restoredPages = hydrateRevisionPreview(
            serverPreview,
            baseOriginalPagesRef.current,
            previewPages,
          );
          const selectedPageAfterRestore = findVisiblePreviewPage(
            restoredPages,
            selectedPreviewPageId,
          );

          revisionPreviewRef.current = serverPreview;
          updateRevisionSession(serverPreview);
          setRevisionSlides(normalizeRevisionSlides(serverPreview));
          setPreviewPages(restoredPages);
          setDeletedOriginalPages(
            restoredPages
              .filter((page) => (
                page.sourceType === "ORIGINAL"
                && page.status === "DELETE_PENDING"
              ))
              .map(({ sourcePage }) => sourcePage),
          );
          setCheckedPreviewPageIds([]);

          if (selectedPageAfterRestore) {
            setSelectedPreviewPageId(selectedPageAfterRestore.pageId);
            setSelectedSource(
              selectedPageAfterRestore.sourceType === "REVISION"
                ? "revision"
                : "original",
            );
            setSelectedPage(selectedPageAfterRestore.sourcePage);
            setIsSelectedPageAdded(
              selectedPageAfterRestore.sourceType === "REVISION",
            );
          }

          setNotice("서버에 저장된 최신 수정 상태로 복원했습니다.");
        } catch (restoreError) {
          setNotice(getErrorMessage(
            restoreError,
            getErrorMessage(error, "페이지를 삭제하지 못했습니다."),
          ));
        }
      } else {
        setNotice(getErrorMessage(error, "페이지를 삭제하지 못했습니다."));
      }
    } finally {
      setIsApplyingDelete(false);
    }
  };

  const applyRevisionHistory = async (direction) => {
    if (isApplyingRevisionOperation) return;

    const session = revisionSessionRef.current;
    const isUndo = direction === "undo";
    const canApply = isUndo
      ? Boolean(session?.can_undo ?? session?.canUndo)
      : Boolean(session?.can_redo ?? session?.canRedo);

    if (!session?.revision_id || session.status !== "EDITING" || !canApply) {
      setNotice(isUndo
        ? "실행 취소할 변경 사항이 없습니다."
        : "다시 실행할 변경 사항이 없습니다.");
      return;
    }

    const restoreHistorySnapshot = (serverPreview) => {
      const restoredPages = hydrateRevisionPreview(
        serverPreview,
        baseOriginalPagesRef.current,
        previewPages,
      );
      const selectedPageAfterRestore = findVisiblePreviewPage(
        restoredPages,
        selectedPreviewPageId,
      );

      revisionPreviewRef.current = serverPreview;
      updateRevisionSession(serverPreview);
      setRevisionSlides(normalizeRevisionSlides(serverPreview));
      setPreviewPages(restoredPages);
      setDeletedOriginalPages(
        restoredPages
          .filter((page) => (
            page.sourceType === "ORIGINAL"
            && page.status === "DELETE_PENDING"
          ))
          .map(({ sourcePage }) => sourcePage),
      );
      setCheckedPreviewPageIds([]);

      if (selectedPageAfterRestore) {
        setSelectedPreviewPageId(selectedPageAfterRestore.pageId);
        setSelectedSource(
          selectedPageAfterRestore.sourceType === "REVISION"
            ? "revision"
            : "original",
        );
        setSelectedPage(selectedPageAfterRestore.sourcePage);
        setIsSelectedPageAdded(
          selectedPageAfterRestore.sourceType === "REVISION",
        );
      } else {
        setSelectedPreviewPageId(null);
      }
    };

    let historyApplied = false;
    setIsApplyingHistory(true);

    try {
      const historyResponse = isUndo
        ? await undoRevision(
          documentId,
          session.revision_id,
          session.preview_version,
        )
        : await redoRevision(
          documentId,
          session.revision_id,
          session.preview_version,
        );

      historyApplied = true;
      updateRevisionSession(historyResponse);

      const serverPreview = await getDocumentRevision(
        documentId,
        session.revision_id,
      );

      restoreHistorySnapshot(serverPreview);
      setNotice(isUndo
        ? "마지막 변경을 실행 취소했습니다."
        : "취소한 변경을 다시 실행했습니다.");
    } catch (error) {
      if (historyApplied) {
        setNotice(isUndo
          ? "실행 취소는 완료했지만 화면을 새로 불러오지 못했습니다."
          : "다시 실행은 완료했지만 화면을 새로 불러오지 못했습니다.");
      } else if (!error?.response || error.response.status === 409) {
        try {
          const serverPreview = await getDocumentRevision(
            documentId,
            session.revision_id,
          );

          restoreHistorySnapshot(serverPreview);
          setNotice("서버에 저장된 최신 수정 상태로 복원했습니다.");
        } catch (restoreError) {
          setNotice(getErrorMessage(
            restoreError,
            getErrorMessage(error, isUndo
              ? "변경을 실행 취소하지 못했습니다."
              : "변경을 다시 실행하지 못했습니다."),
          ));
        }
      } else {
        setNotice(getErrorMessage(error, isUndo
          ? "변경을 실행 취소하지 못했습니다."
          : "변경을 다시 실행하지 못했습니다."));
      }
    } finally {
      setIsApplyingHistory(false);
    }
  };

  const completeDocumentRevision = async () => {
    if (isApplyingRevisionOperation) return;

    const session = revisionSessionRef.current;

    if (!session?.revision_id || session.status !== "EDITING") {
      setSaveModalError(session?.status === "PROCESSING"
        ? "강의자료 수정 내용을 저장하고 있습니다."
        : "저장할 수 있는 수정 세션이 없습니다.");
      return;
    }

    setSaveModalError("");
    setIsCompletingRevision(true);

    try {
      const completionResponse = await completeRevision(
        documentId,
        session.revision_id,
        session.preview_version,
      );

      updateRevisionSession(completionResponse);
      localStorage.removeItem(getRevisionStorageKey(documentId));
      setCheckedPreviewPageIds([]);
      setCheckedRevisionPages([]);
      setDraggedRevisionPage(null);
      setActiveInsertPosition(null);
      setDragPreview(null);
      setSaveModalStep("complete");
    } catch (error) {
      if (!error?.response || error.response.status === 409) {
        try {
          const serverPreview = await getDocumentRevision(
            documentId,
            session.revision_id,
          );

          if (serverPreview?.status === "PROCESSING") {
            updateRevisionSession(serverPreview);
            localStorage.removeItem(getRevisionStorageKey(documentId));
            setSaveModalStep("complete");
          } else if (serverPreview?.status === "CANCELED") {
            updateRevisionSession(serverPreview);
            localStorage.removeItem(getRevisionStorageKey(documentId));
            setSaveModalError("수정 세션이 만료되어 저장하지 못했습니다.");
          } else {
            const restoredPages = hydrateRevisionPreview(
              serverPreview,
              baseOriginalPagesRef.current,
              previewPages,
            );
            const selectedPageAfterRestore = findVisiblePreviewPage(
              restoredPages,
              selectedPreviewPageId,
            );

            revisionPreviewRef.current = serverPreview;
            updateRevisionSession(serverPreview);
            setRevisionSlides(normalizeRevisionSlides(serverPreview));
            setPreviewPages(restoredPages);
            setDeletedOriginalPages(
              restoredPages
                .filter((page) => (
                  page.sourceType === "ORIGINAL"
                  && page.status === "DELETE_PENDING"
                ))
                .map(({ sourcePage }) => sourcePage),
            );
            setCheckedPreviewPageIds([]);

            if (selectedPageAfterRestore) {
              setSelectedPreviewPageId(selectedPageAfterRestore.pageId);
              setSelectedSource(
                selectedPageAfterRestore.sourceType === "REVISION"
                  ? "revision"
                  : "original",
              );
              setSelectedPage(selectedPageAfterRestore.sourcePage);
              setIsSelectedPageAdded(
                selectedPageAfterRestore.sourceType === "REVISION",
              );
            }

            setSaveModalError("편집 상태가 변경되어 최신 상태로 복원했습니다. 다시 저장해 주세요.");
          }
        } catch (restoreError) {
          setSaveModalError(getErrorMessage(
            restoreError,
            getErrorMessage(error, "강의자료 저장 요청에 실패했습니다."),
          ));
        }
      } else {
        setSaveModalError(getErrorMessage(error, "강의자료 저장 요청에 실패했습니다."));
      }
    } finally {
      setIsCompletingRevision(false);
    }
  };

  const startEditingDocumentName = () => {
    if (isRevisionInteractionLocked) return;

    setDocumentNameDraft(documentName);
    setIsEditingDocumentName(true);
  };

  const finishEditingDocumentName = () => {
    const nextDocumentName = documentNameDraft.trim();

    if (!nextDocumentName) {
      setDocumentNameDraft(documentName);
      setNotice("강의자료 이름은 비워둘 수 없습니다.");
    } else {
      setDocumentName(nextDocumentName);
      setDocumentNameDraft(nextDocumentName);
    }

    setIsEditingDocumentName(false);
  };

  const cancelEditingDocumentName = () => {
    setDocumentNameDraft(documentName);
    setIsEditingDocumentName(false);
  };

  const selectRevisionFile = async (file) => {
    if (!file) return;

    if (
      revisionSessionRef.current?.status
      && revisionSessionRef.current.status !== "EDITING"
    ) {
      setNotice("현재 수정 세션에서는 새 강의자료를 업로드할 수 없습니다.");
      return;
    }

    setIsRenderingRevisionPdf(true);
    setRevisionFile(file);
    setRevisionSlides([]);
    setCheckedRevisionPages([]);
    setSelectedSource("original");
    setSelectedPage(1);
    setSelectedPreviewPageId(null);
    setIsSelectedPageAdded(false);

    let session = revisionSessionRef.current;

    if (!session?.revision_id && revisionCreationPromiseRef.current) {
      try {
        session = updateRevisionSession(await revisionCreationPromiseRef.current);
      } catch {
        session = null;
      }
    }

    if (!session?.revision_id) {
      setNotice(
        "수정 세션을 시작할 수 없어 PDF를 업로드하지 못했습니다.",
      );
      return;
    }

    setIsUploadingRevision(true);

    try {
      const uploadResponse = await uploadRevisionSourcePdf(
        documentId,
        session.revision_id,
        file,
      );
      const uploadedSlides = normalizeRevisionSlides(uploadResponse);

      updateRevisionSession(uploadResponse);
      setRevisionSlides(uploadedSlides);
      setNotice("새 강의자료를 불러왔습니다. 원하는 페이지 사이에 끌어 놓아 주세요.");
    } catch (error) {
      setRevisionSlides([]);
      setNotice(getErrorMessage(error, "새 강의자료를 업로드하지 못했습니다."));
    } finally {
      setIsUploadingRevision(false);
    }
  };

  const insertRevisionPages = async (position, sourcePage = draggedRevisionPage) => {
    if (!sourcePage || isRevisionInteractionLocked) return;

    const pagesToInsert = (
      checkedRevisionPages.includes(sourcePage)
        ? [...checkedRevisionPages].sort((first, second) => first - second)
        : [sourcePage]
    );
    const slidesToInsert = pagesToInsert
      .map((page) => revisionSlides.find((slide) => slide.page === page))
      .filter((slide) => slide?.revisionSlideId);
    const session = revisionSessionRef.current;

    if (slidesToInsert.length !== pagesToInsert.length || !session?.revision_id) {
      setNotice("새 강의자료 업로드가 완료된 후 다시 시도해 주세요.");
      return;
    }

    const insertedPages = slidesToInsert.map((slide) => ({
      pageId: `pending-${slide.revisionSlideId}-${createUuid()}`,
      sourcePage: slide.page,
      sourceType: "REVISION",
      status: "ACTIVE",
      added: true,
      thumbnailUrl: slide.thumbnailUrl,
    }));
    const visibleInsertPosition = previewPages
      .slice(0, position - 1)
      .filter(isVisiblePreviewPage).length + 1;
    const nextPreviewPages = [
      ...previewPages.slice(0, position - 1),
      ...insertedPages,
      ...previewPages.slice(position - 1),
    ];

    setIsApplyingInsert(true);

    try {
      const operation = await createRevisionOperation(
        documentId,
        session.revision_id,
        {
          client_operation_id: createUuid(),
          base_preview_version: session.preview_version,
          type: "INSERT",
          revision_slide_ids: slidesToInsert.map((slide) => slide.revisionSlideId),
          position,
        },
      );
      updateRevisionSession(operation);
      setPreviewPages(nextPreviewPages);
      setSelectedSource("revision");
      setSelectedPage(insertedPages[0].sourcePage);
      setSelectedPreviewPageId(insertedPages[0].pageId);
      setIsSelectedPageAdded(true);
      setCheckedRevisionPages([]);
      setNotice(
        `${insertedPages.length}개 페이지를 ${visibleInsertPosition}번째 위치에 삽입했습니다.`,
      );

      try {
        const serverPreview = await getDocumentRevision(documentId, session.revision_id);
        revisionPreviewRef.current = serverPreview;
        setRevisionSlides(normalizeRevisionSlides(serverPreview));
        const serverPages = [...(serverPreview?.preview_pages ?? [])]
          .sort((first, second) => first.position - second.position);

        if (serverPages.length === nextPreviewPages.length) {
          const mergedPages = serverPages.map((serverPage, index) => ({
            ...nextPreviewPages[index],
            pageId: serverPage.page_id,
            sourceType: serverPage.source_type,
            status: serverPage.status,
            thumbnailUrl: serverPage.thumbnail_url ?? nextPreviewPages[index].thumbnailUrl,
          }));
          const insertedPageIndex = nextPreviewPages.findIndex(
            (page) => page.pageId === insertedPages[0].pageId,
          );

          setPreviewPages(mergedPages);
          setSelectedPreviewPageId(
            mergedPages[insertedPageIndex]?.pageId ?? insertedPages[0].pageId,
          );
        }

        updateRevisionSession(serverPreview);
      } catch {
        setNotice(
          `${insertedPages.length}개 페이지를 삽입했지만 서버 미리보기를 새로 불러오지 못했습니다.`,
        );
      }
    } catch (error) {
      const shouldRestore = !error?.response || error.response.status === 409;

      if (shouldRestore) {
        try {
          const serverPreview = await getDocumentRevision(
            documentId,
            session.revision_id,
          );
          const restoredPages = hydrateRevisionPreview(
            serverPreview,
            baseOriginalPagesRef.current,
            previewPages,
          );
          const selectedPageAfterRestore = findVisiblePreviewPage(
            restoredPages,
            selectedPreviewPageId,
          );

          revisionPreviewRef.current = serverPreview;
          updateRevisionSession(serverPreview);
          setRevisionSlides(normalizeRevisionSlides(serverPreview));
          setPreviewPages(restoredPages);

          if (selectedPageAfterRestore) {
            setSelectedPreviewPageId(selectedPageAfterRestore.pageId);
            setSelectedSource(
              selectedPageAfterRestore.sourceType === "REVISION"
                ? "revision"
                : "original",
            );
            setSelectedPage(selectedPageAfterRestore.sourcePage);
            setIsSelectedPageAdded(
              selectedPageAfterRestore.sourceType === "REVISION",
            );
          }

          setNotice("서버에 저장된 최신 수정 상태로 복원했습니다.");
        } catch (restoreError) {
          setNotice(getErrorMessage(
            restoreError,
            getErrorMessage(error, "페이지를 삽입하지 못했습니다."),
          ));
        }
      } else {
        setNotice(getErrorMessage(error, "페이지를 삽입하지 못했습니다."));
      }
    } finally {
      setIsApplyingInsert(false);
      setDraggedRevisionPage(null);
      setActiveInsertPosition(null);
    }
  };

  const getServerInsertPositionAtVisibleBoundary = (boundaryIndex) => {
    const nextVisiblePage = visiblePreviewPages[boundaryIndex];

    if (!nextVisiblePage) return previewPages.length + 1;

    const serverPageIndex = previewPages.findIndex(
      ({ pageId }) => pageId === nextVisiblePage.pageId,
    );

    return serverPageIndex === -1
      ? previewPages.length + 1
      : serverPageIndex + 1;
  };

  const getInsertPositionFromPointer = (target, clientY) => {
    const pageEntries = [
      ...target.querySelectorAll(".document-modify-page-entry"),
    ];
    const nextEntryIndex = pageEntries.findIndex((entry) => {
      const bounds = entry.querySelector(".document-modify-slide-block")
        ?.getBoundingClientRect();

      return bounds && clientY < bounds.top + bounds.height / 2;
    });

    const visibleBoundaryIndex = nextEntryIndex === -1
      ? pageEntries.length
      : nextEntryIndex;

    return getServerInsertPositionAtVisibleBoundary(visibleBoundaryIndex);
  };

  const clearPointerDrag = () => {
    pointerDragRef.current = null;
    setDragPreview(null);
    setDraggedRevisionPage(null);
    setActiveInsertPosition(null);
  };

  const startPointerDrag = (page, event) => {
    if (isRevisionInteractionLocked
      || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    const nextDrag = {
      page,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
      pointerType: event.pointerType,
      started: false,
    };

    pointerDragRef.current = nextDrag;
  };

  const movePointerDrag = (event) => {
    const currentDrag = pointerDragRef.current;

    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;

    if (!currentDrag.started) {
      const deltaX = event.clientX - currentDrag.x;
      const deltaY = event.clientY - currentDrag.y;

      if (Math.hypot(deltaX, deltaY) < 6) return;

      if (currentDrag.pointerType === "touch" && Math.abs(deltaY) > Math.abs(deltaX)) {
        pointerDragRef.current = null;
        return;
      }

      currentDrag.started = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDraggedRevisionPage(currentDrag.page);
    }

    event.preventDefault();
    const nextDrag = {
      ...currentDrag,
      x: event.clientX,
      y: event.clientY,
    };
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest(".document-modify-page-list--insert-target");

    pointerDragRef.current = nextDrag;
    setDragPreview(nextDrag);
    setActiveInsertPosition(
      target ? getInsertPositionFromPointer(target, event.clientY) : null,
    );
  };

  const finishPointerDrag = (event) => {
    const currentDrag = pointerDragRef.current;

    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;

    if (!currentDrag.started) {
      pointerDragRef.current = null;
      return;
    }

    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest(".document-modify-page-list--insert-target");
    const position = target
      ? getInsertPositionFromPointer(target, event.clientY)
      : null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    clearPointerDrag();

    if (position) insertRevisionPages(position, currentDrag.page);
  };

  const updateInsertPositionFromPointer = (event) => {
    if (!draggedRevisionPage || isRevisionInteractionLocked) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    setActiveInsertPosition(
      getInsertPositionFromPointer(event.currentTarget, event.clientY),
    );
  };

  const dropRevisionPages = (event) => {
    if (!draggedRevisionPage || isRevisionInteractionLocked) return;

    event.preventDefault();
    insertRevisionPages(
      getInsertPositionFromPointer(event.currentTarget, event.clientY),
    );
  };

  return (
    <main className="document-modify-page">
      <div className="document-modify-page__orb document-modify-page__orb--left" />
      <div className="document-modify-page__orb document-modify-page__orb--right" />

      <button
        type="button"
        className={`document-modify-back${isHelpOpen ? " is-help-open" : ""}`}
        aria-label={isHelpOpen ? "강의자료 수정 화면으로 돌아가기" : "강의자료 목록으로 돌아가기"}
        onClick={() => {
          if (isHelpOpen) {
            setIsHelpOpen(false);
            return;
          }

          navigate(`/spaces/${spaceId}`);
        }}
      >
        <img src={goBackIcon} alt="" />
      </button>

      <header className="document-modify-header">
        <h1>{spaceName}</h1>
        <p>강의자료 수정</p>
      </header>

      <div className="document-modify-actions" aria-label="강의자료 수정 도구">
        <button
          type="button"
          aria-label="실행 취소"
          disabled={!isRevisionEditable || !canUndo || isApplyingRevisionOperation}
          onClick={() => applyRevisionHistory("undo")}
        >
          <img src={undoIcon} alt="" />
        </button>
        <button
          type="button"
          aria-label="다시 실행"
          disabled={!isRevisionEditable || !canRedo || isApplyingRevisionOperation}
          onClick={() => applyRevisionHistory("redo")}
        >
          <img src={redoIcon} alt="" />
        </button>
        <button
          type="button"
          aria-label="저장"
          disabled={!isRevisionEditable || isApplyingRevisionOperation}
          onClick={() => {
            setSaveModalError("");
            setSaveModalStep("confirm");
          }}
        >
          <img src={saveIcon} alt="" />
        </button>
        <button
          type="button"
          aria-label="도움말"
          aria-haspopup="dialog"
          aria-expanded={isHelpOpen}
          onClick={() => setIsHelpOpen(true)}
        >
          <img src={helpIcon} alt="" />
        </button>
      </div>

      <section className="document-modify-layout" aria-label={`${documentName} 수정`}>
        <section className="document-modify-preview-panel">
          <header>
            <div className="document-modify-preview-title">
              {isEditingDocumentName ? (
                <input
                  type="text"
                  className="document-modify-preview-title-input"
                  value={documentNameDraft}
                  aria-label="강의자료 이름"
                  autoFocus
                  onFocus={(event) => event.currentTarget.select()}
                  onChange={(event) => setDocumentNameDraft(event.target.value)}
                  onBlur={finishEditingDocumentName}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      finishEditingDocumentName();
                    }

                    if (event.key === "Escape") {
                      cancelEditingDocumentName();
                    }
                  }}
                />
              ) : (
                <>
                  <h2>{documentName}</h2>
                  <button
                    type="button"
                    className="document-modify-preview-title-edit"
                    aria-label="강의자료 이름 변경"
                    disabled={isRevisionInteractionLocked}
                    onClick={startEditingDocumentName}
                  >
                    <img src={documentTitlePenIcon} alt="" />
                  </button>
                </>
              )}
            </div>
            {isSelectedPageDeleted && (
              <img
                className="document-modify-preview-deleted-watermark"
                src={deletedWatermarkIcon}
                alt="삭제 예정"
              />
            )}
            {isSelectedPageAdded && !isSelectedPageDeleted && (
              <img
                className="document-modify-preview-added"
                src={pageAddedIcon}
                alt="새로 추가된 페이지"
              />
            )}
            <p>페이지 미리보기</p>
            <div className="document-modify-zoom-controls" aria-label="PDF 확대 및 축소">
              <button
                type="button"
                aria-label="PDF 축소"
                disabled={previewZoom <= MIN_PREVIEW_ZOOM}
                onClick={() => setPreviewZoom((zoom) => (
                  Math.max(MIN_PREVIEW_ZOOM, zoom - PREVIEW_ZOOM_STEP)
                ))}
              >
                −
              </button>
              <span aria-live="polite">{Math.round(previewZoom * 100)}%</span>
              <button
                type="button"
                aria-label="PDF 확대"
                disabled={previewZoom >= MAX_PREVIEW_ZOOM}
                onClick={() => setPreviewZoom((zoom) => (
                  Math.min(MAX_PREVIEW_ZOOM, zoom + PREVIEW_ZOOM_STEP)
                ))}
              >
                +
              </button>
            </div>
          </header>
          <div className="document-modify-preview-divider" />
          <div className="document-modify-preview-image">
            {selectedPreviewPage?.thumbnailUrl && !selectedPdfDocument ? (
              <img
                className="document-modify-preview-thumbnail-image"
                src={selectedPreviewPage.thumbnailUrl}
                alt={`${selectedPage}페이지 미리보기`}
              />
            ) : (
              <PdfPageCanvas
                className="document-modify-pdf-page--preview"
                emptyMessage={selectedPdfError || "PDF 페이지를 불러오는 중입니다."}
                pageNumber={selectedRevisionSlide?.page ?? selectedPage}
                pdfDocument={selectedPdfDocument}
                zoom={previewZoom}
              />
            )}
          </div>
          <p className={[
            "document-modify-preview-guide",
            isSelectedPageDeleted ? "is-deleted" : "",
            isSelectedPageAdded ? "is-added" : "",
          ].filter(Boolean).join(" ")}>
            {isSelectedPageDeleted
              ? "※ 이 페이지는 삭제될 예정입니다"
              : isSelectedPageAdded
                ? "※ 이 페이지는 새로 추가된 페이지입니다"
                : "※ 새 강의자료 페이지를 기존 강의자료의 페이지 사이로 끌어 놓아 삽입하세요"}
          </p>
        </section>

        <aside className="document-modify-pages-panel">
          <header>
            <strong>기존 강의자료</strong>
            {checkedPreviewPageIds.length > 0 ? (
              <span className="document-modify-selected-count">
                {checkedPreviewPageIds.length}개 선택됨
              </span>
            ) : (
              <span>{documentName}</span>
            )}
            {checkedPreviewPageIds.length > 0 && (
              <button
                type="button"
                className="document-modify-selected-delete"
                aria-label={`선택한 ${checkedPreviewPageIds.length}개 페이지 삭제`}
                disabled={isRevisionInteractionLocked}
                onClick={deleteCheckedPreviewPages}
              >
                <img src={selectedPageDeleteIcon} alt="" />
              </button>
            )}
          </header>
          <div className="document-modify-panel-divider" />
          <div
            ref={originalPageListRef}
            className={`document-modify-page-list document-modify-page-list--insert-target${draggedRevisionPage ? " is-receiving" : ""}${scrollingPanel === "original" ? " is-scrolling" : ""}`}
            onScroll={() => handlePanelScroll("original")}
            onDragOver={updateInsertPositionFromPointer}
            onDrop={dropRevisionPages}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setActiveInsertPosition(null);
              }
            }}
          >
            <InsertDropZone
              active={activeInsertPosition
                === getServerInsertPositionAtVisibleBoundary(0)}
            />
            {visiblePreviewPages.map((previewPage, index) => {
              const displayPage = index + 1;
              const isRevisionPage = previewPage.sourceType === "REVISION";
              const sourcePage = previewPage.sourcePage ?? displayPage;
              const isDeleted = previewPage.status === "DELETE_PENDING"
                || (!isRevisionPage && deletedOriginalPages.includes(sourcePage));

              return (
                <div className="document-modify-page-entry" key={previewPage.pageId}>
                  <SlideBlock
                    page={displayPage}
                    pdfPage={sourcePage}
                    pdfDocument={isRevisionPage ? revisionPdfDocument : originalPdfDocument}
                    imageUrl={previewPage.thumbnailUrl}
                    emptyMessage={(isRevisionPage ? revisionPdfError : originalPdfError)
                      || "PDF 페이지를 불러오는 중입니다."}
                    selected={selectedPreviewPageId === previewPage.pageId}
                    checked={checkedPreviewPageIds.includes(previewPage.pageId)}
                    disabled={isRevisionInteractionLocked}
                    deleted={isDeleted}
                    added={isRevisionPage}
                    onSelect={() => {
                      setSelectedSource(isRevisionPage ? "revision" : "original");
                      setSelectedPage(sourcePage);
                      setSelectedPreviewPageId(previewPage.pageId);
                      setIsSelectedPageAdded(isRevisionPage);
                    }}
                    onCheck={() => toggleCheckedPage(
                      setCheckedPreviewPageIds,
                      previewPage.pageId,
                    )}
                  />
                  <InsertDropZone
                    active={activeInsertPosition
                      === getServerInsertPositionAtVisibleBoundary(index + 1)}
                  />
                </div>
              );
            })}
          </div>
        </aside>

        <aside className="document-modify-upload-panel">
          <header>
            <strong>새 강의자료</strong>
            <span>{revisionFile?.name ?? revisionSourceFileName ?? "수정본을 선택해 주세요"}</span>
          </header>
          <div className="document-modify-panel-divider" />
          {isRevisionPanelLoading && (
            <p className="document-modify-upload-status" role="status">
              강의자료가 렌더링 중입니다.
            </p>
          )}
          {!isRevisionPanelLoading && !hasReadyRevisionSlides && (
            <button
              type="button"
              className="document-modify-upload-dropzone"
              disabled={isRevisionInteractionLocked}
              onClick={() => revisionFileInputRef.current?.click()}
            >
              <img src={noteIcon} alt="" />
              <strong>{isUploadingRevision ? "업로드 중..." : revisionFile ? revisionFile.name : "수정본 업로드"}</strong>
              <small>{revisionSession?.revision_id ? "수정본 파일을 업로드하세요" : "수정 화면을 준비하고 있습니다"}</small>
            </button>
          )}
          <input
            ref={revisionFileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            disabled={isRevisionInteractionLocked}
            onChange={(event) => selectRevisionFile(event.target.files?.[0])}
          />
          {!isRevisionPanelLoading && hasReadyRevisionSlides && (
            <div
              ref={revisionPageListRef}
              className={`document-modify-page-list${scrollingPanel === "revision" ? " is-scrolling" : ""}`}
              onScroll={() => handlePanelScroll("revision")}
            >
              {revisionSlides.map(({ page, thumbnailUrl }) => (
                <SlideBlock
                  key={page}
                  page={page}
                  pdfDocument={revisionPdfDocument}
                  imageUrl={thumbnailUrl}
                  selected={selectedPreviewPageId === null
                    && selectedSource === "revision"
                    && selectedPage === page}
                  checked={checkedRevisionPages.includes(page)}
                  disabled={isRevisionInteractionLocked}
                  draggable={!isRevisionInteractionLocked}
                  dragging={draggedRevisionPage === page}
                  onSelect={() => {
                    setSelectedSource("revision");
                    setSelectedPage(page);
                    setSelectedPreviewPageId(null);
                    setIsSelectedPageAdded(false);
                  }}
                  onCheck={() => toggleCheckedPage(setCheckedRevisionPages, page)}
                  onPointerDown={(event) => startPointerDrag(page, event)}
                  onPointerMove={movePointerDrag}
                  onPointerUp={finishPointerDrag}
                  onPointerCancel={clearPointerDrag}
                />
              ))}
            </div>
          )}
        </aside>
      </section>

      {dragPreview && (
        <FloatingSlideBlock
          imageUrl={revisionSlides.find(({ page }) => (
            page === dragPreview.page
          ))?.thumbnailUrl}
          page={dragPreview.page}
          pdfDocument={revisionPdfDocument}
          position={dragPreview}
        />
      )}

      {isHelpOpen && (
        <DocumentModifyHelpOverlay onClose={() => setIsHelpOpen(false)} />
      )}
      {saveModalStep && (
        <DocumentRevisionSaveModal
          stage={saveModalStep}
          error={saveModalError}
          isSaving={isCompletingRevision}
          onCancel={() => {
            if (isCompletingRevision) return;
            setSaveModalStep(null);
            setSaveModalError("");
          }}
          onConfirm={saveModalStep === "complete"
            ? () => navigate(`/spaces/${spaceId}`)
            : completeDocumentRevision}
        />
      )}
      {notice && (
        <p
          key={notice}
          className="document-modify-toast"
          role="status"
        >
          {notice}
        </p>
      )}
    </main>
  );
}

export default DocumentModifyPage;
