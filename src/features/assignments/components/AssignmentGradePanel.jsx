import {
  useEffect,
  useState,
} from "react";

import downloadIcon from "../../../assets/icons/download2.svg";

import {
  finalizeAssignmentGrades,
  getAssignmentSubmissions,
  getAssignmentSubmissionsDownload,
  saveAssignmentGrades,
  updateAssignmentMaxScore,
  updateStudentAssignmentGrade,
} from "../api/assignmentsApi.js";

import AssignmentManageModal from "./AssignmentManageModal.jsx";

function getApiErrorMessage(
  error,
  fallbackMessage,
) {
  return (
    error?.response?.data?.message ??
    error?.response?.data?.detail ??
    error?.message ??
    fallbackMessage
  );
}

function formatSubmittedAt(
  value,
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "-";
  }

  return `${date.getFullYear()}. ${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}. ${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function getStatusLabel(
  status,
) {
  if (
    status === "LATE"
  ) {
    return "지각";
  }

  if (
    status === "SUBMITTED"
  ) {
    return "제출";
  }

  return "미제출";
}

function getStatusClassName(
  status,
) {
  if (
    status === "LATE"
  ) {
    return "is-late";
  }

  if (
    status === "NOT_SUBMITTED"
  ) {
    return "is-not-submitted";
  }

  return "is-submitted";
}

function normalizeScoreValue(
  value,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  return String(value);
}

function isNumericInput(
  value,
) {
  return /^\d*$/.test(
    value,
  );
}

function triggerDownloadUrl(
  downloadUrl,
) {
  const anchor =
    document.createElement(
      "a",
    );

  anchor.href =
    downloadUrl;

  anchor.target =
    "_blank";

  anchor.rel =
    "noopener noreferrer";

  document.body.appendChild(
    anchor,
  );

  anchor.click();
  anchor.remove();
}

function AssignmentGradePanel({
  assignment,
  mode = "grade",
  canFinalizeGrades = true,
  onCancel,
  onFinalized,
  onEditSaved,
}) {
  const isGradeEdit =
    mode === "grade-edit";

  const assignmentId =
    assignment?.assignment_id;

  const [
    submissions,
    setSubmissions,
  ] = useState([]);

  const [
    scores,
    setScores,
  ] = useState({});

  const [
    initialScores,
    setInitialScores,
  ] = useState({});

  const [
    maxScore,
    setMaxScore,
  ] = useState("100");

  const [
    initialMaxScore,
    setInitialMaxScore,
  ] = useState("100");

  const [
    isLoading,
    setIsLoading,
  ] = useState(
    Boolean(assignmentId),
  );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    isDownloading,
    setIsDownloading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    gradeModalStep,
    setGradeModalStep,
  ] = useState(null);

  const [
    downloadModalStep,
    setDownloadModalStep,
  ] = useState(null);

  useEffect(() => {
    if (
      !assignmentId
    ) {
      return undefined;
    }

    const controller =
      new AbortController();

    async function loadSubmissions() {
      setIsLoading(
        true,
      );

      setError("");

      try {
        const response =
          await getAssignmentSubmissions(
            assignmentId,
            {
              signal:
                controller.signal,
            },
          );

        if (
          controller.signal.aborted
        ) {
          return;
        }

        const nextSubmissions =
          Array.isArray(
            response?.submissions,
          )
            ? response.submissions
            : [];

        const nextMaxScore =
          response?.max_score ??
          assignment?.max_score ??
          100;

        const nextScores = {};

        nextSubmissions.forEach(
          (submission) => {
            nextScores[
              submission.student_id
            ] =
              normalizeScoreValue(
                submission.score,
              );
          },
        );

        setSubmissions(
          nextSubmissions,
        );

        setScores(
          nextScores,
        );

        setInitialScores(
          nextScores,
        );

        setMaxScore(
          String(
            nextMaxScore,
          ),
        );

        setInitialMaxScore(
          String(
            nextMaxScore,
          ),
        );
      } catch (
        requestError
      ) {
        if (
          requestError?.code ===
            "ERR_CANCELED" ||
          controller.signal.aborted
        ) {
          return;
        }

        setError(
          getApiErrorMessage(
            requestError,
            "학생 제출 현황을 불러오지 못했습니다.",
          ),
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(
            false,
          );
        }
      }
    }

    loadSubmissions();

    return () => {
      controller.abort();
    };
  }, [
    assignmentId,
    assignment?.max_score,
  ]);

  function validateScores() {
    const numericMaxScore =
      Number(
        maxScore,
      );

    if (
      !Number.isFinite(
        numericMaxScore,
      ) ||
      numericMaxScore <= 0
    ) {
      setError(
        "만점은 0보다 큰 숫자로 입력해주세요.",
      );

      return null;
    }

    for (
      const submission of
      submissions
    ) {
      const rawScore =
        scores[
          submission.student_id
        ];

      if (
        rawScore === "" ||
        rawScore === null ||
        rawScore === undefined
      ) {
        continue;
      }

      const numericScore =
        Number(
          rawScore,
        );

      if (
        !Number.isFinite(
          numericScore,
        ) ||
        numericScore < 0 ||
        numericScore >
          numericMaxScore
      ) {
        setError(
          `성적은 0점부터 ${numericMaxScore}점 사이로 입력해주세요.`,
        );

        return null;
      }
    }

    return numericMaxScore;
  }

  function buildGrades() {
    return submissions.map(
      (submission) => {
        const rawScore =
          scores[
            submission.student_id
          ];

        return {
          student_id:
            submission.student_id,

          score:
            rawScore === "" ||
            rawScore === null ||
            rawScore === undefined
              ? null
              : Number(
                  rawScore,
                ),
        };
      },
    );
  }

  function buildUpdatedSubmissions() {
    return submissions.map(
      (submission) => {
        const rawScore =
          scores[
            submission.student_id
          ];

        return {
          ...submission,

          score:
            rawScore === "" ||
            rawScore === null ||
            rawScore === undefined
              ? null
              : Number(
                  rawScore,
                ),
        };
      },
    );
  }

  function handleScoreChange(
    studentId,
    value,
  ) {
    if (
      !isNumericInput(
        value,
      )
    ) {
      return;
    }

    setError("");

    setScores(
      (current) => ({
        ...current,

        [studentId]:
          value,
      }),
    );
  }

  function handleMaxScoreChange(
    value,
  ) {
    if (
      !isNumericInput(
        value,
      )
    ) {
      return;
    }

    setMaxScore(
      value,
    );

    setError("");
  }

  function handleRequestFinalize() {
    if (
      isSaving ||
      !assignmentId
    ) {
      return;
    }

    if (
      validateScores() ===
      null
    ) {
      return;
    }

    setError("");

    setGradeModalStep(
      "confirm",
    );
  }

  function handleRequestDraftSave() {
    if (isSaving || !assignmentId || validateScores() === null) return;
    setError("");
    setGradeModalStep("confirm");
  }

  function handleCancelFinalize() {
    if (
      isSaving
    ) {
      return;
    }

    setGradeModalStep(
      null,
    );
  }

  async function handleConfirmFinalize() {
    if (
      isSaving ||
      !assignmentId
    ) {
      return;
    }

    const numericMaxScore =
      validateScores();

    if (
      numericMaxScore ===
      null
    ) {
      setGradeModalStep(
        null,
      );

      return;
    }

    setIsSaving(
      true,
    );

    setError("");

    try {
      if (
        String(
          maxScore,
        ) !==
        String(
          initialMaxScore,
        )
      ) {
        await updateAssignmentMaxScore(
          assignmentId,
          numericMaxScore,
        );
      }

      await saveAssignmentGrades(
        assignmentId,
        buildGrades(),
      );

      await finalizeAssignmentGrades(
        assignmentId,
      );

      const updatedSubmissions =
        buildUpdatedSubmissions();

      setSubmissions(
        updatedSubmissions,
      );

      setInitialScores({
        ...scores,
      });

      setInitialMaxScore(
        String(
          maxScore,
        ),
      );

      setGradeModalStep(
        "success",
      );
    } catch (
      requestError
    ) {
      setGradeModalStep(
        null,
      );

      setError(
        getApiErrorMessage(
          requestError,
          "성적 최종 저장에 실패했습니다.",
        ),
      );
    } finally {
      setIsSaving(
        false,
      );
    }
  }

  async function handleConfirmDraftSave() {
    if (isSaving || !assignmentId) return;
    const numericMaxScore = validateScores();
    if (numericMaxScore === null) {
      setGradeModalStep(null);
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      if (String(maxScore) !== String(initialMaxScore)) {
        await updateAssignmentMaxScore(assignmentId, numericMaxScore);
      }
      await saveAssignmentGrades(assignmentId, buildGrades());
      const updatedSubmissions = buildUpdatedSubmissions();
      setSubmissions(updatedSubmissions);
      setInitialScores({ ...scores });
      setInitialMaxScore(String(maxScore));
      setGradeModalStep("success");
    } catch (requestError) {
      setGradeModalStep(null);
      setError(getApiErrorMessage(requestError, "임시 성적 저장에 실패했습니다."));
    } finally {
      setIsSaving(false);
    }
  }

  function handleFinalizeSuccess() {
    const updatedSubmissions =
      buildUpdatedSubmissions();

    setGradeModalStep(
      null,
    );

    onFinalized?.({
      grading_status:
        "FINALIZED",

      max_score:
        Number(
          maxScore,
        ),

      submissions:
        updatedSubmissions,
    });
  }

  function handleDraftSaveSuccess() {
    const updatedSubmissions = buildUpdatedSubmissions();
    setGradeModalStep(null);
    onFinalized?.({
      grading_status: "DRAFT",
      max_score: Number(maxScore),
      submissions: updatedSubmissions,
    });
  }

  function handleRequestEditSave() {
    if (
      isSaving ||
      !assignmentId
    ) {
      return;
    }

    if (
      validateScores() ===
      null
    ) {
      return;
    }

    setError("");
    setGradeModalStep(
      "confirm",
    );
  }

  async function handleConfirmEditSave() {
    if (
      isSaving ||
      !assignmentId
    ) {
      return;
    }

    const numericMaxScore =
      validateScores();

    if (
      numericMaxScore ===
      null
    ) {
      setGradeModalStep(
        null,
      );

      return;
    }

    setIsSaving(
      true,
    );

    setError("");

    try {
      if (
        String(
          maxScore,
        ) !==
        String(
          initialMaxScore,
        )
      ) {
        await updateAssignmentMaxScore(
          assignmentId,
          numericMaxScore,
        );
      }

      const changedStudents =
        submissions.filter(
          (submission) =>
            String(
              scores[
                submission.student_id
              ] ?? "",
            ) !==
            String(
              initialScores[
                submission.student_id
              ] ?? "",
            ),
        );

      await Promise.all(
        changedStudents.map(
          (submission) => {
            const rawScore =
              scores[
                submission.student_id
              ];

            if (
              rawScore === "" ||
              rawScore === null ||
              rawScore === undefined
            ) {
              return Promise.resolve();
            }

            return updateStudentAssignmentGrade(
              assignmentId,
              submission.student_id,
              Number(
                rawScore,
              ),
            );
          },
        ),
      );

      const updatedSubmissions =
        buildUpdatedSubmissions();

      setSubmissions(
        updatedSubmissions,
      );

      setInitialScores({
        ...scores,
      });

      setInitialMaxScore(
        String(
          maxScore,
        ),
      );

      setGradeModalStep(
        "success",
      );
    } catch (
      requestError
    ) {
      setGradeModalStep(
        null,
      );

      setError(
        getApiErrorMessage(
          requestError,
          "성적 수정에 실패했습니다.",
        ),
      );
    } finally {
      setIsSaving(
        false,
      );
    }
  }

  function handleEditSuccess() {
    setGradeModalStep(
      null,
    );

    onEditSaved?.({
      grading_status:
        "FINALIZED",

      max_score:
        Number(maxScore),

      submissions:
        buildUpdatedSubmissions(),
    });
  }

  function handleRequestDownload() {
    if (
      isDownloading ||
      !assignmentId
    ) {
      return;
    }

    setError("");

    setDownloadModalStep(
      "confirm",
    );
  }

  function handleCancelDownload() {
    if (
      isDownloading
    ) {
      return;
    }

    setDownloadModalStep(
      null,
    );
  }

  async function handleConfirmDownload() {
    if (
      isDownloading ||
      !assignmentId
    ) {
      return;
    }

    setIsDownloading(
      true,
    );

    setError("");

    try {
      const response =
        await getAssignmentSubmissionsDownload(
          assignmentId,
        );

      const downloadUrl =
        response?.download_url;

      if (
        !downloadUrl
      ) {
        throw new Error(
          "다운로드 주소를 확인할 수 없습니다.",
        );
      }

      triggerDownloadUrl(
        downloadUrl,
      );

      setDownloadModalStep(
        "success",
      );
    } catch (
      requestError
    ) {
      setDownloadModalStep(
        null,
      );

      setError(
        getApiErrorMessage(
          requestError,
          "제출물을 다운로드하지 못했습니다.",
        ),
      );
    } finally {
      setIsDownloading(
        false,
      );
    }
  }

  function handleDownloadSuccess() {
    setDownloadModalStep(
      null,
    );
  }

  function handleOpenFile(
    file,
  ) {
    const fileUrl =
      file?.file_url ??
      file?.fileUrl;

    if (
      !fileUrl
    ) {
      return;
    }

    window.open(
      fileUrl,
      "_blank",
      "noopener,noreferrer",
    );
  }

  if (isLoading) {
    return (
      <section className="assignment-grade-panel">
        <div className="assignment-grade-panel__state">
          제출 현황을 불러오는 중입니다.
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="assignment-grade-panel">
        <header className="assignment-grade-panel__header">
          <div>
            <h2>
              {assignment?.title ??
                "과제 채점"}
            </h2>

            <p>
              {isGradeEdit
                ? "학생별 제출물을 확인하고 성적을 수정하세요"
                : "학생별 제출물을 확인하고 성적을 입력하세요"}
            </p>
          </div>

          <div className="assignment-grade-panel__max-score">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={maxScore}
              disabled={
                isSaving
              }
              aria-label="과제 만점"
              onChange={(
                event,
              ) =>
                handleMaxScoreChange(
                  event.target.value,
                )
              }
            />

            <span>
              점 만점
            </span>
          </div>
        </header>

        <div className="assignment-grade-panel__divider" />

        <div className="assignment-grade-panel__table">
          <div className="assignment-grade-panel__table-head">
            <span>
              상태
            </span>

            <span>
              이름
            </span>

            <span>
              학번
            </span>

            <span>
              제출물
            </span>

            <span>
              제출 일시
            </span>

            <span>
              성적 입력
            </span>
          </div>

          <div className="assignment-grade-panel__table-body">
            {submissions.map(
              (submission) => {
                const files =
                  Array.isArray(
                    submission.files,
                  )
                    ? submission.files
                    : [];

                const firstFile =
                  files[0];

                return (
                  <div
                    className="assignment-grade-panel__row"
                    key={
                      submission.student_id
                    }
                  >
                    <span
                      className={`assignment-grade-panel__status ${getStatusClassName(
                        submission.status,
                      )}`}
                    >
                      {getStatusLabel(
                        submission.status,
                      )}
                    </span>

                    <strong className="assignment-grade-panel__name">
                      {
                        submission.name
                      }
                    </strong>

                    <span className="assignment-grade-panel__student-number">
                      {
                        submission.student_number
                      }
                    </span>

                    <div className="assignment-grade-panel__submission">
                      {firstFile ? (
                        <button
                          type="button"
                          className="assignment-grade-panel__file"
                          onClick={() =>
                            handleOpenFile(
                              firstFile,
                            )
                          }
                        >
                          {
                            firstFile.file_name
                          }
                        </button>
                      ) : (
                        <span className="assignment-grade-panel__dash">
                          -
                        </span>
                      )}
                    </div>

                    <span className="assignment-grade-panel__submitted-at">
                      {formatSubmittedAt(
                        submission.submitted_at,
                      )}
                    </span>

                    <div className="assignment-grade-panel__score">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={
                          scores[
                            submission.student_id
                          ] ?? ""
                        }
                        disabled={
                          isSaving
                        }
                        placeholder="점수 입력"
                        aria-label={`${submission.name} 성적`}
                        onChange={(
                          event,
                        ) =>
                          handleScoreChange(
                            submission.student_id,
                            event.target.value,
                          )
                        }
                      />

                      <span>
                        /
                      </span>

                      <strong>
                        {maxScore ||
                          "-"}
                      </strong>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>

        <footer className="assignment-grade-panel__footer">
          <button
            type="button"
            className="assignment-grade-panel__download"
            disabled={
              isDownloading
            }
            onClick={
              handleRequestDownload
            }
          >
            <span>
              전체 다운로드
            </span>

            <img
              src={downloadIcon}
              alt=""
              aria-hidden="true"
            />
          </button>

          {error && (
            <p
              className="assignment-grade-panel__error"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="assignment-grade-panel__actions">
            <button
              type="button"
              className="assignment-grade-panel__cancel"
              disabled={
                isSaving
              }
              onClick={
                onCancel
              }
            >
              취소
            </button>

            <button
              type="button"
              className="assignment-grade-panel__save"
              disabled={
                isSaving
              }
              onClick={
                isGradeEdit
                  ? handleRequestEditSave
                  : canFinalizeGrades
                    ? handleRequestFinalize
                    : handleRequestDraftSave
              }
            >
              {isSaving
                ? isGradeEdit
                  ? "수정 중"
                  : "저장 중"
                : isGradeEdit
                  ? "수정"
                  : "저장"}
            </button>
          </div>
        </footer>
      </section>

      <AssignmentManageModal
        action={isGradeEdit ? "gradeEdit" : canFinalizeGrades ? "grade" : "gradeDraft"}
        step={
          gradeModalStep ??
          "confirm"
        }
        isOpen={
          gradeModalStep !==
          null
        }
        isProcessing={
          isSaving
        }
        onCancel={
          handleCancelFinalize
        }
        onConfirm={
          gradeModalStep ===
          "success"
            ? isGradeEdit
              ? handleEditSuccess
              : canFinalizeGrades
                ? handleFinalizeSuccess
                : handleDraftSaveSuccess
            : isGradeEdit
              ? handleConfirmEditSave
              : canFinalizeGrades
                ? handleConfirmFinalize
                : handleConfirmDraftSave
        }
      />

      <AssignmentManageModal
        action="download"
        step={
          downloadModalStep ??
          "confirm"
        }
        isOpen={
          downloadModalStep !==
          null
        }
        isProcessing={
          isDownloading
        }
        onCancel={
          handleCancelDownload
        }
        onConfirm={
          downloadModalStep ===
          "success"
            ? handleDownloadSuccess
            : handleConfirmDownload
        }
      />
    </>
  );
}

export default AssignmentGradePanel;
