import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import backIcon from "../../../assets/icons/go-back.svg";
import assignmentEmptyIcon from "../../../assets/icons/assignment-empty.svg";
import DeleteIcon from "../../../assets/icons/delete.svg?react";
import noticeCreateIcon from "../../../assets/icons/notice-create.svg";
import pdfIcon from "../../../assets/icons/pdf.svg";
import PencilEditIcon from "../../../assets/icons/pencil-edit.svg?react";
import moreIcon from "../../../assets/icons/space/space-more.svg";

import {
  AppToolbars,
} from "../../../components/common/AppToolbars.jsx";

import SpaceToolbar from "../../spaces/components/SpaceToolbar.jsx";

import {
  closeAssignment,
  getAssignmentDetail,
  getAssignmentSummary,
  getSpaceAssignments,
} from "../api/assignmentsApi.js";

import AssignmentCloseModal from "../components/AssignmentCloseModal.jsx";

import "../styles/studentAssignments.css";
import "../styles/professorAssignments.css";

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

function formatFileSize(size) {
  const numericSize =
    Number(size);

  if (
    !Number.isFinite(
      numericSize,
    ) ||
    numericSize <= 0
  ) {
    return "";
  }

  const megabytes =
    numericSize /
    (1024 * 1024);

  if (megabytes >= 1) {
    return `${megabytes.toFixed(
      1,
    )} MB`;
  }

  const kilobytes =
    numericSize / 1024;

  return `${Math.max(
    1,
    Math.round(
      kilobytes,
    ),
  )} KB`;
}

function getFileSizeText(
  file,
) {
  if (!file) {
    return "";
  }

  if (
    file.file_size_text
  ) {
    return file.file_size_text;
  }

  if (
    file.fileSizeText
  ) {
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

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return `${date.getFullYear()}. ${
    date.getMonth() + 1
  }. ${date.getDate()}`;
}

function formatShortDeadline(
  value,
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return `${date.getFullYear()}.${
    date.getMonth() + 1
  }.${date.getDate()}`;
}

function getDdayLabel(
  assignment,
) {
  if (
    assignment.status ===
    "CLOSED"
  ) {
    return "마감";
  }

  if (!assignment.due_at) {
    return "";
  }

  const dueDate =
    new Date(
      assignment.due_at,
    );

  if (
    Number.isNaN(
      dueDate.getTime(),
    )
  ) {
    return "";
  }

  const today =
    new Date();

  const todayStart =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

  const dueStart =
    new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate(),
    );

  const dayDifference =
    Math.round(
      (
        dueStart.getTime() -
        todayStart.getTime()
      ) /
        (
          1000 *
          60 *
          60 *
          24
        ),
    );

  if (
    dayDifference === 0
  ) {
    return "D-Day";
  }

  if (
    dayDifference > 0
  ) {
    return `D-${dayDifference}`;
  }

  return `D+${Math.abs(
    dayDifference,
  )}`;
}

function getListDotClass(
  assignment,
) {
  if (
    assignment.status ===
    "CLOSED"
  ) {
    return "is-closed";
  }

  return "is-active";
}

