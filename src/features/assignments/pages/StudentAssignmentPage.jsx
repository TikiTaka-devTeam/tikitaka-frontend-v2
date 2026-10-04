import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import assignmentEmptyIcon from "../../../assets/icons/assignment-empty.svg";
import closeIcon from "../../../assets/icons/close.svg";
import pdfIcon from "../../../assets/icons/pdf.svg";


import { useSpaceAccess } from "../../spaces/context/SpaceAccessContext.js";
import {
  getAssignmentDetail,
  getAssignmentSummary,
  getSpaceAssignments,
  submitAssignment,
  updateMyAssignmentSubmission,
} from "../api/assignmentsApi.js";

import AssignmentSubmitModal from "../components/AssignmentSubmitModal.jsx";

import "../styles/studentAssignments.css";

function getApiErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ??
    error?.response?.data?.detail ??
    error?.message ??
    fallbackMessage
  );
}

function isSubmittedStatus(status) {
  return status === "SUBMITTED" || status === "LATE";
}

function formatFileSize(size) {
  const numericSize = Number(size);

  if (!Number.isFinite(numericSize) || numericSize <= 0) {
    return "";
  }

  const megabytes = numericSize / (1024 * 1024);

  if (megabytes >= 1) {
    return `${megabytes.toFixed(1)} MB`;
  }

  const kilobytes = numericSize / 1024;

  return `${Math.max(1, Math.round(kilobytes))} KB`;
}

function getFileSizeText(file) {
  if (!file) {
    return "";
  }

  if (file.file_size_text) {
    return file.file_size_text;
  }

  if (file.fileSizeText) {
    return file.fileSizeText;
  }

  return formatFileSize(
    file.file_size ??
      file.fileSize ??
      file.size,
  );
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
}

function formatShortDeadline(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}

function formatDeadline(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const weekdays = [
    "일",
    "월",
    "화",
    "수",
    "목",
    "금",
    "토",
  ];

  const hours = String(
    date.getHours(),
  ).padStart(2, "0");

  const minutes = String(
    date.getMinutes(),
  ).padStart(2, "0");

  return `${date.getFullYear()}. ${
    date.getMonth() + 1
  }. ${date.getDate()} (${
    weekdays[date.getDay()]
  }) ${hours}:${minutes}`;
}

function getDdayLabel(dueAt) {
  if (!dueAt) {
    return "";
  }

  const dueDate = new Date(dueAt);

  if (Number.isNaN(dueDate.getTime())) {
    return "";
  }

  const difference =
    dueDate.getTime() - Date.now();

  if (difference < 0) {
    return "마감";
  }

  const days = Math.ceil(
    difference /
      (1000 * 60 * 60 * 24),
  );

  if (days <= 0) {
    return "D-Day";
  }

  return `D-${days}`;
}

function getStudentViewState(assignment) {
  if (!assignment) {
    return "EMPTY";
  }

  if (
    assignment.grading_status ===
    "FINALIZED"
  ) {
    return "GRADED";
  }

  if (
    assignment.status === "CLOSED" &&
    assignment.grading_status === "DRAFT"
  ) {
    return "GRADING";
  }

  if (
    assignment.status === "OPEN" &&
    isSubmittedStatus(
      assignment.my_submission?.status,
    )
  ) {
    return "SUBMITTED";
  }

  if (
    assignment.status === "OPEN" &&
    (
      !assignment.my_submission ||
      assignment.my_submission
        ?.status === "NOT_SUBMITTED"
    )
  ) {
    return "NOT_SUBMITTED";
  }

  if (assignment.status === "CLOSED") {
    return "CLOSED";
  }

  return "NOT_SUBMITTED";
}

function getListStatusLabel(assignment) {
  if (assignment.status === "CLOSED") {
    return "마감";
  }

  return getDdayLabel(
    assignment.due_at,
  );
}

