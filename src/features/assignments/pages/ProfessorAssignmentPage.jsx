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
  createAssignment,
  deleteAssignment,
  getAssignmentDetail,
  getAssignmentSummary,
  getSpaceAssignments,
  updateAssignment,
} from "../api/assignmentsApi.js";

import AssignmentCloseModal from "../components/AssignmentCloseModal.jsx";
import AssignmentEditorForm from "../components/AssignmentEditorForm.jsx";
import AssignmentGradePanel from "../components/AssignmentGradePanel.jsx";
import AssignmentManageModal from "../components/AssignmentManageModal.jsx";

import "../styles/studentAssignments.css";
import "../styles/professorAssignments.css";
import "../styles/professorAssignmentGrades.css";

async function fetchProfessorSpaceAssignments(
  spaceId,
  config = {},
) {
  return getSpaceAssignments(
    spaceId,
    config,
  );
}

async function fetchProfessorAssignmentSummary(
  spaceId,
  config = {},
) {
  return getAssignmentSummary(
    spaceId,
    config,
  );
}

async function fetchProfessorAssignmentDetail(
  assignmentId,
  config = {},
) {
  return getAssignmentDetail(
    assignmentId,
    config,
  );
}

async function createProfessorAssignment(
  spaceId,
  data,
  config = {},
) {
  return createAssignment(
    spaceId,
    data,
    config,
  );
}

async function updateProfessorAssignment(
  assignmentId,
  data,
  config = {},
) {
  return updateAssignment(
    assignmentId,
    data,
    config,
  );
}

async function removeProfessorAssignment(
  assignmentId,
  config = {},
) {
  return deleteAssignment(
    assignmentId,
    config,
  );
}

async function closeProfessorAssignment(
  assignmentId,
  config = {},
) {
  return closeAssignment(
    assignmentId,
    config,
  );
}

