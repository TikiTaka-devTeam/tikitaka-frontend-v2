import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getFixers,
  getPrivateStrokes,
} from "../api/strokeApi";

import {
  getDocumentQuestions,
} from "../api/questionApi";

import {
  normalizeFixer,
  normalizeQuestion,
  normalizeStroke,
} from "../utils/lectureData";

function getStrokeArray(
  response,
) {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    Array.isArray(
      response?.strokes,
    )
  ) {
    return response.strokes;
  }

  if (
    Array.isArray(
      response?.content,
    )
  ) {
    return response.content;
  }

  return [];
}

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

  return [];
}

function getFixerArray(
  response,
) {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    Array.isArray(
      response?.fixers,
    )
  ) {
    return response.fixers;
  }

  if (
    Array.isArray(
      response?.content,
    )
  ) {
    return response.content;
  }

  return [];
}

function getVersion(
  response,
) {
  return (
    response?.version ??
    response?.stroke_version ??
    response?.strokeVersion ??
    0
  );
}

export default function useLectureSlideData({
  currentSlideId,
  documentId,
  role,
  setToast,
}) {
  const normalizedRole =
    String(
      role || "STUDENT",
    ).toUpperCase();

  const [
    privateStrokes,
    setPrivateStrokes,
  ] = useState([]);

  const [
    sharedStrokes,
    setSharedStrokes,
  ] = useState([]);

  const [strokeSlideId, setStrokeSlideId] = useState(currentSlideId);
  if (strokeSlideId !== currentSlideId) {
    setStrokeSlideId(currentSlideId);
    setPrivateStrokes([]);
    setSharedStrokes([]);
  }

  const [
    questions,
    setQuestions,
  ] = useState([]);

  const [
    fixers,
    setFixers,
  ] = useState([]);

  const [
    slideLoading,
    setSlideLoading,
  ] = useState(false);

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

  useEffect(() => {
    let cancelled =
      false;

    async function loadSlideData() {
      if (
        !currentSlideId
      ) {
        setPrivateStrokes([]);

        setQuestions([]);

        setFixers([]);


        return;
      }

      setSlideLoading(true);

      try {
        const requests = [
          normalizedRole === "PROFESSOR"
            ? Promise.resolve({ version: 0, strokes: [] })
            : getPrivateStrokes(currentSlideId),

          documentId
            ? getDocumentQuestions(
                documentId,
                {
                  scope:
                    "SLIDE",

                  slide_id:
                    currentSlideId,

                  size:
                    20,
                },
              )
            : Promise.resolve({
                questions: [],
              }),
        ];

        if (
          normalizedRole ===
          "PROFESSOR"
        ) {
          requests.push(
            getFixers(
              currentSlideId,
            ),
          );
        }

        const responses =
          await Promise.all(
            requests,
          );

        if (cancelled) {
          return;
        }

        const [
          privateResponse,
          questionResponse,
          fixerResponse,
        ] = responses;

        const nextPrivateStrokes =
          getStrokeArray(
            privateResponse,
          )
            .map(
              normalizeStroke,
            )
            .filter(
              (stroke) =>
                stroke &&
                !stroke.isDeleted,
            );

        const nextQuestions =
          getQuestionArray(
            questionResponse,
          )
            .map(
              normalizeQuestion,
            )
            .filter(Boolean);

        const nextFixers =
          normalizedRole ===
          "PROFESSOR"
            ? getFixerArray(
                fixerResponse,
              )
                .map(
                  normalizeFixer,
                )
                .filter(
                  Boolean,
                )
            : [];

        if ((privateVersionsRef.current.get(currentSlideId) ?? -1) <= getVersion(privateResponse)) {
          setPrivateStrokes(nextPrivateStrokes);
          privateVersionsRef.current.set(currentSlideId, getVersion(privateResponse));
        }

        setQuestions(
          nextQuestions,
        );

        setFixers(
          nextFixers,
        );

      } catch (error) {
        if (cancelled) {
          return;
        }

        setPrivateStrokes([]);

        setQuestions([]);

        setFixers([]);



        setToast?.(
          error?.response?.data?.message ??
            "슬라이드 데이터를 불러오지 못했습니다.",
        );
      } finally {
        if (!cancelled) {
          setSlideLoading(
            false,
          );
        }
      }
    }

    loadSlideData();

    return () => {
      cancelled =
        true;
    };
  }, [
    currentSlideId,
    documentId,
    normalizedRole,
    setToast,
  ]);

  return {
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
  };
}