function getListDotClass(assignment) {
  if (assignment.status === "CLOSED") {
    return "is-closed";
  }

  if (
    assignment.submission_status ===
    "NOT_SUBMITTED"
  ) {
    return "is-active";
  }

  return "is-submitted";
}

function AssignmentEmptyState() {
  return (
    <div className="assignment-empty">
      <div
        className="assignment-empty__icon"
        aria-hidden="true"
      >
        <img
          src={assignmentEmptyIcon}
          alt=""
        />
      </div>

      <strong>
        과제를 선택해 확인하세요
      </strong>

      <p>
        왼쪽 목록에서 확인할 과제를 선택해 주세요.
      </p>
    </div>
  );
}

function StudentAssignmentPage() {
  const { readOnly } = useSpaceAccess();
  const location = useLocation();
  const { spaceId } = useParams();

  const fileInputRef =
    useRef(null);


  const [
    assignments,
    setAssignments,
  ] = useState([]);

  const [
    summary,
    setSummary,
  ] = useState({
    not_submitted_count: 0,
  });

  const [
    selectedAssignmentId,
    setSelectedAssignmentId,
  ] = useState(
    location.state?.assignmentDetail?.assignment_id ?? null,
  );

  const [
    assignmentDetail,
    setAssignmentDetail,
  ] = useState(
    location.state?.assignmentDetail ?? null,
  );

  const [
    pageMode,
    setPageMode,
  ] = useState("detail");

  const [
    submissionComment,
    setSubmissionComment,
  ] = useState("");

  const [
    submissionFiles,
    setSubmissionFiles,
  ] = useState([]);

  const [
    modalStep,
    setModalStep,
  ] = useState(null);

  const [
    isListLoading,
    setIsListLoading,
  ] = useState(true);

  const [
    isDetailLoading,
    setIsDetailLoading,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    listError,
    setListError,
  ] = useState("");

  const [
    detailError,
    setDetailError,
  ] = useState("");

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  useEffect(() => {
    if (!spaceId) {
      return undefined;
    }

    const controller =
      new AbortController();

    async function loadAssignments() {
      setIsListLoading(true);
      setListError("");

      try {
        const [
          assignmentResponse,
          summaryResponse,
        ] = await Promise.all([
          getSpaceAssignments(
            spaceId,
            {
              signal:
                controller.signal,
            },
          ),
          getAssignmentSummary(
            spaceId,
            {
              signal:
                controller.signal,
            },
          ),
        ]);

        if (
          controller.signal.aborted
        ) {
          return;
        }

        setAssignments(
          Array.isArray(
            assignmentResponse
              ?.assignments,
          )
            ? assignmentResponse
                .assignments
            : [],
        );

        setSummary({
          not_submitted_count:
            Number(
              summaryResponse
                ?.not_submitted_count,
            ) || 0,
        });
      } catch (error) {
        if (
          error?.code ===
            "ERR_CANCELED" ||
          controller.signal.aborted
        ) {
          return;
        }

        setListError(
          getApiErrorMessage(
            error,
            "과제 목록을 불러오지 못했습니다.",
          ),
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsListLoading(false);
        }
      }
    }

    loadAssignments();

    return () => {
      controller.abort();
    };
  }, [spaceId]);

  async function refreshListData() {
    const [
      assignmentResponse,
      summaryResponse,
    ] = await Promise.all([
      getSpaceAssignments(spaceId),
      getAssignmentSummary(spaceId),
    ]);

    setAssignments(
      Array.isArray(
        assignmentResponse
          ?.assignments,
      )
        ? assignmentResponse
            .assignments
        : [],
    );

    setSummary({
      not_submitted_count:
        Number(
          summaryResponse
            ?.not_submitted_count,
        ) || 0,
    });
  }

  async function handleSelectAssignment(
    assignment,
  ) {
    if (
      !assignment?.assignment_id ||
      isDetailLoading
    ) {
      return;
    }

    const assignmentId =
      assignment.assignment_id;

    setSelectedAssignmentId(
      assignmentId,
    );

    setPageMode("detail");
    setAssignmentDetail(null);
    setDetailError("");
    setSubmitError("");
    setModalStep(null);
    setIsDetailLoading(true);

    try {
      const detail =
        await getAssignmentDetail(
          assignmentId,
        );

      setAssignmentDetail(
        detail,
      );

      setAssignments(
        (current) =>
          current.map(
            (item) => {
              if (
                item.assignment_id !==
                assignmentId
              ) {
                return item;
              }

              return {
                ...item,
                grading_status:
                  detail
                    ?.grading_status,
                submission_status:
                  detail
                    ?.my_submission
                    ?.status ??
                  item
                    .submission_status,
              };
            },
          ),
      );
    } catch (error) {
      setDetailError(
        getApiErrorMessage(
          error,
          "과제 상세 정보를 불러오지 못했습니다.",
        ),
      );
    } finally {
      setIsDetailLoading(false);
    }
  }

  function handleOpenSubmission() {
    if (readOnly) return;
    if (
      !assignmentDetail ||
      assignmentDetail.status !==
        "OPEN"
    ) {
      return;
    }

    setSubmissionComment(
      assignmentDetail
        ?.my_submission
        ?.comment ??
        "",
    );

    setSubmissionFiles([]);
    setSubmitError("");
    setModalStep(null);
    setPageMode("submit");
  }

  function handleBackFromSubmission() {
    setSubmissionComment("");
    setSubmissionFiles([]);
    setSubmitError("");
    setModalStep(null);
    setPageMode("detail");
  }

  function handleOpenFilePicker() {
    fileInputRef.current?.click();
  }

  function appendFiles(fileList) {
    const newFiles =
      Array.from(
        fileList ?? [],
      );

    if (
      newFiles.length === 0
    ) {
      return;
    }

    setSubmissionFiles(
      (current) => [
        ...current,
        ...newFiles,
      ],
    );
  }

  function handleFileChange(event) {
    appendFiles(
      event.target.files,
    );

    event.target.value = "";
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function handleDrop(event) {
    event.preventDefault();

    appendFiles(
      event.dataTransfer.files,
    );
  }

  function handleRemoveFile(index) {
    setSubmissionFiles(
      (current) =>
        current.filter(
          (
            _file,
            fileIndex,
          ) =>
            fileIndex !== index,
        ),
    );
  }

  function handleRequestSubmit() {
    if (readOnly) return;
    if (
      !assignmentDetail ||
      isSubmitting
    ) {
      return;
    }

    setSubmitError("");
    setModalStep("confirm");
  }

  function handleCancelSubmit() {
    if (isSubmitting) {
      return;
    }

    setModalStep(null);
  }

  async function handleConfirmSubmit() {
    if (readOnly) return;
    if (
      !assignmentDetail ||
      isSubmitting
    ) {
      return;
    }

    const assignmentId =
      assignmentDetail
        .assignment_id;

    const submissionStatus =
      assignmentDetail
        ?.my_submission
        ?.status;

    const alreadySubmitted =
      isSubmittedStatus(
        submissionStatus,
      );

    setIsSubmitting(true);
    setSubmitError("");

    try {
      if (alreadySubmitted) {
        await updateMyAssignmentSubmission(
          assignmentId,
          {
            comment:
              submissionComment,
            files:
              submissionFiles,
          },
        );
      } else {
        await submitAssignment(
          assignmentId,
          {
            comment:
              submissionComment,
            files:
              submissionFiles,
          },
        );
      }

      const detail =
        await getAssignmentDetail(
          assignmentId,
        );

      setAssignmentDetail(
        detail,
      );

      await refreshListData();

      setModalStep("success");
    } catch (error) {
      setModalStep(null);

      setSubmitError(
        getApiErrorMessage(
          error,
          alreadySubmitted
            ? "과제 재제출에 실패했습니다."
            : "과제 제출에 실패했습니다.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmitSuccess() {
    setModalStep(null);
    setSubmissionComment("");
    setSubmissionFiles([]);
    setPageMode("detail");
  }

  function handleFileOpen(file) {
    const url =
      file?.file_url ??
      file?.fileUrl;

    if (!url) {
      return;
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer",
    );
  }

  const viewState =
    getStudentViewState(
      assignmentDetail,
    );

  const assignmentFiles =
    Array.isArray(
      assignmentDetail?.files,
    )
      ? assignmentDetail.files
      : [];

  const existingSubmissionFiles =
    Array.isArray(
      assignmentDetail
        ?.my_submission
        ?.files,
    )
      ? assignmentDetail
          .my_submission
          .files
      : [];

  const currentSubmissionStatus =
    assignmentDetail
      ?.my_submission
      ?.status;

  const isResubmission =
    isSubmittedStatus(
      currentSubmissionStatus,
    );

  function renderDetail() {
    if (isDetailLoading) {
      return (
        <div className="assignment-panel-state">
          과제를 불러오는 중입니다.
        </div>
      );
    }

    if (detailError) {
      return (
        <div className="assignment-panel-state assignment-panel-state--error">
          {detailError}
        </div>
      );
    }

    if (!assignmentDetail) {
      return (
        <>
          <div className="assignment-detail-intro">
            <h2>
              과제
            </h2>

            <p>
              과제를 확인하고 제출 상태와 성적을 확인하세요.
            </p>
          </div>

          <div className="assignment-detail-divider assignment-detail-divider--header" />

          <AssignmentEmptyState />
        </>
      );
    }

    return (
      <article className="assignment-detail">
        <h2>
          {
            assignmentDetail
              .title
          }
        </h2>

        <div className="assignment-detail__meta">
          <span>
            {formatDate(
              assignmentDetail
                .created_at,
            )}
          </span>

          <span>·</span>

          <span>
            {
              assignmentDetail
                .writer_name
            }
          </span>
        </div>

        <span className="assignment-detail__deadline">
          마감일{" "}
          {formatShortDeadline(
            assignmentDetail
              .due_at,
          )}
        </span>

        <div className="assignment-detail-divider assignment-detail-divider--header" />

        <div className="assignment-detail__body">
          {
            assignmentDetail
              .description
          }
        </div>

        {!readOnly && viewState ===
          "NOT_SUBMITTED" && (
          <button
            type="button"
            className="assignment-detail__submit-button"
            onClick={
              handleOpenSubmission
            }
          >
            제출하러 가기
          </button>
        )}

        {!readOnly && viewState ===
          "SUBMITTED" && (
          <button
            type="button"
            className="assignment-detail__submit-button"
            onClick={
              handleOpenSubmission
            }
          >
            제출 수정하기
          </button>
        )}

        {viewState ===
          "GRADING" && (
          <button
            type="button"
            className="assignment-detail__submit-button is-disabled"
            disabled
          >
            채점 중
          </button>
        )}

        {viewState ===
          "CLOSED" && (
          <button
            type="button"
            className="assignment-detail__submit-button is-disabled"
            disabled
          >
            마감
          </button>
        )}

        {viewState ===
          "GRADED" && (
          <div className="assignment-grade-card">
            <strong>
              {
                assignmentDetail
                  .score
              }
              /
              {
                assignmentDetail
                  .max_score
              }
            </strong>

            <span>
              평가 완료
            </span>
          </div>
        )}

        <div className="assignment-detail-divider assignment-detail-divider--attachments" />

        {readOnly && existingSubmissionFiles.length > 0 && (
          <section className="assignment-existing-submission">
            <div className="assignment-existing-submission__header"><span>내 제출 파일</span></div>
            <div className="assignment-existing-submission__files">
              {existingSubmissionFiles.map((file) => (
                <button type="button" className="assignment-existing-submission__file" key={file.file_id} onClick={() => handleFileOpen(file)}>
                  <img src={pdfIcon} alt="" /><strong>{file.file_name}</strong>
                </button>
              ))}
            </div>
            {assignmentDetail.my_submission?.comment && <p>{assignmentDetail.my_submission.comment}</p>}
          </section>
        )}

        <section className="assignment-detail__attachments">
          <div className="assignment-detail__attachments-title">
            <strong>
              첨부파일
            </strong>

            <span>
              {
                assignmentFiles
                  .length
              }
              개
            </span>
          </div>

          {assignmentFiles.length >
          0 ? (
            <div className="assignment-detail__file-list">
              {assignmentFiles.map(
                (file) => {
                  const fileSize =
                    getFileSizeText(
                      file,
                    );

                  return (
                    <button
                      type="button"
                      className="assignment-detail__file"
                      key={
                        file.file_id
                      }
                      onClick={() =>
                        handleFileOpen(
                          file,
                        )
                      }
                    >
                      <img
                        src={pdfIcon}
                        alt=""
                      />

                      <strong>
                        {
                          file.file_name
                        }
                      </strong>

                      {fileSize && (
                        <span>
                          (
                          {
                            fileSize
                          }
                          )
                        </span>
                      )}
                    </button>
                  );
                },
              )}
            </div>
          ) : (
            <p className="assignment-detail__no-files">
              첨부파일이 없습니다.
            </p>
          )}
        </section>
      </article>
    );
  }

  function renderSubmission() {
    if (!assignmentDetail) {
      return null;
    }

    return (
      <article className="assignment-submit-view">
        <button
          type="button"
          className="assignment-submit-view__title"
          onClick={
            handleBackFromSubmission
          }
        >
          {
            assignmentDetail
              .title
          }
        </button>

        <div className="assignment-submit-view__meta">
          <span>
            {formatDate(
              assignmentDetail
                .created_at,
            )}
          </span>

          <span>·</span>

          <span>
            {
              assignmentDetail
                .writer_name
            }
          </span>
        </div>

        <div className="assignment-submit-view__divider" />

        <section className="assignment-submit-form">
          <div className="assignment-submit-field">
            <label>
              제출 기한
            </label>

            <div className="assignment-submit-field__control assignment-submit-field__deadline">
              {formatDeadline(
                assignmentDetail
                  .due_at,
              )}
            </div>
          </div>

          <div className="assignment-submit-field">
            <label>
              첨부 파일
            </label>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={
                handleFileChange
              }
            />

            <button
              type="button"
              className="assignment-file-dropzone"
              onClick={
                handleOpenFilePicker
              }
              onDrop={
                handleDrop
              }
              onDragOver={
                handleDragOver
              }
            >
              <span>
                파일을 선택하거나 여기로 끌어다 놓으세요.
              </span>

              <strong>
                파일 첨부
              </strong>
            </button>
          </div>

          {isResubmission &&
            existingSubmissionFiles
              .length > 0 && (
              <div className="assignment-existing-submission">
                <div className="assignment-existing-submission__header">
                  <span>
                    현재 제출 파일
                  </span>

                  <small>
                    재제출 시 새 제출 내용으로 덮어씁니다.
                  </small>
                </div>

                <div className="assignment-existing-submission__files">
                  {existingSubmissionFiles.map(
                    (file) => {
                      const fileSize =
                        getFileSizeText(
                          file,
                        );

                      return (
                        <button
                          type="button"
                          className="assignment-existing-submission__file"
                          key={
                            file.file_id
                          }
                          onClick={() =>
                            handleFileOpen(
                              file,
                            )
                          }
                        >
                          <img
                            src={pdfIcon}
                            alt=""
                          />

                          <div>
                            <strong>
                              {
                                file.file_name
                              }
                            </strong>

                            {fileSize && (
                              <span>
                                {
                                  fileSize
                                }
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            )}

          {submissionFiles.length >
            0 && (
            <div className="assignment-selected-files">
              {submissionFiles.map(
                (
                  file,
                  index,
                ) => (
                  <div
                    className="assignment-selected-file"
                    key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                  >
                    <img
                      src={pdfIcon}
                      alt=""
                      className="assignment-selected-file__icon"
                    />

                    <div className="assignment-selected-file__body">
                      <strong>
                        {
                          file.name
                        }
                      </strong>

                      <span>
                        {formatFileSize(
                          file.size,
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="assignment-selected-file__remove"
                      aria-label={`${file.name} 삭제`}
                      onClick={() =>
                        handleRemoveFile(
                          index,
                        )
                      }
                    >
                      <img
                        src={
                          closeIcon
                        }
                        alt=""
                      />
                    </button>
                  </div>
                ),
              )}
            </div>
          )}

          <div className="assignment-submit-field">
            <label
              htmlFor="assignment-submission-comment"
            >
              제출 설명
            </label>

            <textarea
              id="assignment-submission-comment"
              value={
                submissionComment
              }
              placeholder="제출과 관련해 교수님께 전달할 내용을 입력해주세요."
              onChange={(event) =>
                setSubmissionComment(
                  event.target.value,
                )
              }
            />
          </div>

          {submitError && (
            <p
              className="assignment-submit-error"
              role="alert"
            >
              {submitError}
            </p>
          )}

          <div className="assignment-submit-actions">
            <p>
              마감 전까지 제출 파일을 수정할 수 있어요.
            </p>

            <button
              type="button"
              disabled={
                isSubmitting
              }
              onClick={
                handleRequestSubmit
              }
            >
              {isResubmission
                ? "재제출하기"
                : "제출하기"}
            </button>
          </div>
        </section>
      </article>
    );
  }

  return (
    <main className="assignment-page">
      <div className="app-frame assignment-frame">
        

        <section className="assignment-layout">
          <aside className="assignment-list-panel">
            <div className="assignment-list-panel__header">
              <span>
                마감순
              </span>

              <strong>
                미제출{" "}
                {
                  summary
                    .not_submitted_count
                }
              </strong>
            </div>

            <div className="assignment-list-panel__divider" />

            {isListLoading ? (
              <div className="assignment-list-state is-loading">
                과제를 불러오는 중입니다.
              </div>
            ) : listError ? (
              <div className="assignment-list-state assignment-list-state--error">
                {listError}
              </div>
            ) : assignments.length ===
              0 ? (
              <div className="assignment-list-state">
                등록된 과제가 없습니다.
              </div>
            ) : (
              <div className="assignment-list">
                {assignments.map(
                  (assignment) => (
                    <button
                      type="button"
                      key={
                        assignment
                          .assignment_id
                      }
                      className={`assignment-list-item${
                        selectedAssignmentId ===
                        assignment
                          .assignment_id
                          ? " is-selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleSelectAssignment(
                          assignment,
                        )
                      }
                    >
                      <span
                        className={`assignment-list-item__dot ${getListDotClass(
                          assignment,
                        )}`}
                      />

                      <span className="assignment-list-item__body">
                        <strong>
                          {
                            assignment
                              .title
                          }
                        </strong>

                        <small>
                          {
                            assignment
                              .content_preview
                          }
                        </small>
                      </span>

                      <span className="assignment-list-item__status">
                        {getListStatusLabel(
                          assignment,
                        )}
                      </span>
                    </button>
                  ),
                )}
              </div>
            )}
          </aside>

          <section className="assignment-right-panel">
            {!readOnly && pageMode === "submit"
              ? renderSubmission()
              : renderDetail()}
          </section>
        </section>

        <AssignmentSubmitModal
          type={
            modalStep ===
            "success"
              ? "success"
              : "confirm"
          }
          isOpen={
            modalStep !== null
          }
          isSubmitting={
            isSubmitting
          }
          onCancel={
            handleCancelSubmit
          }
          onConfirm={
            modalStep ===
            "success"
              ? handleSubmitSuccess
              : handleConfirmSubmit
          }
        />
      </div>
    </main>
  );
}

export default StudentAssignmentPage;
