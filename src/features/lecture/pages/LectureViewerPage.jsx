import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import LectureHeader from "../components/LectureHeader";
import LectureToolbar from "../components/LectureToolbar";
import DrawingToolOptions from "../components/DrawingToolOptions";
import PdfSlideStage from "../components/PdfSlideStage";
import SlidePagination from "../components/SlidePagination";
import QuestionPanel from "../components/QuestionPanel";
import { getSpaceMemberPermissions, getSpaceMembers } from "../../members/api/membersApi.js";
import DownloadModal from "../components/DownloadModal";
import DocumentChangesModal from "../components/DocumentChangesModal.jsx";
import { getSlideQuestionMarkers } from "../utils/questionNavigation.js";

import {
  getDocumentDownloadUrl,
} from "../api/lectureApi";

import useLectureDocument from "../hooks/useLectureDocument";
import useLectureFixers from "../hooks/useLectureFixers";
import useLectureQuestions from "../hooks/useLectureQuestions";
import useLectureSlideData from "../hooks/useLectureSlideData";
import useLectureStrokes from "../hooks/useLectureStrokes";

import {
  TOOL_THICKNESS_DEFAULTS,
  TOOL_THICKNESS_MM,
  thicknessMmToRatio,
} from "../utils/lectureData";
import {
  addSavedDrawingColor,
  getDrawingColorStorageKey,
  readDrawingColorPreferences,
  saveDrawingColorPreferences,
} from "../utils/drawingColorPreferences.js";

import {
  extractPdfUrl,
} from "../utils/lectureViewerUtils";

import "../styles/lecture.css";
import { useSpaceAccess } from "../../spaces/context/SpaceAccessContext.js";

const DRAWING_TOOLS =
  new Set([
    "PEN",
    "HIGHLIGHTER",
    "ERASER",
  ]);

function readStoredUser() {
  try { return JSON.parse(localStorage.getItem("tikitaka_user") || "null") || {}; } catch { return {}; }
}

function isCurrentSpaceMember(member, user) {
  const memberId = String(member?.member_id ?? member?.id ?? "");
  const userIds = [user?.member_id, user?.memberId, user?.space_member_id, user?.spaceMemberId, user?.user_id, user?.userId, user?.id].filter(Boolean).map(String);
  const memberNumber = String(member?.student_number ?? member?.studentNumber ?? "");
  const userNumber = String(user?.member_id_number ?? user?.memberIdNumber ?? user?.student_number ?? user?.studentNumber ?? "");
  return Boolean((memberId && userIds.includes(memberId)) || (memberNumber && userNumber && memberNumber === userNumber));
}

