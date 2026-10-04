import { useEffect, useRef, useState } from "react";
import { useSpaceAccess } from "../../spaces/context/SpaceAccessContext.js";

import {
  checkFixer,
  createFixer,
} from "../api/strokeApi";

import {
  normalizeFixer,
} from "../utils/lectureData";

export default function useLectureFixers({
  currentSlideId,
  role,
  setFixers,
  setToolOptionsOpen,
  setToast,
}) {
  const { readOnly } = useSpaceAccess();
  const [
    fixerDraftPoint,
    setFixerDraftPoint,
  ] = useState(null);

  const sessionRef = useRef(null);
  useEffect(() => {
    const session = {};
    sessionRef.current = session;
    return () => { if (sessionRef.current === session) sessionRef.current = null; };
  }, [currentSlideId]);

  function handleFixerPoint(
    point,
  ) {
    if (readOnly) return;
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
    if (readOnly) return;
    if (
      !currentSlideId ||
      !fixerDraftPoint
    ) {
      return;
    }

    const session = sessionRef.current;
    const point = fixerDraftPoint;
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

      if (sessionRef.current !== session) return;
      setFixers(
        (previous) => [
          ...previous,

          normalizeFixer(
            response,
          ),
        ],
      );

      setFixerDraftPoint((previous) => previous === point ? null : previous);

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
    if (readOnly) return;
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

  return {
    fixerDraftPoint,
    setFixerDraftPoint,

    handleFixerPoint,
    handleCreateFixer,
    handleFixerSelect,
  };
}
