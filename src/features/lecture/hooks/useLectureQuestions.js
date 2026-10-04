import {
  useEffect,
  useRef,
  useState,
} from "react";
import { findQuestionSlideIndex } from "../utils/questionNavigation.js";

import {
  createAnswer,
  createVoiceAnswer,
  createSlideQuestion,
  getDocumentQuestions,
  getQuestionDetail,
  getSimilarQuestions,
  updateAnswer,
} from "../api/questionApi";

import {
  normalizeQuestion,
} from "../utils/lectureData";

function getQuestionArray(
  response,
) {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    Array.isArray(
      response?.questions,
    )
  ) {
    return response.questions;
  }

  if (
    Array.isArray(
      response?.content,
    )
  ) {
    return response.content;
  }

  if (
    Array.isArray(
      response?.items,
    )
  ) {
    return response.items;
  }

  if (
    Array.isArray(
      response?.data,
    )
  ) {
    return response.data;
  }

  return [];
}

function mergeQuestion(
  list,
  question,
) {
  if (!question?.id) {
    return list;
  }

  const exists =
    list.some(
      (item) =>
        String(item.id) ===
        String(
          question.id,
        ),
    );

  if (!exists) {
    return [
      question,
      ...list,
    ];
  }

  return list.map(
    (item) =>
      String(item.id) ===
      String(
        question.id,
      )
        ? {
            ...item,
            ...question,
          }
        : item,
  );
}