function getApiErrorMessage(
  error,
  fallbackMessage,
) {
  return (
    error?.response?.data
      ?.message ??
    error?.response?.data
      ?.detail ??
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

function isPastDue(
  dueAt,
) {
  if (!dueAt) {
    return false;
  }

  const dueDate =
    new Date(dueAt);

  if (
    Number.isNaN(
      dueDate.getTime(),
    )
  ) {
    return false;
  }

  return (
    dueDate.getTime() <
    Date.now()
  );
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

  if (
    assignment.close_type ===
      "MANUAL" &&
    isPastDue(
      assignment.due_at,
    )
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
    "Space";

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
    viewMode,
    setViewMode,
  ] = useState(
    "detail",
  );

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
    listError,
    setListError,
  ] = useState("");

  const [
    detailError,
    setDetailError,
  ] = useState("");

  const [
    manageError,
    setManageError,
  ] = useState("");

  const [
    isManaging,
    setIsManaging,
  ] = useState(false);

  const [
    manageModalAction,
    setManageModalAction,
  ] = useState(null);

  const [
    manageModalStep,
    setManageModalStep,
  ] = useState(
    "confirm",
  );

  const [
    pendingSaveData,
    setPendingSaveData,
  ] = useState(null);

  const [
    isClosing,
    setIsClosing,
  ] = useState(false);

  const [
    closeError,
    setCloseError,
  ] = useState("");

  const [
    closeModalStep,
    setCloseModalStep,
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
            fetchProfessorSpaceAssignments(
              spaceId,
              {
                signal:
                  controller
                    .signal,
              },
            ),

            fetchProfessorAssignmentSummary(
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
        fetchProfessorSpaceAssignments(
          spaceId,
        ),

        fetchProfessorAssignmentSummary(
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
      isDetailLoading ||
      isManaging
    ) {
      return;
    }

    const assignmentId =
      assignment.assignment_id;

    setSelectedAssignmentId(
      assignmentId,
    );

    setAssignmentDetail(
      null,
    );

    setViewMode(
      "detail",
    );

    setIsAssignmentMenuOpen(
      false,
    );

    setDetailError("");
    setManageError("");
    setCloseError("");

    setManageModalAction(
      null,
    );

    setPendingSaveData(
      null,
    );

    setCloseModalStep(
      null,
    );

    setIsDetailLoading(
      true,
    );

    try {
      const detail =
        await fetchProfessorAssignmentDetail(
          assignmentId,
        );

      setAssignmentDetail({
        ...detail,
        close_type:
          detail?.close_type ??
          assignment.close_type,
      });

      setAssignments(
        (current) =>
          current.map(
            (item) =>
              item.assignment_id ===
              assignmentId
                ? {
                    ...item,

                    title:
                      detail
                        ?.title ??
                      item.title,

                    content_preview:
                      detail
                        ?.content_preview ??
                      item.content_preview,

                    due_at:
                      detail
                        ?.due_at ??
                      item.due_at,

                    close_type:
                      detail
                        ?.close_type ??
                      item.close_type,

                    status:
                      detail
                        ?.status ??
                      item.status,

                    grading_status:
                      detail
                        ?.grading_status ??
                      item.grading_status,
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

  function handleOpenCreate() {
    if (
      isManaging ||
      isClosing
    ) {
      return;
    }

    setViewMode(
      "create",
    );

    setIsAssignmentMenuOpen(
      false,
    );

    setDetailError("");
    setManageError("");
    setCloseError("");

    setManageModalAction(
      null,
    );

    setManageModalStep(
      "confirm",
    );

    setPendingSaveData(
      null,
    );
  }

  function handleOpenEdit() {
    if (
      !assignmentDetail ||
      isManaging ||
      isClosing
    ) {
      return;
    }

    setIsAssignmentMenuOpen(
      false,
    );

    setManageError("");
    setCloseError("");

    setViewMode(
      "edit",
    );
  }

  function handleOpenGrade() {
    if (
      !assignmentDetail ||
      assignmentDetail.status !==
        "CLOSED" ||
      assignmentDetail
        .grading_status !==
        "DRAFT"
    ) {
      return;
    }

    setIsAssignmentMenuOpen(
      false,
    );

    setManageError("");
    setCloseError("");
    setDetailError("");

    setViewMode(
      "grade",
    );
  }

  function handleOpenGradeEdit() {
    if (
      !assignmentDetail ||
      assignmentDetail
        .grading_status !==
        "FINALIZED"
    ) {
      return;
    }

    setIsAssignmentMenuOpen(
      false,
    );

    setManageError("");
    setCloseError("");
    setDetailError("");

    setViewMode(
      "grade-edit",
    );
  }

  function handleCloseGradePanel() {
    setViewMode(
      "detail",
    );
  }

  function handleGradeSaved(
    nextAssignment,
  ) {
    setAssignmentDetail(
      (current) =>
        current
          ? {
              ...current,
              ...nextAssignment,
            }
          : current,
    );

    setAssignments(
      (current) =>
        current.map(
          (assignment) =>
            assignment.assignment_id ===
            selectedAssignmentId
              ? {
                  ...assignment,
                  ...nextAssignment,
                }
              : assignment,
        ),
    );

    setViewMode(
      "detail",
    );
  }

  function handleRequestDelete() {
    if (
      !assignmentDetail ||
      isManaging ||
      isClosing
    ) {
      return;
    }

    setIsAssignmentMenuOpen(
      false,
    );

    setManageError("");

    setManageModalAction(
      "delete",
    );

    setManageModalStep(
      "confirm",
    );

    setPendingSaveData(
      null,
    );
  }

  function handleRequestSave(
    data,
  ) {
    if (
      isManaging ||
      isClosing
    ) {
      return;
    }

    const action =
      viewMode === "edit"
        ? "edit"
        : "create";

    setPendingSaveData(
      data,
    );

    setManageError("");

    setManageModalAction(
      action,
    );

    setManageModalStep(
      "confirm",
    );
  }

  function handleCancelManage() {
    if (isManaging) {
      return;
    }

    setManageModalAction(
      null,
    );

    setManageModalStep(
      "confirm",
    );

    setPendingSaveData(
      null,
    );
  }

  async function handleConfirmManage() {
    if (
      !manageModalAction ||
      isManaging
    ) {
      return;
    }

    setIsManaging(true);
    setManageError("");

    try {
      if (
        manageModalAction ===
        "create"
      ) {
        if (
          !pendingSaveData
        ) {
          return;
        }

        const created =
          await createProfessorAssignment(
            spaceId,
            pendingSaveData,
          );

        const createdId =
          created
            ?.assignment_id;

        if (createdId) {
          setSelectedAssignmentId(
            createdId,
          );

          let nextDetail =
            created;

          try {
            nextDetail =
              await fetchProfessorAssignmentDetail(
                createdId,
              );
          } catch {
            nextDetail =
              created;
          }

          setAssignmentDetail({
            ...nextDetail,
            close_type:
              nextDetail?.close_type ??
              created?.close_type ??
              pendingSaveData.closeType,
          });
        }

        try {
          await refreshListData();
        } catch {
          setListError(
            "과제 목록을 새로 불러오지 못했습니다.",
          );
        }

        setManageModalStep(
          "success",
        );

        return;
      }

      if (
        manageModalAction ===
        "edit"
      ) {
        if (
          !assignmentDetail
            ?.assignment_id ||
          !pendingSaveData
        ) {
          return;
        }

        const assignmentId =
          assignmentDetail
            .assignment_id;

        const updated =
          await updateProfessorAssignment(
            assignmentId,
            pendingSaveData,
          );

        let nextDetail =
          updated;

        try {
          nextDetail =
            await fetchProfessorAssignmentDetail(
              assignmentId,
            );
        } catch {
          nextDetail = {
            ...assignmentDetail,
            ...updated,
          };
        }

        setAssignmentDetail({
          ...nextDetail,
          close_type:
            nextDetail?.close_type ??
            updated?.close_type ??
            pendingSaveData.closeType,
        });

        try {
          await refreshListData();
        } catch {
          setListError(
            "과제 목록을 새로 불러오지 못했습니다.",
          );
        }

        setManageModalStep(
          "success",
        );

        return;
      }

      if (
        manageModalAction ===
        "delete"
      ) {
        if (
          !assignmentDetail
            ?.assignment_id
        ) {
          return;
        }

        await removeProfessorAssignment(
          assignmentDetail
            .assignment_id,
        );

        try {
          await refreshListData();
        } catch {
          setListError(
            "과제 목록을 새로 불러오지 못했습니다.",
          );
        }

        setManageModalStep(
          "success",
        );
      }
    } catch (error) {
      const fallbackMessage =
        manageModalAction ===
        "create"
          ? "과제 등록에 실패했습니다."
          : manageModalAction ===
              "edit"
            ? "과제 수정에 실패했습니다."
            : "과제 삭제에 실패했습니다.";

      setManageError(
        getApiErrorMessage(
          error,
          fallbackMessage,
        ),
      );

      setManageModalAction(
        null,
      );

      setManageModalStep(
        "confirm",
      );
    } finally {
      setIsManaging(
        false,
      );
    }
  }

  function handleManageSuccess() {
    const completedAction =
      manageModalAction;

    setManageModalAction(
      null,
    );

    setManageModalStep(
      "confirm",
    );

    setPendingSaveData(
      null,
    );

    if (
      completedAction ===
      "delete"
    ) {
      setSelectedAssignmentId(
        null,
      );

      setAssignmentDetail(
        null,
      );

      setViewMode(
        "detail",
      );

      setManageError("");

      return;
    }

    if (
      completedAction ===
        "create" ||
      completedAction ===
        "edit"
    ) {
      setViewMode(
        "detail",
      );

      setManageError("");
    }
  }

  function handleRequestClose() {
    if (
      !assignmentDetail ||
      assignmentDetail
        .status !== "OPEN" ||
      isClosing ||
      isManaging
    ) {
      return;
    }

    setCloseError("");

    setCloseModalStep(
      "confirm",
    );
  }

  function handleCancelClose() {
    if (isClosing) {
      return;
    }

    setCloseModalStep(
      null,
    );
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

    setIsClosing(
      true,
    );

    setCloseError("");

    try {
      await closeProfessorAssignment(
        assignmentId,
      );

      let nextDetail = {
        ...assignmentDetail,
        status: "CLOSED",
        grading_status:
          assignmentDetail
            .grading_status ??
          "DRAFT",
      };

      try {
        nextDetail =
          await fetchProfessorAssignmentDetail(
            assignmentId,
          );
      } catch {
        nextDetail = {
          ...assignmentDetail,
          status:
            "CLOSED",
          grading_status:
            assignmentDetail
              .grading_status ??
            "DRAFT",
        };
      }

      setAssignmentDetail({
        ...nextDetail,
        close_type:
          nextDetail?.close_type ??
          assignmentDetail.close_type,
      });

      setAssignments(
        (current) =>
          current.map(
            (assignment) =>
              assignment
                .assignment_id ===
              assignmentId
                ? {
                    ...assignment,
                    status:
                      "CLOSED",
                    grading_status:
                      nextDetail
                        ?.grading_status ??
                      "DRAFT",
                  }
                : assignment,
          ),
      );

      try {
        await refreshListData();
      } catch {
        setListError(
          "과제 목록을 새로 불러오지 못했습니다.",
        );
      }

      setCloseModalStep(
        "success",
      );
    } catch (error) {
      setCloseModalStep(
        null,
      );

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
    setCloseModalStep(
      null,
    );
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

  function renderEditor() {
    const isEdit =
      viewMode ===
      "edit";

    if (
      isEdit &&
      !assignmentDetail
    ) {
      return (
        <div className="assignment-panel-state">
          수정할 과제를 선택해주세요.
        </div>
      );
    }

    return (
      <section className="professor-assignment-editor-page">
        <div className="professor-assignment-editor-page__header">
          <h2>
            {isEdit
              ? "과제 수정"
              : "과제 등록"}
          </h2>

          <p>
            {isEdit
              ? "과제를 수정하고 학생들에게 안내하세요."
              : "새 과제를 만들고 학생들에게 안내하세요."}
          </p>
        </div>

        <div className="professor-assignment-editor-page__divider" />

        <AssignmentEditorForm
          key={
            isEdit
              ? `edit-${assignmentDetail?.assignment_id}`
              : "create-assignment"
          }
          mode={
            isEdit
              ? "edit"
              : "create"
          }
          assignment={
            isEdit
              ? assignmentDetail
              : null
          }
          isSaving={
            isManaging
          }
          onRequestSave={
            handleRequestSave
          }
        />

        {manageError && (
          <p
            className="professor-assignment-editor-page__error"
            role="alert"
          >
            {manageError}
          </p>
        )}
      </section>
    );
  }

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

    const canGrade =
      assignmentDetail
        .status ===
        "CLOSED" &&
      assignmentDetail
        .grading_status ===
        "DRAFT";

    const canEditGrade =
      assignmentDetail
        .grading_status ===
      "FINALIZED";

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
                onClick={
                  handleOpenEdit
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
                onClick={
                  handleRequestDelete
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
              isClosing ||
              isManaging
            }
            onClick={
              handleRequestClose
            }
          >
            제출 마감하기
          </button>
        )}

        {canGrade && (
          <button
            type="button"
            className="assignment-detail__submit-button"
            disabled={
              isClosing ||
              isManaging
            }
            onClick={
              handleOpenGrade
            }
          >
            채점하러 가기
          </button>
        )}

        {canEditGrade && (
          <button
            type="button"
            className="assignment-detail__submit-button"
            disabled={
              isClosing ||
              isManaging
            }
            onClick={
              handleOpenGradeEdit
            }
          >
            성적 수정하기
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

        {manageError && (
          <p
            className="professor-assignment-manage-error"
            role="alert"
          >
            {manageError}
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

  function renderRightPanel() {
    if (
      viewMode ===
        "create" ||
      viewMode ===
        "edit"
    ) {
      return renderEditor();
    }

    return renderDetail();
  }

  const isGradingView =
    viewMode === "grade" ||
    viewMode === "grade-edit";

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

        <section
          className={`assignment-layout${
            isGradingView
              ? " assignment-layout--grading"
              : ""
          }`}
        >
          {isGradingView ? (
            <AssignmentGradePanel
              key={`${viewMode}-${assignmentDetail?.assignment_id}`}
              assignment={
                assignmentDetail
              }
              mode={
                viewMode
              }
              onCancel={
                handleCloseGradePanel
              }
              onFinalized={
                handleGradeSaved
              }
              onEditSaved={
                handleGradeSaved
              }
            />
          ) : (
            <>
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
                  onClick={
                    handleOpenCreate
                  }
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
                {renderRightPanel()}
              </section>
            </>
          )}
        </section>

        <SpaceToolbar
          activeItem="assignment"
          spaceId={spaceId}
          spaceName={spaceName}
        />

        <AssignmentCloseModal
          type={
            closeModalStep ===
            "success"
              ? "success"
              : "confirm"
          }
          isOpen={
            closeModalStep !==
            null
          }
          isClosing={
            isClosing
          }
          onCancel={
            handleCancelClose
          }
          onConfirm={
            closeModalStep ===
            "success"
              ? handleCloseSuccess
              : handleConfirmClose
          }
        />

        <AssignmentManageModal
          action={
            manageModalAction ??
            "create"
          }
          step={
            manageModalStep
          }
          isOpen={
            manageModalAction !==
            null
          }
          isProcessing={
            isManaging
          }
          onCancel={
            handleCancelManage
          }
          onConfirm={
            manageModalStep ===
            "success"
              ? handleManageSuccess
              : handleConfirmManage
          }
        />
      </div>
    </main>
  );
}

export default ProfessorAssignmentPage;
