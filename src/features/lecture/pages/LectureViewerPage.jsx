import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
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

import {
  checkFixer,
  createFixer,
  getFixers,
  getPrivateStrokes,
  getSharedStrokes,
  syncPrivateStrokes,
  syncSharedStrokes,
} from "../api/strokeApi";

import {
  createAnswer,
  createSlideQuestion,
  getDocumentQuestions,
  getQuestionDetail,
  getSimilarQuestions,
  updateAnswer,
} from "../api/questionApi";

import {
  createUuid,
  normalizeFixer,
  normalizeQuestion,
  normalizeStroke,
  TOOL_COLORS,
  TOOL_THICKNESS_DEFAULTS,
  toStrokeRequest,
} from "../utils/lectureData";

import "../styles/lecture.css";

const DRAWING_TOOLS =
  new Set([
    "PEN",
    "HIGHLIGHTER",
    "ERASER",
  ]);

function getStateValue(
  state,
  camelKey,
  snakeKey,
) {
  return (
    state?.[camelKey] ??
    state?.[snakeKey] ??
    ""
  );
}

function normalizeSlide(
  slide,
  index,
) {
  return {
    ...slide,

    id:
      slide.id ??
      slide.slideId ??
      slide.slide_id ??
      "",

    pageNumber:
      Number(
        slide.pageNumber ??
          slide.page_number ??
          index + 1,
      ) ||
      index + 1,
  };
}

function normalizeSlides(
  slides,
) {
  if (!Array.isArray(slides)) {
    return [];
  }

  return slides
    .map(normalizeSlide)
    .filter(
      (slide) =>
        Boolean(slide.id),
    )
    .sort(
      (first, second) =>
        first.pageNumber -
        second.pageNumber,
    );
}

