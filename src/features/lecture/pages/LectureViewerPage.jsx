import {
  useEffect,
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
import DownloadModal from "../components/DownloadModal";

import {
  getDocumentDownloadUrl,
} from "../api/lectureApi";

import useLectureDocument from "../hooks/useLectureDocument";
import useLectureFixers from "../hooks/useLectureFixers";
import useLectureQuestions from "../hooks/useLectureQuestions";
import useLectureSlideData from "../hooks/useLectureSlideData";
import useLectureStrokes from "../hooks/useLectureStrokes";

import {
  TOOL_COLORS,
  TOOL_THICKNESS_DEFAULTS,
  TOOL_THICKNESS_MM,
  thicknessMmToRatio,
} from "../utils/lectureData";

import {
  extractPdfUrl,
} from "../utils/lectureViewerUtils";

import "../styles/lecture.css";

const DRAWING_TOOLS =
  new Set([
    "PEN",
    "HIGHLIGHTER",
    "ERASER",
  ]);

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

  const [
    toast,
    setToast,
  ] = useState("");

  const [
    zoom,
    setZoom,
  ] = useState(1);

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

  const [
    colorByTool,
    setColorByTool,
  ] = useState({
    ...TOOL_COLORS,
  });

  const [
    pdfPageMetrics,
    setPdfPageMetrics,
  ] = useState({
    width: 0,
    height: 0,
  });

  const {
    spaceId,
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

  const editableLayer =
    String(
      role || "",
    ).toUpperCase() ===
    "PROFESSOR"
      ? "SHARED"
      : "PRIVATE";

  const currentSlide =
    slides[currentIndex] ??
    null;

  const deletedSlides = slides.filter((slide) => slide.status === "PLACEHOLDER");
  const deletedPageNotice = currentSlide?.status === "PLACEHOLDER" ? {
    index: deletedSlides.findIndex((slide) => slide.id === currentSlide.id) + 1,
    total: deletedSlides.length,
  } : null;

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
      role,

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
    setDownloadCompleted(
      false,
    );

    setDownloading(false);

    setDownloadOpen(true);
  }

  function closeDownloadModal() {
    if (downloading) {
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
      downloading
    ) {
      return;
    }

    setDownloadCompleted(
      false,
    );

    setDownloading(true);

    try {
      const response =
        await getDocumentDownloadUrl(
          documentId,
        );

      const downloadUrl =
        extractPdfUrl(
          response?.download_url ??
            response?.downloadUrl ??
            response,
        );

      if (!downloadUrl) {
        throw new Error();
      }

      window.open(
        downloadUrl,
        "_blank",
        "noopener,noreferrer",
      );

      setDownloadCompleted(
        true,
      );
    } catch (error) {
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

    setCurrentIndex(
      nextIndex,
    );

    setPanelOpen(false);

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
            canUndo
          }
          canRedo={
            canRedo
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
                onViewAllQuestions={() => navigate(`/spaces/${spaceId}/questions`)}
                role={role}
                activeTool={
                  activeTool
                }
                activeColor={
                  activeColor
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

              {toolOptionsOpen && (
                <DrawingToolOptions
                  tool={
                    activeTool
                  }
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
              deletedPageNotice={deletedPageNotice}
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
                questions
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
            onSubmitVoice={handleSubmitVoice}
            role={role}
            open={
              panelOpen
            }
            createMode={
              createQuestionMode
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

      <DownloadModal
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