function AssignmentEmptyState() {
  return (
    <div className="assignment-empty">
      <div
        className="assignment-empty__icon"
        aria-hidden="true"
      >
        <img
          src={
            assignmentEmptyIcon
          }
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

function ProfessorAssignmentPage() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    spaceId,
  } = useParams();

  const spaceName =
    location.state
      ?.spaceName ??
    "실무중심산학협력프로젝트1";

  const [
    assignments,
    setAssignments,
  ] = useState([]);

  const [
    summary,
    setSummary,
  ] = useState({
    before_deadline_count: 0,
    grading_pending_count: 0,
  });

  const [
    selectedAssignmentId,
    setSelectedAssignmentId,
  ] = useState(null);

  const [
    assignmentDetail,
    setAssignmentDetail,
  ] = useState(null);

  const [
    isAssignmentMenuOpen,
    setIsAssignmentMenuOpen,
  ] = useState(false);

  const [
    isListLoading,
    setIsListLoading,
  ] = useState(true);

  const [
    isDetailLoading,
    setIsDetailLoading,
  ] = useState(false);

  const [
    isClosing,
    setIsClosing,
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
    closeError,
    setCloseError,
  ] = useState("");

  const [
    modalStep,
    setModalStep,
  ] = useState(null);

  useEffect(() => {
    if (!spaceId) {
      return undefined;
    }

    const controller =
      new AbortController();

    async function loadAssignments() {
      setIsListLoading(
        true,
      );

      setListError("");

      try {
        const [
          assignmentResponse,
          summaryResponse,
        ] =
          await Promise.all([
            getSpaceAssignments(
              spaceId,
              {
                signal:
                  controller
                    .signal,
              },
            ),

            getAssignmentSummary(
              spaceId,
              {
                signal:
                  controller
                    .signal,
              },
            ),
          ]);

        if (
          controller.signal
            .aborted
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
          before_deadline_count:
            Number(
              summaryResponse
                ?.before_deadline_count,
            ) || 0,

          grading_pending_count:
            Number(
              summaryResponse
                ?.grading_pending_count,
            ) || 0,
        });
      } catch (error) {
        if (
          error?.code ===
            "ERR_CANCELED" ||
          controller.signal
            .aborted
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
          !controller.signal
            .aborted
        ) {
          setIsListLoading(
            false,
          );
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
    ] =
      await Promise.all([
        getSpaceAssignments(
          spaceId,
        ),

        getAssignmentSummary(
          spaceId,
        ),
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
      before_deadline_count:
        Number(
          summaryResponse
            ?.before_deadline_count,
        ) || 0,

      grading_pending_count:
        Number(
          summaryResponse
            ?.grading_pending_count,
        ) || 0,
    });
  }

  async function handleSelectAssignment(
    assignment,
  ) {
    if (
      !assignment
        ?.assignment_id ||
      isDetailLoading
    ) {
      return;
    }

    const assignmentId =
      assignment
        .assignment_id;

    setSelectedAssignmentId(
      assignmentId,
    );

    setAssignmentDetail(
      null,
    );

    setIsAssignmentMenuOpen(
      false,
    );

    setDetailError("");
    setCloseError("");
    setModalStep(null);

    setIsDetailLoading(
      true,
    );

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
            (item) =>
              item.assignment_id ===
              assignmentId
                ? {
                    ...item,

                    status:
                      detail
                        ?.status ??
                      item.status,

                    grading_status:
                      detail
                        ?.grading_status,

                    close_type:
                      detail
                        ?.close_type ??
                      item.close_type,
                  }
                : item,
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
      setIsDetailLoading(
        false,
      );
    }
  }

  function handleRequestClose() {
    if (
      !assignmentDetail ||
      assignmentDetail
        .status !== "OPEN" ||
      isClosing
    ) {
      return;
    }

    setCloseError("");

    setModalStep(
      "confirm",
    );
  }

  function handleCancelClose() {
    if (isClosing) {
      return;
    }

    setModalStep(null);
  }

  async function handleConfirmClose() {
    if (
      !assignmentDetail ||
      assignmentDetail
        .status !== "OPEN" ||
      isClosing
    ) {
      return;
    }

    const assignmentId =
      assignmentDetail
        .assignment_id;

    setIsClosing(true);
    setCloseError("");

    try {
      await closeAssignment(
        assignmentId,
      );

      const detail =
        await getAssignmentDetail(
          assignmentId,
        );

      setAssignmentDetail(
        detail,
      );

      await refreshListData();

      setModalStep(
        "success",
      );
    } catch (error) {
      setModalStep(null);

      setCloseError(
        getApiErrorMessage(
          error,
          "과제 마감에 실패했습니다.",
        ),
      );
    } finally {
      setIsClosing(
        false,
      );
    }
  }

  function handleCloseSuccess() {
    setModalStep(null);
  }

  function handleFileOpen(
    file,
  ) {
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

  const assignmentFiles =
    Array.isArray(
      assignmentDetail
        ?.files,
    )
      ? assignmentDetail
          .files
      : [];

  function renderDetail() {
    if (
      isDetailLoading
    ) {
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

    if (
      !assignmentDetail
    ) {
      return (
        <>
          <div className="assignment-detail-intro">
            <h2>
              과제
            </h2>

            <p>
              과제와 제출 현황을 확인하세요.
            </p>
          </div>

          <div className="assignment-detail-divider assignment-detail-divider--header" />

          <AssignmentEmptyState />
        </>
      );
    }

    const isOpen =
      assignmentDetail
        .status === "OPEN";

    return (
      <article className="assignment-detail professor-assignment-detail">
        <div className="professor-assignment-detail__menu-wrapper">
          <button
            type="button"
            className={`professor-assignment-detail__more${
              isAssignmentMenuOpen
                ? " is-active"
                : ""
            }`}
            aria-label="과제 더보기"
            aria-expanded={
              isAssignmentMenuOpen
            }
            onClick={() =>
              setIsAssignmentMenuOpen(
                (current) =>
                  !current,
              )
            }
          >
            <img
              src={moreIcon}
              alt=""
            />
          </button>

          {isAssignmentMenuOpen && (
            <div className="professor-assignment-detail-menu">
              <button
                type="button"
                onClick={() =>
                  setIsAssignmentMenuOpen(
                    false,
                  )
                }
              >
                <PencilEditIcon
                  aria-hidden="true"
                />

                <span>
                  수정
                </span>
              </button>

              <button
                type="button"
                className="professor-assignment-detail-menu__delete"
                onClick={() =>
                  setIsAssignmentMenuOpen(
                    false,
                  )
                }
              >
                <DeleteIcon
                  aria-hidden="true"
                />

                <span>
                  삭제
                </span>
              </button>
            </div>
          )}
        </div>

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

          <span>
            ·
          </span>

          <span>
            {
              assignmentDetail
                .writer_name
            }
          </span>

          <span>
            ·
          </span>

          <span>
            조회{" "}
            {
              Number(
                assignmentDetail
                  .view_count,
              ) || 0
            }
            회
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

        <div className="assignment-detail__body professor-assignment-detail__body">
          {
            assignmentDetail
              .description
          }
        </div>

        {isOpen && (
          <button
            type="button"
            className="assignment-detail__submit-button"
            disabled={
              isClosing
            }
            onClick={
              handleRequestClose
            }
          >
            제출 마감하기
          </button>
        )}

        {closeError && (
          <p
            className="professor-assignment-close-error"
            role="alert"
          >
            {closeError}
          </p>
        )}

        <div className="assignment-detail-divider assignment-detail-divider--attachments" />

        <section className="professor-assignment-attachments">
          <div className="professor-assignment-attachments__header">
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

          {assignmentFiles
            .length > 0 ? (
            <div className="professor-assignment-attachments__list">
              {assignmentFiles.map(
                (file) => {
                  const fileSize =
                    getFileSizeText(
                      file,
                    );

                  return (
                    <button
                      type="button"
                      className="professor-assignment-attachments__file"
                      key={
                        file.file_id ??
                        file.file_name
                      }
                      onClick={() =>
                        handleFileOpen(
                          file,
                        )
                      }
                    >
                      <img
                        src={
                          pdfIcon
                        }
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

  return (
    <main className="assignment-page professor-assignment-page">
      <div className="app-frame assignment-frame">
        <button
          type="button"
          className="assignment-back"
          aria-label="Space 목록으로 돌아가기"
          onClick={() =>
            navigate(
              "/spaces",
            )
          }
        >
          <img
            src={backIcon}
            alt=""
          />
        </button>

        <header className="assignment-header">
          <h1>
            {spaceName}
          </h1>

          <p>
            과제
          </p>
        </header>

        <AppToolbars
          showBottomNavigation={
            false
          }
          onSearch={() =>
            navigate(
              "/search",
            )
          }
        />

        <section className="assignment-layout">
          <aside className="assignment-list-panel">
            <div className="assignment-list-panel__header">
              <span>
                마감순
              </span>

              <strong className="professor-assignment-summary">
                <span>
                  마감 전{" "}
                  {
                    summary
                      .before_deadline_count
                  }
                </span>

                <i>
                  ·
                </i>

                <span>
                  채점 전{" "}
                  {
                    summary
                      .grading_pending_count
                  }
                </span>
              </strong>
            </div>

            <div className="assignment-list-panel__divider" />

            {isListLoading ? (
              <div className="assignment-list-state">
                과제를 불러오는 중입니다.
              </div>
            ) : listError ? (
              <div className="assignment-list-state assignment-list-state--error">
                {listError}
              </div>
            ) : assignments
                .length ===
              0 ? (
              <div className="assignment-list-state">
                등록된 과제가 없습니다.
              </div>
            ) : (
              <div className="assignment-list">
                {assignments.map(
                  (
                    assignment,
                  ) => (
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
                        {getDdayLabel(
                          assignment,
                        )}
                      </span>
                    </button>
                  ),
                )}
              </div>
            )}

            <button
              type="button"
              className="professor-assignment-create-button"
              aria-label="과제 작성"
            >
              <img
                src={
                  noticeCreateIcon
                }
                alt=""
              />
            </button>
          </aside>

          <section className="assignment-right-panel">
            {renderDetail()}
          </section>
        </section>

        <SpaceToolbar
          activeItem="assignment"
        />

        <AssignmentCloseModal
          type={
            modalStep ===
            "success"
              ? "success"
              : "confirm"
          }
          isOpen={
            modalStep !== null
          }
          isClosing={
            isClosing
          }
          onCancel={
            handleCancelClose
          }
          onConfirm={
            modalStep ===
            "success"
              ? handleCloseSuccess
              : handleConfirmClose
          }
        />
      </div>
    </main>
  );
}

export default ProfessorAssignmentPage;