export default function LectureViewerPage({
  role,
  spaceId: spaceIdProp,
  documentId: documentIdProp,
  pdfUrl: pdfUrlProp,
  slides: slidesProp,
  pageCount: pageCountProp,
  documentTitle:
    documentTitleProp,
  spaceName: spaceNameProp,
  slideId: slideIdProp,
}) {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const params =
    useParams();

  const navigationState =
    location.state ?? {};

  const spaceId =
    spaceIdProp ??
    params.spaceId ??
    params.space_id ??
    getStateValue(
      navigationState,
      "spaceId",
      "space_id",
    );

  const documentId =
    documentIdProp ??
    params.documentId ??
    params.document_id ??
    getStateValue(
      navigationState,
      "documentId",
      "document_id",
    );

  const pdfUrl =
    pdfUrlProp ??
    navigationState.pdfUrl ??
    navigationState.pdf_url ??
    navigationState.document
      ?.pdfUrl ??
    navigationState.document
      ?.pdf_url ??
    "";

  const documentTitle =
    documentTitleProp ??
    navigationState.documentTitle ??
    navigationState.document_title ??
    navigationState.document
      ?.title ??
    "";

  const spaceName =
    spaceNameProp ??
    navigationState.spaceName ??
    navigationState.space_name ??
    navigationState.space
      ?.spaceName ??
    navigationState.space
      ?.space_name ??
    "";

  const initialSlideId =
    slideIdProp ??
    params.slideId ??
    params.slide_id ??
    getStateValue(
      navigationState,
      "slideId",
      "slide_id",
    );

  const slides =
    useMemo(
      () =>
        normalizeSlides(
          slidesProp ??
            navigationState.slides ??
            navigationState.document
              ?.slides ??
            [],
        ),
      [
        slidesProp,
        navigationState.slides,
        navigationState.document
          ?.slides,
      ],
    );

  const pageCount =
    Number(
      pageCountProp ??
        navigationState.pageCount ??
        navigationState.page_count ??
        navigationState.document
          ?.pageCount ??
        navigationState.document
          ?.page_count ??
        slides.length,
    ) || slides.length;

  const initialSlideIndex =
    useMemo(() => {
      if (
        !initialSlideId ||
        !slides.length
      ) {
        return 0;
      }

      const index =
        slides.findIndex(
          (slide) =>
            String(slide.id) ===
            String(
              initialSlideId,
            ),
        );

      return index >= 0
        ? index
        : 0;
    }, [
      initialSlideId,
      slides,
    ]);

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(
    initialSlideIndex,
  );

  const [
    zoom,
    setZoom,
  ] = useState(1);

  const [
    activeTool,
    setActiveTool,
  ] = useState("PEN");

  const [
    toolOptionsOpen,
    setToolOptionsOpen,
  ] = useState(false);

  const [
    thicknessByTool,
    setThicknessByTool,
  ] = useState({
    ...TOOL_THICKNESS_DEFAULTS,
  });

  const [
    colorByTool,
    setColorByTool,
  ] = useState({
    ...TOOL_COLORS,
  });

  const [
    privateStrokes,
    setPrivateStrokes,
  ] = useState([]);

  const [
    sharedStrokes,
    setSharedStrokes,
  ] = useState([]);

  const [
    questions,
    setQuestions,
  ] = useState([]);

  const [
    fixers,
    setFixers,
  ] = useState([]);

  const [
    selectedQuestion,
    setSelectedQuestion,
  ] = useState(null);

  const [
    questionPoint,
    setQuestionPoint,
  ] = useState(null);

  const [
    fixerDraftPoint,
    setFixerDraftPoint,
  ] = useState(null);

  const [
    panelOpen,
    setPanelOpen,
  ] = useState(false);

  const [
    createQuestionMode,
    setCreateQuestionMode,
  ] = useState(false);

  const [
    slideLoading,
    setSlideLoading,
  ] = useState(true);

  const [
    downloadOpen,
    setDownloadOpen,
  ] = useState(false);

  const [
    downloading,
    setDownloading,
  ] = useState(false);

  const [
    toast,
    setToast,
  ] = useState("");

  const [
    undoStack,
    setUndoStack,
  ] = useState([]);

  const [
    redoStack,
    setRedoStack,
  ] = useState([]);

  const privateVersionsRef =
    useRef(new Map());

  const sharedVersionsRef =
    useRef(new Map());

  const privateQueueRef =
    useRef(
      Promise.resolve(),
    );

  const sharedQueueRef =
    useRef(
      Promise.resolve(),
    );

  const currentSlide =
    slides[currentIndex] ??
    null;

  const currentSlideId =
    currentSlide?.id ?? "";

  const currentPage =
    currentSlide
      ?.pageNumber ??
    currentIndex + 1;

  const totalPages =
    pageCount ||
    slides.length;

  const editableLayer =
    role === "PROFESSOR"
      ? "SHARED"
      : "PRIVATE";

  const activeThickness =
    thicknessByTool[
      activeTool
    ] ??
    TOOL_THICKNESS_DEFAULTS.PEN;

  const activeColor =
    colorByTool[
      activeTool
    ] ??
    "#212326";

  useEffect(() => {
    if (
      !currentSlideId ||
      !documentId
    ) {
      return undefined;
    }

    let cancelled = false;

    const task =
      Promise.resolve().then(
        async () => {
          if (cancelled) {
            return;
          }

          setSlideLoading(true);

          setPrivateStrokes([]);
          setSharedStrokes([]);
          setQuestions([]);
          setFixers([]);

          setSelectedQuestion(
            null,
          );

          setQuestionPoint(
            null,
          );

          setFixerDraftPoint(
            null,
          );

          try {
            const requests = [
              getPrivateStrokes(
                currentSlideId,
              ),

              getSharedStrokes(
                currentSlideId,
              ),

              getDocumentQuestions(
                documentId,
                {
                  scope:
                    "SLIDE",

                  slide_id:
                    currentSlideId,

                  size: 20,
                },
              ),
            ];

            if (
              role ===
              "PROFESSOR"
            ) {
              requests.push(
                getFixers(
                  currentSlideId,
                ),
              );
            }

            const [
              privateResponse,
              sharedResponse,
              questionResponse,
              fixerResponse,
            ] =
              await Promise.all(
                requests,
              );

            if (cancelled) {
              return;
            }

            privateVersionsRef.current.set(
              currentSlideId,
              Number(
                privateResponse
                  ?.version ??
                  0,
              ),
            );

            sharedVersionsRef.current.set(
              currentSlideId,
              Number(
                sharedResponse
                  ?.version ??
                  0,
              ),
            );

            setPrivateStrokes(
              (
                privateResponse
                  ?.strokes ??
                []
              )
                .map(
                  normalizeStroke,
                )
                .filter(
                  (stroke) =>
                    !stroke.isDeleted,
                ),
            );

            setSharedStrokes(
              (
                sharedResponse
                  ?.strokes ??
                []
              )
                .map(
                  normalizeStroke,
                )
                .filter(
                  (stroke) =>
                    !stroke.isDeleted,
                ),
            );

            setQuestions(
              (
                questionResponse
                  ?.questions ??
                []
              ).map(
                normalizeQuestion,
              ),
            );

            if (
              role ===
              "PROFESSOR"
            ) {
              setFixers(
                (
                  fixerResponse ??
                  []
                ).map(
                  normalizeFixer,
                ),
              );
            }
          } catch (error) {
            if (!cancelled) {
              setToast(
                error?.response
                  ?.data
                  ?.message ??
                  "슬라이드 데이터를 불러오지 못했습니다.",
              );
            }
          } finally {
            if (!cancelled) {
              setSlideLoading(
                false,
              );
            }
          }
        },
      );

    task.catch(
      () => undefined,
    );

    return () => {
      cancelled = true;
    };
  }, [
    currentSlideId,
    documentId,
    role,
  ]);

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
  }, [toast]);

  function getLayerState(
    layer,
  ) {
    if (
      layer ===
      "SHARED"
    ) {
      return {
        strokes:
          sharedStrokes,

        setStrokes:
          setSharedStrokes,

        sync:
          syncSharedStrokes,

        versions:
          sharedVersionsRef,

        queue:
          sharedQueueRef,
      };
    }

    return {
      strokes:
        privateStrokes,

      setStrokes:
        setPrivateStrokes,

      sync:
        syncPrivateStrokes,

      versions:
        privateVersionsRef,

      queue:
        privateQueueRef,
    };
  }

  function enqueueLayerTask(
    layer,
    task,
  ) {
    const {
      queue,
    } =
      getLayerState(
        layer,
      );

    const nextTask =
      queue.current
        .catch(
          () => undefined,
        )
        .then(task);

    queue.current =
      nextTask;

    return nextTask;
  }

  async function refreshLayer(
    layer,
    slideId,
  ) {
    if (!slideId) {
      return;
    }

    if (
      layer ===
      "SHARED"
    ) {
      const response =
        await getSharedStrokes(
          slideId,
        );

      sharedVersionsRef.current.set(
        slideId,
        Number(
          response?.version ??
            0,
        ),
      );

      if (
        slideId ===
        currentSlideId
      ) {
        setSharedStrokes(
          (
            response?.strokes ??
            []
          )
            .map(
              normalizeStroke,
            )
            .filter(
              (stroke) =>
                !stroke.isDeleted,
            ),
        );
      }

      return;
    }

    const response =
      await getPrivateStrokes(
        slideId,
      );

    privateVersionsRef.current.set(
      slideId,
      Number(
        response?.version ??
          0,
      ),
    );

    if (
      slideId ===
      currentSlideId
    ) {
      setPrivateStrokes(
        (
          response?.strokes ??
          []
        )
          .map(
            normalizeStroke,
          )
          .filter(
            (stroke) =>
              !stroke.isDeleted,
          ),
      );
    }
  }

  async function createStrokeOnServer(
    stroke,
    recordHistory = true,
  ) {
    if (
      !currentSlideId
    ) {
      return null;
    }

    const slideId =
      currentSlideId;

    const layer =
      editableLayer;

    const {
      setStrokes,
      sync,
      versions,
    } =
      getLayerState(
        layer,
      );

    const clientStrokeId =
      createUuid();

    const localStrokeId =
      `local-${clientStrokeId}`;

    const optimisticStroke = {
      ...stroke,
      id: localStrokeId,
    };

    setStrokes(
      (previous) => [
        ...previous,
        optimisticStroke,
      ],
    );

    return enqueueLayerTask(
      layer,
      async () => {
        try {
          const baseVersion =
            versions.current.get(
              slideId,
            ) ?? 0;

          const response =
            await sync(
              slideId,
              {
                base_version:
                  baseVersion,

                operations: [
                  {
                    client_operation_id:
                      createUuid(),

                    type:
                      "CREATE",

                    stroke:
                      toStrokeRequest(
                        stroke,
                        clientStrokeId,
                      ),
                  },
                ],
              },
            );

          versions.current.set(
            slideId,
            Number(
              response?.version ??
                baseVersion,
            ),
          );

          const mapping =
            (
              response
                ?.created_strokes ??
              []
            ).find(
              (item) =>
                item.client_stroke_id ===
                clientStrokeId,
            );

          const savedStroke = {
            ...optimisticStroke,

            id:
              mapping
                ?.stroke_id ??
              clientStrokeId,
          };

          if (
            slideId ===
            currentSlideId
          ) {
            setStrokes(
              (previous) =>
                previous.map(
                  (item) =>
                    item.id ===
                    localStrokeId
                      ? savedStroke
                      : item,
                ),
            );
          }

          if (
            recordHistory &&
            slideId ===
              currentSlideId
          ) {
            setUndoStack(
              (previous) => [
                ...previous,
                {
                  type:
                    "CREATE",

                  strokes: [
                    savedStroke,
                  ],
                },
              ],
            );

            setRedoStack([]);
          }

          return savedStroke;
        } catch (error) {
          if (
            slideId ===
            currentSlideId
          ) {
            setStrokes(
              (previous) =>
                previous.filter(
                  (item) =>
                    item.id !==
                    localStrokeId,
                ),
            );
          }

          await refreshLayer(
            layer,
            slideId,
          );

          setToast(
            error?.response
              ?.data
              ?.message ??
              "필기를 저장하지 못했습니다.",
          );

          return null;
        }
      },
    );
  }

  async function deleteStrokesOnServer(
    strokeIds,
    recordHistory = true,
  ) {
    if (
      !currentSlideId ||
      !strokeIds.length
    ) {
      return [];
    }

    const slideId =
      currentSlideId;

    const layer =
      editableLayer;

    const {
      strokes,
      setStrokes,
      sync,
      versions,
    } =
      getLayerState(
        layer,
      );

    const serverStrokeIds =
      strokeIds.filter(
        (strokeId) =>
          !String(
            strokeId,
          ).startsWith(
            "local-",
          ),
      );

    const removed =
      strokes.filter(
        (stroke) =>
          strokeIds.includes(
            stroke.id,
          ),
      );

    setStrokes(
      (previous) =>
        previous.filter(
          (stroke) =>
            !strokeIds.includes(
              stroke.id,
            ),
        ),
    );

    if (
      !serverStrokeIds.length
    ) {
      return removed;
    }

    return enqueueLayerTask(
      layer,
      async () => {
        try {
          const baseVersion =
            versions.current.get(
              slideId,
            ) ?? 0;

          const response =
            await sync(
              slideId,
              {
                base_version:
                  baseVersion,

                operations:
                  serverStrokeIds.map(
                    (strokeId) => ({
                      client_operation_id:
                        createUuid(),

                      type:
                        "DELETE",

                      stroke_id:
                        strokeId,
                    }),
                  ),
              },
            );

          versions.current.set(
            slideId,
            Number(
              response?.version ??
                baseVersion,
            ),
          );

          if (
            recordHistory &&
            removed.length &&
            slideId ===
              currentSlideId
          ) {
            setUndoStack(
              (previous) => [
                ...previous,
                {
                  type:
                    "DELETE",

                  strokes:
                    removed,
                },
              ],
            );

            setRedoStack([]);
          }

          return removed;
        } catch (error) {
          await refreshLayer(
            layer,
            slideId,
          );

          setToast(
            error?.response
              ?.data
              ?.message ??
              "필기를 삭제하지 못했습니다.",
          );

          return [];
        }
      },
    );
  }

  async function recreateStrokes(
    strokesToRestore,
  ) {
    const recreated = [];

    for (
      const stroke of
      strokesToRestore
    ) {
      const saved =
        await createStrokeOnServer(
          {
            ...stroke,
            id: undefined,
          },
          false,
        );

      if (saved) {
        recreated.push(
          saved,
        );
      }
    }

    return recreated;
  }

  async function handleUndo() {
    const action =
      undoStack[
        undoStack.length - 1
      ];

    if (!action) {
      return;
    }

    setUndoStack(
      (previous) =>
        previous.slice(
          0,
          -1,
        ),
    );

    if (
      action.type ===
      "CREATE"
    ) {
      await deleteStrokesOnServer(
        action.strokes.map(
          (stroke) =>
            stroke.id,
        ),
        false,
      );

      setRedoStack(
        (previous) => [
          ...previous,
          action,
        ],
      );

      return;
    }

    const recreated =
      await recreateStrokes(
        action.strokes,
      );

    setRedoStack(
      (previous) => [
        ...previous,
        {
          ...action,

          strokes:
            recreated,
        },
      ],
    );
  }

  async function handleRedo() {
    const action =
      redoStack[
        redoStack.length - 1
      ];

    if (!action) {
      return;
    }

    setRedoStack(
      (previous) =>
        previous.slice(
          0,
          -1,
        ),
    );

    if (
      action.type ===
      "CREATE"
    ) {
      const recreated =
        await recreateStrokes(
          action.strokes,
        );

      setUndoStack(
        (previous) => [
          ...previous,
          {
            ...action,

            strokes:
              recreated,
          },
        ],
      );

      return;
    }

    const removed =
      await deleteStrokesOnServer(
        action.strokes.map(
          (stroke) =>
            stroke.id,
        ),
        false,
      );

    setUndoStack(
      (previous) => [
        ...previous,
        {
          ...action,

          strokes:
            removed,
        },
      ],
    );
  }

  function handleToolChange(
    tool,
  ) {
    if (
      DRAWING_TOOLS.has(
        tool,
      )
    ) {
      if (
        activeTool ===
        tool
      ) {
        setToolOptionsOpen(
          (previous) =>
            !previous,
        );
      } else {
        setActiveTool(
          tool,
        );

        setToolOptionsOpen(
          true,
        );
      }

      setCreateQuestionMode(
        false,
      );

      setQuestionPoint(
        null,
      );

      return;
    }

    setToolOptionsOpen(
      false,
    );

    if (
      tool ===
      "Q_LIST"
    ) {
      setActiveTool(
        tool,
      );

      setCreateQuestionMode(
        false,
      );

      setPanelOpen(
        true,
      );

      return;
    }

    setActiveTool(
      tool,
    );

    if (
      tool !==
      "Q_POINT"
    ) {
      setCreateQuestionMode(
        false,
      );

      setQuestionPoint(
        null,
      );
    }
  }

  function handleQuestionPoint(
    point,
  ) {
    if (
      role !==
      "STUDENT"
    ) {
      return;
    }

    setQuestionPoint(
      point,
    );

    setCreateQuestionMode(
      true,
    );

    setPanelOpen(
      true,
    );

    setToolOptionsOpen(
      false,
    );
  }

  async function handleCheckSimilarQuestion({
    title,
    content,
  }) {
    if (
      !spaceId ||
      !currentSlideId
    ) {
      return [];
    }

    try {
      const response =
        await getSimilarQuestions(
          spaceId,
          {
            document_id:
              documentId,

            slide_id:
              currentSlideId,

            title,
            content,
          },
        );

      return (
        response
          ?.similar_questions ??
        []
      );
    } catch (error) {
      setToast(
        error?.response
          ?.data
          ?.message ??
          "유사 질문을 확인하지 못했습니다.",
      );

      return [];
    }
  }

  async function handleCreateQuestion({
    title,
    content,
  }) {
    if (
      !currentSlideId ||
      !questionPoint
    ) {
      return;
    }

    try {
      const response =
        await createSlideQuestion(
          currentSlideId,
          {
            title,
            content,

            x_ratio:
              questionPoint.x,

            y_ratio:
              questionPoint.y,
          },
        );

      const created =
        normalizeQuestion(
          response,
        );

      setQuestions(
        (previous) => [
          created,
          ...previous,
        ],
      );

      setSelectedQuestion(
        created,
      );

      setQuestionPoint(
        null,
      );

      setCreateQuestionMode(
        false,
      );

      setActiveTool(
        "Q_LIST",
      );

      setToast(
        "질문이 등록되었습니다.",
      );
    } catch (error) {
      setToast(
        error?.response
          ?.data
          ?.message ??
          "질문을 등록하지 못했습니다.",
      );

      throw error;
    }
  }

  async function handleSelectQuestion(
    question,
  ) {
    if (!question?.id) {
      return;
    }

    setCreateQuestionMode(
      false,
    );

    setPanelOpen(
      true,
    );

    setActiveTool(
      "Q_LIST",
    );

    setToolOptionsOpen(
      false,
    );

    try {
      const response =
        await getQuestionDetail(
          question.id,
        );

      setSelectedQuestion(
        normalizeQuestion(
          response,
        ),
      );
    } catch (error) {
      setToast(
        error?.response
          ?.data
          ?.message ??
          "질문을 불러오지 못했습니다.",
      );
    }
  }

  async function handleSubmitAnswer({
    answer,
    content,
  }) {
    if (
      !selectedQuestion?.id
    ) {
      return;
    }

    try {
      const answerId =
        answer?.answer_id ??
        answer?.answerId ??
        answer?.id;

      if (answerId) {
        await updateAnswer(
          answerId,
          {
            content,
          },
        );
      } else {
        await createAnswer(
          selectedQuestion.id,
          {
            content,
          },
        );
      }

      const response =
        await getQuestionDetail(
          selectedQuestion.id,
        );

      const normalized =
        normalizeQuestion(
          response,
        );

      setSelectedQuestion(
        normalized,
      );

      setQuestions(
        (previous) =>
          previous.map(
            (question) =>
              question.id ===
              normalized.id
                ? {
                    ...question,

                    status:
                      normalized.status,
                  }
                : question,
          ),
      );

      setToast(
        "답변이 저장되었습니다.",
      );
    } catch (error) {
      setToast(
        error?.response
          ?.data
          ?.message ??
          "답변을 저장하지 못했습니다.",
      );

      throw error;
    }
  }

  function handleFixerPoint(
    point,
  ) {
    if (
      role !==
      "PROFESSOR"
    ) {
      return;
    }

    setFixerDraftPoint(
      point,
    );

    setToolOptionsOpen(
      false,
    );
  }

  async function handleCreateFixer(
    content,
  ) {
    if (
      !currentSlideId ||
      !fixerDraftPoint
    ) {
      return;
    }

    try {
      const response =
        await createFixer(
          currentSlideId,
          {
            x_ratio:
              fixerDraftPoint.x,

            y_ratio:
              fixerDraftPoint.y,

            content,
          },
        );

      setFixers(
        (previous) => [
          ...previous,

          normalizeFixer(
            response,
          ),
        ],
      );

      setFixerDraftPoint(
        null,
      );

      setToast(
        "수정 메모가 등록되었습니다.",
      );
    } catch (error) {
      setToast(
        error?.response
          ?.data
          ?.message ??
          "수정 메모를 저장하지 못했습니다.",
      );
    }
  }

  async function handleFixerSelect(
    fixer,
  ) {
    if (
      role !==
        "PROFESSOR" ||
      fixer.isChecked
    ) {
      return;
    }

    try {
      await checkFixer(
        fixer.id,
      );

      setFixers(
        (previous) =>
          previous.map(
            (item) =>
              item.id ===
              fixer.id
                ? {
                    ...item,

                    isChecked:
                      true,
                  }
                : item,
          ),
      );
    } catch (error) {
      setToast(
        error?.response
          ?.data
          ?.message ??
          "수정 메모 상태를 변경하지 못했습니다.",
      );
    }
  }

  async function handleDownload() {
    if (!documentId) {
      return;
    }

    setDownloading(
      true,
    );

    try {
      const response =
        await getDocumentDownloadUrl(
          documentId,
        );

      const downloadUrl =
        response?.download_url ??
        response?.downloadUrl;

      if (!downloadUrl) {
        throw new Error();
      }

      window.open(
        downloadUrl,
        "_blank",
        "noopener,noreferrer",
      );

      setDownloadOpen(
        false,
      );
    } catch (error) {
      setToast(
        error?.response
          ?.data
          ?.message ??
          "강의자료를 다운로드하지 못했습니다.",
      );
    } finally {
      setDownloading(
        false,
      );
    }
  }

  function closeQuestionPanel() {
    setPanelOpen(
      false,
    );

    setCreateQuestionMode(
      false,
    );

    setQuestionPoint(
      null,
    );

    setSelectedQuestion(
      null,
    );

    setActiveTool(
      "PEN",
    );

    setToolOptionsOpen(
      false,
    );
  }

  function movePage(
    nextIndex,
  ) {
    if (
      nextIndex < 0 ||
      nextIndex >=
        slides.length
    ) {
      return;
    }

    setCurrentIndex(
      nextIndex,
    );

    setPanelOpen(
      false,
    );

    setCreateQuestionMode(
      false,
    );

    setQuestionPoint(
      null,
    );

    setSelectedQuestion(
      null,
    );

    setFixerDraftPoint(
      null,
    );

    setActiveTool(
      "PEN",
    );

    setToolOptionsOpen(
      false,
    );

    setUndoStack(
      [],
    );

    setRedoStack(
      [],
    );
  }

  const pageShellClass =
    `lecture-page lecture-page--${role.toLowerCase()}${
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
      <div className="lecture-frame">
        <LectureHeader
          title={
            documentTitle
          }
          spaceName={
            spaceName
          }
          canUndo={
            undoStack.length >
            0
          }
          canRedo={
            redoStack.length >
            0
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
          onDownload={() =>
            setDownloadOpen(
              true,
            )
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
                panelOpen={
                  panelOpen
                }
                onToolChange={
                  handleToolChange
                }
              />

              {toolOptionsOpen && (
                <DrawingToolOptions
                  tool={
                    activeTool
                  }
                  thickness={
                    activeThickness
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
              questions={
                questions
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
            role={role}
            open={
              panelOpen
            }
            createMode={
              createQuestionMode
            }
            questions={
              questions
            }
            selectedQuestion={
              selectedQuestion
            }
            loading={
              slideLoading
            }
            onClose={
              closeQuestionPanel
            }
            onSelectQuestion={
              handleSelectQuestion
            }
            onCheckSimilar={
              handleCheckSimilarQuestion
            }
            onCreateQuestion={
              handleCreateQuestion
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
            currentIndex - 1,
          )
        }
        onNext={() =>
          movePage(
            currentIndex + 1,
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
        onCancel={() =>
          setDownloadOpen(
            false,
          )
        }
        onConfirm={
          handleDownload
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