export default function LectureViewerPage({
  role,
  documentId: documentIdProp,
  pdfUrl: pdfUrlProp,
  slides: slidesProp,
  pageCount: pageCountProp,
  documentTitle: documentTitleProp,
  spaceName: spaceNameProp,
  slideId: slideIdProp,
}) {
  const navigate =
    useNavigate();
  const { readOnly } = useSpaceAccess();

  const [
    toast,
    setToast,
  ] = useState("");

  const [
    zoom,
    setZoom,
  ] = useState(1);

  const [
    pageTransitionDirection,
    setPageTransitionDirection,
  ] = useState(null);

  const [
    activeTool,
    setActiveTool,
  ] = useState(null);

  const [
    toolOptionsOpen,
    setToolOptionsOpen,
  ] = useState(false);

  const [
    panelOpen,
    setPanelOpen,
  ] = useState(false);

  const [
    questionDraftTitle,
    setQuestionDraftTitle,
  ] = useState("");

  const [
    downloadOpen,
    setDownloadOpen,
  ] = useState(false);

  const [
    downloading,
    setDownloading,
  ] = useState(false);

  const [
    downloadCompleted,
    setDownloadCompleted,
  ] = useState(false);

  const [
    thicknessByTool,
    setThicknessByTool,
  ] = useState({
    PEN:
      TOOL_THICKNESS_MM.PEN
        .default,

    HIGHLIGHTER:
      TOOL_THICKNESS_MM
        .HIGHLIGHTER.default,

    ERASER:
      TOOL_THICKNESS_MM.ERASER
        .default,
  });

  const [includeSharedNotes, setIncludeSharedNotes] = useState(false);
  const [includePrivateNotes, setIncludePrivateNotes] = useState(false);
  const [downloadPhase, setDownloadPhase] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const downloadLockRef = useRef(false);
  const retrySavesRef = useRef(false);

  const [colorPreferenceKey] = useState(getDrawingColorStorageKey);
  const [drawingColorPreferences, setDrawingColorPreferences] = useState(() =>
    readDrawingColorPreferences(colorPreferenceKey),
  );
  const colorByTool = drawingColorPreferences.colorsByTool;
  const savedDrawingColors = drawingColorPreferences.savedColors;

  function setColorByTool(update) {
    setDrawingColorPreferences((previous) => ({
      ...previous,
      colorsByTool: typeof update === "function"
        ? update(previous.colorsByTool)
        : update,
    }));
  }

  function saveCustomDrawingColor(color) {
    setDrawingColorPreferences((previous) => ({
      ...previous,
      savedColors: addSavedDrawingColor(previous.savedColors, color),
    }));
  }

  useEffect(() => {
    saveDrawingColorPreferences(colorPreferenceKey, drawingColorPreferences);
  }, [colorPreferenceKey, drawingColorPreferences]);

  useEffect(() => {
    function closeEraserOptions(event) {
      if (event.detail?.tool !== "ERASER") {
        return;
      }

      if (event.detail?.panel === null) {
        setToolOptionsOpen(false);
      } else if (event.detail?.panel === "ERASER") {
        setToolOptionsOpen(true);
      }
    }

    window.addEventListener("tikitaka:drawing-options", closeEraserOptions);
    return () => window.removeEventListener("tikitaka:drawing-options", closeEraserOptions);
  }, []);

  const [
    pdfPageMetrics,
    setPdfPageMetrics,
  ] = useState({
    width: 0,
    height: 0,
  });

  const {
    spaceId,
    changeReview,
    documentId,
    documentTitle,
    spaceName,
    pdfUrl,
    slides,
    currentIndex,
    setCurrentIndex,
    currentSlideId,
    currentPage,
    totalPages,
  } =
    useLectureDocument({
      documentId:
        documentIdProp,

      pdfUrl:
        pdfUrlProp,

      slides:
        slidesProp,

      pageCount:
        pageCountProp,

      documentTitle:
        documentTitleProp,

      spaceName:
        spaceNameProp,

      slideId:
        slideIdProp,

      setToast,
    });

  const viewerRole = String(role || "").toUpperCase();
  const [hasQuestionManagePermission, setHasQuestionManagePermission] = useState(viewerRole === "PROFESSOR");
  useEffect(() => {
    if (viewerRole !== "ASSISTANT") {
      setHasQuestionManagePermission(viewerRole === "PROFESSOR");
      return undefined;
    }
    setHasQuestionManagePermission(false);
    const controller = new AbortController();
    async function loadQuestionPermission() {
      try {
        const memberData = await getSpaceMembers(spaceId, { signal: controller.signal });
        if (controller.signal.aborted) return;
        const member = (memberData?.members ?? []).find((item) => isCurrentSpaceMember(item, readStoredUser()));
        const memberId = member?.member_id ?? member?.id;
        if (String(member?.role ?? "").toUpperCase() !== "ASSISTANT" || !memberId) return;
        const permissionData = await getSpaceMemberPermissions(spaceId, memberId, { signal: controller.signal });
        if (!controller.signal.aborted) {
          setHasQuestionManagePermission(Array.isArray(permissionData?.permissions) && permissionData.permissions.includes("QUESTION_MANAGE"));
        }
      } catch (error) {
        if (error?.code !== "ERR_CANCELED") setHasQuestionManagePermission(false);
      }
    }
    loadQuestionPermission();
    return () => controller.abort();
  }, [spaceId, viewerRole]);
  const questionRole = viewerRole === "PROFESSOR" || hasQuestionManagePermission ? "PROFESSOR" : role;
  const editableLayer = ["PROFESSOR", "ASSISTANT"].includes(viewerRole)
    ? "SHARED"
    : "PRIVATE";
  const canIncludePrivateNotes = editableLayer === "PRIVATE";

  const currentSlide =
    slides[currentIndex] ??
    null;

  const pendingChanges = changeReview.changes.filter((change) => !change.reviewed);
  const changeIndex = changeReview.changes.findIndex((change) => change.id === String(currentSlideId));
  const currentChange = changeReview.changes[changeIndex];
  const pageChangeNotice = currentChange && !currentChange.reviewed ? {
    kind: currentChange.kind,
    index: changeIndex + 1,
    total: changeReview.changes.length,
  } : null;

  function moveToChange(id) {
    const index = slides.findIndex((slide) => String(slide.id) === id);
    if (index >= 0) movePage(index);
  }

  function acknowledgePageChange() {
    const nextId = changeReview.acknowledge(currentSlideId);
    if (nextId) moveToChange(nextId);
  }

  const activeThicknessMm =
    thicknessByTool[
      activeTool
    ] ??
    TOOL_THICKNESS_MM.PEN
      .default;

  const activeThickness =
    thicknessMmToRatio(
      activeThicknessMm,

      currentSlide?.pageWidth ??
        pdfPageMetrics.width,

      currentSlide?.pageHeight ??
        pdfPageMetrics.height,
    ) ??
    TOOL_THICKNESS_DEFAULTS[
      activeTool
    ] ??
    TOOL_THICKNESS_DEFAULTS.PEN;

  const activeColor =
    colorByTool[
      activeTool
    ] ??
    "#212326";

  const {
    privateStrokes,
    setPrivateStrokes,

    sharedStrokes,
    setSharedStrokes,

    questions,
    setQuestions,

    fixers,
    setFixers,

    slideLoading,

    privateVersionsRef,
    sharedVersionsRef,

    privateQueueRef,
    sharedQueueRef,
  } =
    useLectureSlideData({
      currentSlideId,
      documentId,
      role,
      setToast,
    });

  const {
    createStrokeOnServer,
    waitForPendingSaves,
    deleteStrokesOnServer,

    handleLiveStroke,
    liveStrokes,

    handleUndo,
    handleRedo,

    resetStrokeHistory,

    canUndo,
    canRedo,
  } =
    useLectureStrokes({
      spaceId,
      documentId,
      currentSlideId,
      role,
      editableLayer,

      privateStrokes,
      setPrivateStrokes,

      sharedStrokes,
      setSharedStrokes,

      privateVersionsRef,
      sharedVersionsRef,

      privateQueueRef,
      sharedQueueRef,

      setToast,
    });

  const {
    selectedQuestion,
    questionPoint,
    createQuestionMode,
    isCreatingQuestion,

    questionScope,
    questionList,
    documentQuestionsLoading,

    handleQuestionPoint,
    handleQuestionScopeChange,
    handleCreateQuestion,
    handleSelectQuestion,
    handleSubmitAnswer,
    handleSubmitVoice,

    cancelQuestionPoint,
    resetQuestionState,
  } =
    useLectureQuestions({
      documentId,
      currentSlideId,
      slides,
      onQuestionSlideChange: (index) => {
        clearQuestionDraft();
        setFixerDraftPoint(null);
        resetStrokeHistory();
        setCurrentIndex(index);
      },
      role: questionRole,

      questions,
      setQuestions,

      setPanelOpen,
      setActiveTool,
      setToolOptionsOpen,

      setToast,
    });

  const {
    fixerDraftPoint,
    setFixerDraftPoint,

    handleFixerPoint,
    handleCreateFixer,
    handleFixerSelect,
  } =
    useLectureFixers({
      currentSlideId,
      role,

      setFixers,
      setToolOptionsOpen,
      setToast,
    });

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer =
      window.setTimeout(
        () => {
          setToast("");
        },
        2600,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    toast,
  ]);

  const [metricsSlideId, setMetricsSlideId] = useState(currentSlideId);
  if (metricsSlideId !== currentSlideId) {
    setMetricsSlideId(currentSlideId);
    setPdfPageMetrics({
      width: 0,
      height: 0,
    });
  }

  function clearQuestionDraft() {
    setQuestionDraftTitle("");
  }

  function handleToolChange(
    tool,
  ) {
    if (readOnly && tool !== "Q_LIST") return;
    setFixerDraftPoint(null);

    if (tool === "Q_LIST" && panelOpen && !createQuestionMode) {
      clearQuestionDraft();
      resetQuestionState();
      setPanelOpen(false);
      if (activeTool === "Q_LIST") setActiveTool(null);
      return;
    }

    if (
      activeTool === tool
    ) {
      if (tool === "ERASER" && !toolOptionsOpen) {
        setToolOptionsOpen(true);
        return;
      }

      clearQuestionDraft();

      resetQuestionState();

      setActiveTool(null);

      setToolOptionsOpen(
        false,
      );

      if (!DRAWING_TOOLS.has(tool)) setPanelOpen(false);

      return;
    }

    if (
      DRAWING_TOOLS.has(
        tool,
      )
    ) {
      clearQuestionDraft();

      setActiveTool(tool);

      setToolOptionsOpen(
        true,
      );

      cancelQuestionPoint();

      return;
    }

    setToolOptionsOpen(false);

    if (
      tool === "Q_LIST"
    ) {
      clearQuestionDraft();

      cancelQuestionPoint();

      setActiveTool(
        "Q_LIST",
      );

      setPanelOpen(true);

      return;
    }

    if (
      tool === "Q_POINT"
    ) {
      clearQuestionDraft();

      cancelQuestionPoint();

      setActiveTool(
        "Q_POINT",
      );

      setPanelOpen(false);

      return;
    }

    clearQuestionDraft();

    cancelQuestionPoint();

    setActiveTool(tool);

    setPanelOpen(false);
  }

  async function handleQuestionCreate(
    payload,
  ) {
    const created =
      await handleCreateQuestion(
        payload,
      );

    if (created) {
      clearQuestionDraft();
    }

    return created;
  }

  function openDownloadModal() {
    if (downloadLockRef.current) return;
    setIncludeSharedNotes(false);
    setIncludePrivateNotes(false);
    setDownloadError("");
    setDownloadPhase("");
    setDownloadCompleted(
      false,
    );

    setDownloading(false);

    setDownloadOpen(true);
  }

  function closeDownloadModal() {
    if (downloadLockRef.current) {
      return;
    }

    setDownloadOpen(false);

    setDownloadCompleted(
      false,
    );
  }

  async function handleDownload() {
    if (
      !documentId ||
      downloadLockRef.current
    ) {
      return;
    }

    setDownloadCompleted(
      false,
    );

    setDownloading(true);
    downloadLockRef.current = true;
    setDownloadError("");
    setDownloadPhase("SAVING");

    try {
      try {
        if (!readOnly) await waitForPendingSaves(retrySavesRef.current);
        retrySavesRef.current = false;
      } catch (error) {
        retrySavesRef.current = true;
        throw new Error("필기를 저장하지 못해 다운로드를 중단했습니다. 다시 시도해주세요.", { cause: error });
      }
      setDownloadPhase("GENERATING");
      const privateSelected = canIncludePrivateNotes && includePrivateNotes;
      const noteType = includeSharedNotes
        ? privateSelected ? "ALL" : "SHARED"
        : privateSelected ? "PRIVATE" : "NONE";
      const response =
        await getDocumentDownloadUrl(
          documentId,
          noteType,
        );

      const downloadUrl =
        extractPdfUrl(
          response?.download_url ??
            response?.downloadUrl ??
            response,
        );

      if (!downloadUrl) {
        throw new Error("다운로드 URL을 받지 못했습니다. 다시 시도해주세요.");
      }

      const fileResponse = await fetch(downloadUrl);
      if (!fileResponse.ok) {
        throw new Error("PDF 파일을 다운로드하지 못했습니다. 다시 시도해주세요.");
      }

      const pdfBlob = await fileResponse.blob();
      if (!pdfBlob.size || pdfBlob.type.includes("text/html")) {
        throw new Error("다운로드한 PDF 파일이 올바르지 않습니다. 다시 시도해주세요.");
      }

      const objectUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement("a");
      const title = documentTitle?.trim() || "강의자료";
      downloadLink.href = objectUrl;
      downloadLink.download = /\.pdf$/i.test(title) ? title : `${title}.pdf`;
      downloadLink.hidden = true;
      document.body.appendChild(downloadLink);
      try {
        downloadLink.click();
      } finally {
        downloadLink.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      }

      setDownloadCompleted(
        true,
      );
    } catch (error) {
      setDownloadError(error?.response?.data?.message || error?.message || "강의자료를 다운로드하지 못했습니다. 다시 시도해주세요.");
      setToast(
        error?.response
          ?.data
          ?.message ??
          "강의자료를 다운로드하지 못했습니다.",
      );

      setDownloadCompleted(
        false,
      );
    } finally {
      setDownloading(false);
      setDownloadPhase("");
      downloadLockRef.current = false;
    }
  }

  function closeQuestionPanel() {
    clearQuestionDraft();

    setPanelOpen(false);

    resetQuestionState();

    setActiveTool(null);

    setToolOptionsOpen(false);
  }

  function movePage(
    nextIndex,
    {
      preserveDrawingTool =
        false,
    } = {},
  ) {
    if (
      nextIndex < 0 ||
      nextIndex >=
        slides.length
    ) {
      return;
    }

    clearQuestionDraft();

    setPageTransitionDirection(
      nextIndex > currentIndex
        ? "next"
        : "previous",
    );

    setCurrentIndex(
      nextIndex,
    );

    // Keep the question list visible while browsing slides. A question being
    // composed still closes because its point belongs to the previous slide.
    if (createQuestionMode) {
      setPanelOpen(false);
    }

    resetQuestionState();

    setFixerDraftPoint(null);

    if (
      !preserveDrawingTool ||
      !DRAWING_TOOLS.has(
        activeTool,
      )
    ) {
      setActiveTool(null);

      setToolOptionsOpen(
        false,
      );
    }

    resetStrokeHistory();
  }

  const normalizedRole =
    String(
      role ||
        "STUDENT",
    ).toLowerCase();

  const pageShellClass =
    `lecture-page lecture-page--${normalizedRole}${
      panelOpen
        ? " is-panel-open"
        : ""
    }`;

  return (
    <main
      className={
        pageShellClass
      }
      onDragStart={(event) => event.preventDefault()}
    >
      <div
        className="lecture-background"
        aria-hidden="true"
      >
        <div className="lecture-page__orb lecture-page__orb--left" />

        <div className="lecture-page__orb lecture-page__orb--right" />
      </div>

      <div className="lecture-frame">
        <LectureHeader
          title={
            documentTitle
          }
          spaceName={
            spaceName
          }
          canUndo={
            !readOnly && canUndo
          }
          canRedo={
            !readOnly && canRedo
          }
          onBack={() =>
            navigate(-1)
          }
          onUndo={
            handleUndo
          }
          onRedo={
            handleRedo
          }
          onDownload={
            openDownloadModal
          }
        />

        <div className="lecture-workspace">
          <div className="lecture-workspace__main">
            <div className="lecture-toolbar-wrap">
              <LectureToolbar
                role={role}
                activeTool={
                  activeTool
                }
                activeColor={
                  activeColor
                }
                activeThickness={activeThicknessMm}
                toolOptionsOpen={toolOptionsOpen}
                onThicknessChange={(value) =>
                  setThicknessByTool((previous) => ({
                    ...previous,
                    [activeTool]: value,
                  }))
                }
                panelOpen={
                  panelOpen
                }
                onToolChange={
                  handleToolChange
                }
                onColorChange={(
                  value,
                  tool,
                ) =>
                  setColorByTool(
                    (
                      previous,
                    ) => ({
                      ...previous,

                      [tool]:
                        value,
                    }),
                  )
                }
              />

              {!readOnly && toolOptionsOpen && (
                <DrawingToolOptions
                  tool={
                    activeTool
                  }
                  customColors={savedDrawingColors}
                  onSaveCustomColor={saveCustomDrawingColor}
                  thickness={
                    activeThicknessMm
                  }
                  color={
                    activeColor
                  }
                  onThicknessChange={(
                    value,
                  ) =>
                    setThicknessByTool(
                      (
                        previous,
                      ) => ({
                        ...previous,

                        [activeTool]:
                          value,
                      }),
                    )
                  }
                  onColorChange={(
                    value,
                  ) =>
                    setColorByTool(
                      (
                        previous,
                      ) => ({
                        ...previous,

                        [activeTool]:
                          value,
                      }),
                    )
                  }
                />
              )}
            </div>

            <PdfSlideStage
              pageTransitionDirection={pageTransitionDirection}
              pageChangeNotice={pageChangeNotice}
              onAcknowledgePageChange={acknowledgePageChange}
              key={`${documentId}:${currentSlideId}`}
              role={role}
              pdfUrl={pdfUrl}
              pageNumber={
                currentPage
              }
              zoom={zoom}
              activeTool={
                activeTool
              }
              thickness={
                activeThickness
              }
              color={
                activeColor
              }
              privateStrokes={
                privateStrokes
              }
              sharedStrokes={
                sharedStrokes
              }
              liveStrokes={
                liveStrokes
              }
              onLiveStroke={
                handleLiveStroke
              }
              questions={
                getSlideQuestionMarkers(questions, selectedQuestion, currentSlideId)
              }
              selectedQuestionId={
                selectedQuestion
                  ?.id ??
                null
              }
              questionPoint={
                questionPoint
              }
              questionDraftTitle={
                questionDraftTitle
              }
              createQuestionMode={
                createQuestionMode
              }
              fixers={
                fixers
              }
              editableLayer={
                editableLayer
              }
              onZoomChange={
                setZoom
              }
              onPageMetrics={
                setPdfPageMetrics
              }
              onPreviousPage={() =>
                movePage(
                  currentIndex -
                    1,
                  {
                    preserveDrawingTool:
                      true,
                  },
                )
              }
              onNextPage={() =>
                movePage(
                  currentIndex +
                    1,
                  {
                    preserveDrawingTool:
                      true,
                  },
                )
              }
              onCreateStroke={
                createStrokeOnServer
              }
              onEraseStrokes={
                deleteStrokesOnServer
              }
              onQuestionPoint={
                handleQuestionPoint
              }
              onFixerPoint={
                handleFixerPoint
              }
              onQuestionSelect={
                handleSelectQuestion
              }
              onFixerSelect={
                handleFixerSelect
              }
              fixerDraftPoint={
                fixerDraftPoint
              }
              onFixerDraftCancel={() =>
                setFixerDraftPoint(
                  null,
                )
              }
              onFixerDraftSubmit={
                handleCreateFixer
              }
            />
          </div>

          <QuestionPanel
            onArchive={() => navigate(`/spaces/${spaceId}/questions`)}
            onSubmitVoice={handleSubmitVoice}
            role={questionRole}
            open={
              panelOpen
            }
            createMode={
              !readOnly && createQuestionMode
            }
            submitting={
              isCreatingQuestion
            }
            questions={
              questionList
            }
            questionScope={
              questionScope
            }
            scopeLoading={
              documentQuestionsLoading
            }
            selectedQuestion={
              selectedQuestion
            }
            loading={
              slideLoading
            }
            draftTitle={
              questionDraftTitle
            }
            onDraftTitleChange={
              setQuestionDraftTitle
            }
            onClose={
              closeQuestionPanel
            }
            onSelectQuestion={
              handleSelectQuestion
            }
            onQuestionScopeChange={
              handleQuestionScopeChange
            }
            onCreateQuestion={
              handleQuestionCreate
            }
            onSubmitAnswer={
              handleSubmitAnswer
            }
          />
        </div>
      </div>

      <SlidePagination
        currentPage={
          currentPage
        }
        totalPages={
          totalPages
        }
        onPrevious={() =>
          movePage(
            currentIndex -
              1,
          )
        }
        onNext={() =>
          movePage(
            currentIndex +
              1,
          )
        }
      />

      <DocumentChangesModal
        count={pendingChanges.length}
        open={changeReview.modalOpen}
        onClose={changeReview.closeModal}
        onMove={() => {
          changeReview.closeModal();
          if (pendingChanges[0]) moveToChange(pendingChanges[0].id);
        }}
      />

      <DownloadModal
        saving={downloadPhase === "SAVING"}
        error={downloadError}
        includeShared={includeSharedNotes}
        includePrivate={includePrivateNotes}
        canIncludePrivate={canIncludePrivateNotes}
        onSharedChange={setIncludeSharedNotes}
        onPrivateChange={setIncludePrivateNotes}
        open={
          downloadOpen
        }
        loading={
          downloading
        }
        completed={
          downloadCompleted
        }
        onCancel={
          closeDownloadModal
        }
        onConfirm={
          handleDownload
        }
        onComplete={
          closeDownloadModal
        }
      />

      {toast && (
        <div
          className="lecture-toast"
          role="status"
        >
          {toast}
        </div>
      )}
    </main>
  );
}