export default function useLectureQuestions({
  documentId,

  currentSlideId,
  slides,
  onQuestionSlideChange,

  role,

  questions = [],

  setQuestions,

  setPanelOpen,

  setActiveTool,

  setToolOptionsOpen,

  setToast,
}) {
  const normalizedRole =
    String(
      role || "STUDENT",
    ).toUpperCase();

  const [
    selectedQuestion,
    setSelectedQuestion,
  ] = useState(null);

  const [
    similarQuestionState,
    setSimilarQuestionState,
  ] = useState(null);

  const [
    questionPoint,
    setQuestionPoint,
  ] = useState(null);

  const [
    createQuestionMode,
    setCreateQuestionMode,
  ] = useState(false);

  const [
    isCreatingQuestion,
    setIsCreatingQuestion,
  ] = useState(false);

  const [
    questionScope,
    setQuestionScope,
  ] = useState(
    "SLIDE",
  );

  const [
    documentQuestions,
    setDocumentQuestions,
  ] = useState([]);

  const [
    documentQuestionsLoading,
    setDocumentQuestionsLoading,
  ] = useState(false);

  const questionList =
    questionScope ===
    "DOCUMENT"
      ? documentQuestions
      : questions;

  const [
    previousSlideId,
    setPreviousSlideId,
  ] = useState(currentSlideId);

  const selectionRequestRef = useRef(0);
  useEffect(() => () => {
    selectionRequestRef.current += 1;
  }, [documentId, currentSlideId]);

  // Reset before children render with a different slide's question state.
  if (!Object.is(previousSlideId, currentSlideId)) {
    setPreviousSlideId(currentSlideId);
    setSelectedQuestion(
      null,
    );

    setSimilarQuestionState(
      null,
    );

    setQuestionPoint(
      null,
    );

    setCreateQuestionMode(
      false,
    );

    setQuestionScope(
      "SLIDE",
    );
  }

  function handleQuestionPoint(
    point,
  ) {
    if (
      normalizedRole !==
      "STUDENT"
    ) {
      return;
    }

    if (!point) {
      return;
    }

    setQuestionPoint(
      point,
    );

    setCreateQuestionMode(
      true,
    );

    setSelectedQuestion(
      null,
    );

    setSimilarQuestionState(
      null,
    );

    setQuestionScope(
      "SLIDE",
    );

    setToolOptionsOpen?.(
      false,
    );

    setActiveTool?.(
      "Q_POINT",
    );

    setPanelOpen?.(
      true,
    );
  }

  async function loadDocumentQuestions() {
    if (!documentId) {
      setDocumentQuestions(
        [],
      );

      return [];
    }

    setDocumentQuestionsLoading(
      true,
    );

    try {
      const response =
        await getDocumentQuestions(
          documentId,
          {
            size: 100,
          },
        );

      const nextQuestions =
        getQuestionArray(
          response,
        )
          .map(
            normalizeQuestion,
          )
          .filter(
            Boolean,
          );

      setDocumentQuestions(
        nextQuestions,
      );

      return nextQuestions;
    } catch (error) {
      setToast?.(
        error?.response
          ?.data
          ?.message ??
          "전체 질문을 불러오지 못했습니다.",
      );

      return [];
    } finally {
      setDocumentQuestionsLoading(
        false,
      );
    }
  }

  async function handleQuestionScopeChange(
    nextScope,
  ) {
    if (
      nextScope !==
        "SLIDE" &&
      nextScope !==
        "DOCUMENT"
    ) {
      return;
    }

    selectionRequestRef.current += 1;
    setQuestionScope(
      nextScope,
    );

    setSelectedQuestion(
      null,
    );

    setSimilarQuestionState(
      null,
    );

    if (
      nextScope ===
      "DOCUMENT"
    ) {
      await loadDocumentQuestions();
    }
  }

  async function handleCheckSimilarQuestion(
    questionId,
  ) {
    if (!questionId) {
      return [];
    }

    setSimilarQuestionState({
      questionId,
      status:
        "loading",
      questions: [],
    });

    try {
      const response =
        await getSimilarQuestions(
          questionId,
        );

      const similarQuestions =
        response?.similar_questions ??
        response?.similarQuestions ??
        response?.questions ??
        response?.content ??
        (
          Array.isArray(
            response,
          )
            ? response
            : []
        );

      const result =
        Array.isArray(
          similarQuestions,
        )
          ? similarQuestions
          : [];

      setSimilarQuestionState({
        questionId,
        status:
          "success",
        questions:
          result,
      });

      return result;
    } catch (error) {
      setSimilarQuestionState({
        questionId,
        status:
          "error",
        questions: [],
      });

      setToast?.(
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
      normalizedRole !==
      "STUDENT"
    ) {
      return null;
    }

    if (
      !currentSlideId ||
      !questionPoint ||
      isCreatingQuestion
    ) {
      return null;
    }

    const trimmedTitle =
      String(
        title || "",
      ).trim();

    const trimmedContent =
      String(
        content || "",
      ).trim();

    if (
      !trimmedTitle ||
      !trimmedContent
    ) {
      return null;
    }

    setIsCreatingQuestion(
      true,
    );

    try {
      const response =
        await createSlideQuestion(
          currentSlideId,
          {
            title:
              trimmedTitle,

            content:
              trimmedContent,

            x_ratio:
              questionPoint.x,

            y_ratio:
              questionPoint.y,
          },
        );

      const normalized =
        normalizeQuestion(
          response,
        );

      const createdQuestion = {
        ...normalized,

        id:
          normalized?.id ??
          response
            ?.question_id ??
          response
            ?.questionId ??
          response?.id,

        title:
          normalized
            ?.title ??
          trimmedTitle,

        content:
          normalized
            ?.content ??
          trimmedContent,

        xRatio:
          normalized
            ?.xRatio ??
          questionPoint.x,

        yRatio:
          normalized
            ?.yRatio ??
          questionPoint.y,

        status:
          normalized
            ?.status ??
          "PENDING",
      };

      setQuestions?.(
        (previous) =>
          mergeQuestion(
            previous,
            createdQuestion,
          ),
      );

      setDocumentQuestions(
        (previous) =>
          mergeQuestion(
            previous,
            createdQuestion,
          ),
      );

      setQuestionPoint(
        null,
      );

      setCreateQuestionMode(
        false,
      );

      setSelectedQuestion(
        null,
      );

      setSimilarQuestionState(
        null,
      );

      setPanelOpen?.(
        false,
      );

      setToolOptionsOpen?.(
        false,
      );

      setActiveTool?.(
        "Q_POINT",
      );

      setToast?.(
        "질문이 등록되었습니다.",
      );

      return createdQuestion;
    } catch (error) {
      setToast?.(
        error?.response
          ?.data
          ?.message ??
          "질문을 등록하지 못했습니다.",
      );

      throw error;
    } finally {
      setIsCreatingQuestion(
        false,
      );
    }
  }

  async function handleSelectQuestion(
    question,
  ) {
    const questionId =
      question?.id ??
      question
        ?.question_id ??
      question
        ?.questionId;

    if (!questionId) {
      selectionRequestRef.current += 1;
      setSelectedQuestion(null);
      setSimilarQuestionState(null);
      return;
    }

    if (
      normalizedRole === "PROFESSOR" &&
      String(selectedQuestion?.id) === String(questionId)
    ) {
      selectionRequestRef.current += 1;
      setSelectedQuestion(null);
      setSimilarQuestionState(null);
      return;
    }

    const requestId = ++selectionRequestRef.current;
    setSelectedQuestion(null);

    setQuestionPoint(
      null,
    );

    setCreateQuestionMode(
      false,
    );

    setSimilarQuestionState(
      null,
    );

    setPanelOpen?.(
      true,
    );

    setToolOptionsOpen?.(
      false,
    );

    setActiveTool?.(
      "Q_LIST",
    );

    try {
      const response =
        await getQuestionDetail(
          questionId,
        );

      if (requestId !== selectionRequestRef.current) return;

      const normalized =
        normalizeQuestion(
          response,
        );

      const detail = {
        ...question,
        ...normalized,
        slide: normalized.slide ?? question.slide,
      };

      const targetIndex = findQuestionSlideIndex(slides, detail);
      if (targetIndex < 0) {
        const hasSlide = detail.slide?.slide_id != null || detail.slide?.id != null;

        if (hasSlide) {
          setToast?.("질문이 작성된 페이지를 현재 강의자료에서 찾을 수 없습니다.");
          return;
        }

        // Questions created from the archive have no slide/pin by design.
        // Keep them selectable in the lecture panel's document-wide list.
        setQuestionScope("DOCUMENT");
        setSelectedQuestion(detail);
        setDocumentQuestions((previous) => mergeQuestion(previous, detail));
        setToast?.("질문 페이지에서 작성한 질문입니다.");

        const documentQuestionList = await loadDocumentQuestions();
        if (requestId !== selectionRequestRef.current) return;
        setDocumentQuestions((previous) =>
          mergeQuestion(documentQuestionList ?? previous, detail),
        );
        return;
      }
      const targetSlideId = slides[targetIndex].id;
      const changesSlide = String(targetSlideId) !== String(currentSlideId);
      if (changesSlide) {
        // Preserve this selection across the intentional navigation. Ordinary
        // pagination still clears selection via the slide-change reset above.
        setPreviousSlideId(targetSlideId);
        onQuestionSlideChange(targetIndex);
      }

      setSelectedQuestion(
        detail,
      );

      if (!changesSlide) setQuestions?.(
        (previous) =>
          mergeQuestion(
            previous,
            detail,
          ),
      );

      setDocumentQuestions(
        (previous) =>
          mergeQuestion(
            previous,
            detail,
          ),
      );
    } catch (error) {
      if (requestId !== selectionRequestRef.current) return;

      setToast?.(
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
      normalizedRole !==
      "PROFESSOR"
    ) {
      return;
    }

    const questionId =
      selectedQuestion?.id;

    const trimmedContent =
      String(
        content || "",
      ).trim();

    if (
      !questionId ||
      !trimmedContent
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
            content:
              trimmedContent,
          },
        );
      } else {
        await createAnswer(
          questionId,
          {
            content:
              trimmedContent,
          },
        );
      }

      const response =
        await getQuestionDetail(
          questionId,
        );

      const normalized =
        normalizeQuestion(
          response,
        );

      setSelectedQuestion((previous) => String(previous?.id) === String(questionId) ? normalized : previous);

      setQuestions?.(
        (previous) =>
          mergeQuestion(
            previous,
            normalized,
          ),
      );

      setDocumentQuestions(
        (previous) =>
          mergeQuestion(
            previous,
            normalized,
          ),
      );

      setToast?.(
        answerId
          ? "답변이 수정되었습니다."
          : "답변이 등록되었습니다.",
      );
    } catch (error) {
      setToast?.(
        error?.response
          ?.data
          ?.message ??
          "답변을 저장하지 못했습니다.",
      );

      throw error;
    }
  }

  async function handleSubmitVoice(file, questionId) {
    if (normalizedRole !== "PROFESSOR" || !questionId) return;
    const answer = await createVoiceAnswer(questionId, file);
    const update = (question) => String(question.id) === String(questionId)
      ? { ...question, status: "ANSWERED", answers: [answer, ...(question.answers ?? [])] }
      : question;
    setSelectedQuestion((previous) => previous ? update(previous) : previous);
    setQuestions?.((previous) => previous.map(update));
    setDocumentQuestions((previous) => previous.map(update));
    setToast?.("음성 답변이 등록되었습니다.");
  }

  function cancelQuestionPoint() {
    selectionRequestRef.current += 1;
    setQuestionPoint(
      null,
    );

    setCreateQuestionMode(
      false,
    );
  }

  function resetQuestionState() {
    selectionRequestRef.current += 1;
    setQuestionPoint(
      null,
    );

    setCreateQuestionMode(
      false,
    );

    setSelectedQuestion(
      null,
    );

    setSimilarQuestionState(
      null,
    );

    setQuestionScope(
      "SLIDE",
    );
  }

  return {
    selectedQuestion,

    similarQuestionState,

    questionPoint,

    createQuestionMode,

    isCreatingQuestion,

    questionScope,

    questionList,

    documentQuestionsLoading,

    handleQuestionPoint,

    handleQuestionScopeChange,

    handleCheckSimilarQuestion,

    handleCreateQuestion,

    handleSelectQuestion,

    handleSubmitAnswer,

    handleSubmitVoice,

    cancelQuestionPoint,

    resetQuestionState,
  };
}
