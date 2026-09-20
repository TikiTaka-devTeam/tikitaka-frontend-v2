import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import chevronDownIcon from "../../../assets/icons/chevron-down.svg";
import chevronUpIcon from "../../../assets/icons/chevron-up.svg";
import closeIcon from "../../../assets/icons/close.svg";
import pdfIcon from "../../../assets/icons/pdf.svg";

const WEEKDAYS = [
  "일",
  "월",
  "화",
  "수",
  "목",
  "금",
  "토",
];

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatFileSize(size) {
  const numericSize = Number(size);

  if (
    !Number.isFinite(numericSize) ||
    numericSize <= 0
  ) {
    return "";
  }

  const megabytes =
    numericSize / (1024 * 1024);

  if (megabytes >= 1) {
    return `${megabytes.toFixed(1)} MB`;
  }

  const kilobytes =
    numericSize / 1024;

  return `${Math.max(
    1,
    Math.round(kilobytes),
  )} KB`;
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

function toLocalDateTimeString(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${pad2(
    date.getMonth() + 1,
  )}-${pad2(
    date.getDate(),
  )}T${pad2(
    date.getHours(),
  )}:${pad2(date.getMinutes())}`;
}

function parseLocalDateTime(value) {
  if (!value) {
    return null;
  }

  const [
    datePart,
    timePart = "23:59",
  ] = value.split("T");

  const [year, month, day] =
    datePart.split("-").map(Number);

  const [hour = 23, minute = 59] =
    timePart.split(":").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0,
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatLocalDateTime(date) {
  return `${date.getFullYear()}-${pad2(
    date.getMonth() + 1,
  )}-${pad2(
    date.getDate(),
  )}T${pad2(
    date.getHours(),
  )}:${pad2(date.getMinutes())}`;
}

function formatDateDisplay(value) {
  const date =
    parseLocalDateTime(value);

  if (!date) {
    return "";
  }

  return `${date.getFullYear()}. ${pad2(
    date.getMonth() + 1,
  )}. ${pad2(
    date.getDate(),
  )} (${WEEKDAYS[date.getDay()]}) ${pad2(
    date.getHours(),
  )}:${pad2(date.getMinutes())}`;
}

function toOffsetIso(value) {
  const date =
    parseLocalDateTime(value);

  if (!date) {
    return "";
  }

  const timezoneOffset =
    -date.getTimezoneOffset();

  const sign =
    timezoneOffset >= 0
      ? "+"
      : "-";

  const absoluteOffset =
    Math.abs(timezoneOffset);

  const offsetHours = pad2(
    Math.floor(absoluteOffset / 60),
  );

  const offsetMinutes = pad2(
    absoluteOffset % 60,
  );

  return `${date.getFullYear()}-${pad2(
    date.getMonth() + 1,
  )}-${pad2(
    date.getDate(),
  )}T${pad2(
    date.getHours(),
  )}:${pad2(
    date.getMinutes(),
  )}:00${sign}${offsetHours}:${offsetMinutes}`;
}

function AssignmentEditorForm({
  mode = "create",
  assignment = null,
  isSaving = false,
  onRequestSave,
}) {
  const isEdit =
    mode === "edit";

  const fileInputRef =
    useRef(null);

  const editorRef =
    useRef(null);

  const dateDropdownRef =
    useRef(null);

  const closeTypeDropdownRef =
    useRef(null);

  const initialDueAt =
    isEdit
      ? toLocalDateTimeString(
          assignment?.due_at,
        )
      : "";

  const initialCalendarDate =
    parseLocalDateTime(initialDueAt) ??
    new Date();

  const [title, setTitle] =
    useState(
      () =>
        isEdit
          ? assignment?.title ?? ""
          : "",
    );

  const [dueAt, setDueAt] =
    useState(() => initialDueAt);

  const [
    closeType,
    setCloseType,
  ] = useState(
    () =>
      isEdit
        ? assignment?.close_type ?? ""
        : "",
  );

  const [
    description,
    setDescription,
  ] = useState(
    () =>
      isEdit
        ? assignment?.description ?? ""
        : "",
  );

  const [
    retainedFiles,
    setRetainedFiles,
  ] = useState(
    () =>
      isEdit &&
      Array.isArray(
        assignment?.files,
      )
        ? assignment.files
        : [],
  );

  const [
    newFiles,
    setNewFiles,
  ] = useState([]);

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    isDateOpen,
    setIsDateOpen,
  ] = useState(false);

  const [
    isCloseTypeOpen,
    setIsCloseTypeOpen,
  ] = useState(false);

  const [
    hasMoreBelow,
    setHasMoreBelow,
  ] = useState(false);

  const [
    calendarYear,
    setCalendarYear,
  ] = useState(
    initialCalendarDate.getFullYear(),
  );

  const [
    calendarMonth,
    setCalendarMonth,
  ] = useState(
    initialCalendarDate.getMonth(),
  );

  const finalTitle =
    isEdit
      ? assignment?.title ?? title
      : title;

  const canSubmit =
    Boolean(finalTitle?.trim()) &&
    Boolean(dueAt) &&
    Boolean(closeType) &&
    Boolean(description.trim());

  const updateScrollState =
    useCallback(() => {
      const element =
        editorRef.current;

      if (!element) {
        return;
      }

      const remaining =
        element.scrollHeight -
        element.scrollTop -
        element.clientHeight;

      const nextHasMoreBelow =
        element.scrollHeight >
          element.clientHeight + 1 &&
        remaining > 4;

      setHasMoreBelow(
        (current) =>
          current === nextHasMoreBelow
            ? current
            : nextHasMoreBelow,
      );
    }, []);

  const handleEditorRef =
    useCallback(
      (node) => {
        editorRef.current = node;

        if (!node) {
          return;
        }

        requestAnimationFrame(
          updateScrollState,
        );
      },
      [updateScrollState],
    );

  useEffect(() => {
    function handleOutsideClick(
      event,
    ) {
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(
          event.target,
        )
      ) {
        setIsDateOpen(false);
      }

      if (
        closeTypeDropdownRef.current &&
        !closeTypeDropdownRef.current.contains(
          event.target,
        )
      ) {
        setIsCloseTypeOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick,
      );
    };
  }, []);

  useEffect(() => {
    const element =
      editorRef.current;

    if (!element) {
      return undefined;
    }

    let frameId = null;

    const requestMeasure = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId =
        requestAnimationFrame(
          updateScrollState,
        );
    };

    const resizeObserver =
      new ResizeObserver(
        requestMeasure,
      );

    const mutationObserver =
      new MutationObserver(
        requestMeasure,
      );

    resizeObserver.observe(element);

    mutationObserver.observe(
      element,
      {
        childList: true,
        subtree: true,
      },
    );

    window.addEventListener(
      "resize",
      requestMeasure,
    );

    requestMeasure();

    return () => {
      if (frameId) {
        cancelAnimationFrame(
          frameId,
        );
      }

      resizeObserver.disconnect();
      mutationObserver.disconnect();

      window.removeEventListener(
        "resize",
        requestMeasure,
      );
    };
  }, [updateScrollState]);

  function handleToggleDate() {
    if (isSaving) {
      return;
    }

    const selectedDate =
      parseLocalDateTime(dueAt);

    const baseDate =
      selectedDate ?? new Date();

    setCalendarYear(
      baseDate.getFullYear(),
    );

    setCalendarMonth(
      baseDate.getMonth(),
    );

    setIsCloseTypeOpen(false);

    setIsDateOpen(
      (current) => !current,
    );
  }

  function handlePreviousMonth() {
    if (calendarMonth === 0) {
      setCalendarYear(
        (current) => current - 1,
      );

      setCalendarMonth(11);

      return;
    }

    setCalendarMonth(
      (current) => current - 1,
    );
  }

  function handleNextMonth() {
    if (calendarMonth === 11) {
      setCalendarYear(
        (current) => current + 1,
      );

      setCalendarMonth(0);

      return;
    }

    setCalendarMonth(
      (current) => current + 1,
    );
  }

  function handleSelectDate(day) {
    const currentDate =
      parseLocalDateTime(dueAt);

    const isSameDate =
      currentDate &&
      currentDate.getFullYear() ===
        calendarYear &&
      currentDate.getMonth() ===
        calendarMonth &&
      currentDate.getDate() === day;

    if (isSameDate) {
      setDueAt("");
      return;
    }

    const nextDate = new Date(
      calendarYear,
      calendarMonth,
      day,
      currentDate
        ? currentDate.getHours()
        : 23,
      currentDate
        ? currentDate.getMinutes()
        : 59,
      0,
      0,
    );

    setDueAt(
      formatLocalDateTime(nextDate),
    );
  }

  function handleHourChange(
    event,
  ) {
    const selectedDate =
      parseLocalDateTime(dueAt);

    if (!selectedDate) {
      return;
    }

    const nextHour = Math.min(
      23,
      Math.max(
        0,
        Number(event.target.value) || 0,
      ),
    );

    selectedDate.setHours(nextHour);

    setDueAt(
      formatLocalDateTime(
        selectedDate,
      ),
    );
  }

  function handleMinuteChange(
    event,
  ) {
    const selectedDate =
      parseLocalDateTime(dueAt);

    if (!selectedDate) {
      return;
    }

    const nextMinute = Math.min(
      59,
      Math.max(
        0,
        Number(event.target.value) || 0,
      ),
    );

    selectedDate.setMinutes(
      nextMinute,
    );

    setDueAt(
      formatLocalDateTime(
        selectedDate,
      ),
    );
  }

  function handleToggleCloseType() {
    if (isSaving) {
      return;
    }

    setIsDateOpen(false);

    setIsCloseTypeOpen(
      (current) => !current,
    );
  }

  function handleSelectCloseType(
    value,
  ) {
    setCloseType(value);
    setIsCloseTypeOpen(false);
  }

  function handleOpenFilePicker() {
    if (isSaving) {
      return;
    }

    fileInputRef.current?.click();
  }

  function appendFiles(fileList) {
    if (isSaving) {
      return;
    }

    const incomingFiles =
      Array.from(
        fileList ?? [],
      );

    if (
      incomingFiles.length === 0
    ) {
      return;
    }

    setNewFiles(
      (current) => [
        ...current,
        ...incomingFiles,
      ],
    );
  }

  function handleFileChange(
    event,
  ) {
    appendFiles(
      event.target.files,
    );

    event.target.value = "";
  }

  function handleDragOver(event) {
    event.preventDefault();

    if (!isSaving) {
      event.dataTransfer.dropEffect =
        "copy";
    }
  }

  function handleDrop(event) {
    event.preventDefault();

    appendFiles(
      event.dataTransfer.files,
    );
  }

  function handleRemoveExistingFile(
    fileId,
  ) {
    if (isSaving) {
      return;
    }

    setRetainedFiles(
      (current) =>
        current.filter(
          (file) =>
            file.file_id !== fileId,
        ),
    );
  }

  function handleRemoveNewFile(
    index,
  ) {
    if (isSaving) {
      return;
    }

    setNewFiles(
      (current) =>
        current.filter(
          (_file, fileIndex) =>
            fileIndex !== index,
        ),
    );
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    if (!finalTitle?.trim()) {
      setFormError(
        "과제 제목을 입력해주세요.",
      );

      return;
    }

    if (!dueAt) {
      setFormError(
        "제출 기한을 선택해주세요.",
      );

      return;
    }

    if (!closeType) {
      setFormError(
        "마감 방식을 선택해주세요.",
      );

      return;
    }

    if (
      closeType !== "AUTO" &&
      closeType !== "MANUAL"
    ) {
      setFormError(
        "마감 방식을 다시 선택해주세요.",
      );

      return;
    }

    if (!description.trim()) {
      setFormError(
        "과제 설명을 입력해주세요.",
      );

      return;
    }

    const convertedDueAt =
      toOffsetIso(dueAt);

    if (!convertedDueAt) {
      setFormError(
        "제출 기한을 다시 선택해주세요.",
      );

      return;
    }

    setFormError("");

    if (isEdit) {
      onRequestSave?.({
        title: finalTitle.trim(),
        description:
          description.trim(),
        dueAt: convertedDueAt,
        closeType,
        retainedFileIds:
          retainedFiles
            .map(
              (file) =>
                file.file_id,
            )
            .filter(Boolean),
        newFiles,
      });

      return;
    }

    onRequestSave?.({
      title: finalTitle.trim(),
      description:
        description.trim(),
      dueAt: convertedDueAt,
      closeType,
      files: newFiles,
    });
  }

  const selectedDate =
    parseLocalDateTime(dueAt);

  const selectedYear =
    selectedDate?.getFullYear();

  const selectedMonth =
    selectedDate?.getMonth();

  const selectedDay =
    selectedDate?.getDate();

  const firstWeekday =
    new Date(
      calendarYear,
      calendarMonth,
      1,
    ).getDay();

  const daysInMonth =
    new Date(
      calendarYear,
      calendarMonth + 1,
      0,
    ).getDate();

  const calendarCells = [
    ...Array.from(
      {
        length: firstWeekday,
      },
      () => null,
    ),
    ...Array.from(
      {
        length: daysInMonth,
      },
      (_value, index) =>
        index + 1,
    ),
  ];

  const closeTypeLabel =
    closeType === "AUTO"
      ? "자동마감"
      : closeType === "MANUAL"
        ? "수동마감"
        : "마감 여부";

  return (
    <form
      ref={handleEditorRef}
      className={`professor-assignment-editor professor-assignment-editor--${mode}${
        hasMoreBelow
          ? " has-more-below"
          : ""
      }`}
      onScroll={updateScrollState}
      onSubmit={handleSubmit}
    >
      {!isEdit && (
        <div className="professor-assignment-editor__field professor-assignment-editor__field--title">
          <label htmlFor="assignment-editor-title">
            과제 제목
          </label>

          <input
            id="assignment-editor-title"
            type="text"
            value={title}
            disabled={isSaving}
            placeholder="과제 제목을 작성해주세요"
            onChange={(event) =>
              setTitle(
                event.target.value,
              )
            }
          />
        </div>
      )}

      <div
        ref={dateDropdownRef}
        className="professor-assignment-editor__field professor-assignment-editor__field--deadline"
      >
        <label>
          제출 기한
        </label>

        <button
          type="button"
          className={`professor-assignment-editor__dropdown-trigger${
            dueAt
              ? " has-value"
              : ""
          }`}
          disabled={isSaving}
          aria-expanded={isDateOpen}
          onClick={handleToggleDate}
        >
          <span>
            {dueAt
              ? formatDateDisplay(
                  dueAt,
                )
              : "날짜를 선택해주세요"}
          </span>

          <img
            className="professor-assignment-editor__dropdown-icon"
            src={
              isDateOpen
                ? chevronUpIcon
                : chevronDownIcon
            }
            alt=""
          />
        </button>

        {isDateOpen && (
          <div className="professor-assignment-date-dropdown">
            <div className="professor-assignment-date-dropdown__header">
              <button
                type="button"
                aria-label="이전 달"
                onClick={
                  handlePreviousMonth
                }
              >
                <span>‹</span>
              </button>

              <strong>
                {calendarYear}년{" "}
                {pad2(
                  calendarMonth + 1,
                )}
                월
              </strong>

              <button
                type="button"
                aria-label="다음 달"
                onClick={
                  handleNextMonth
                }
              >
                <span>›</span>
              </button>
            </div>

            <div className="professor-assignment-date-dropdown__weekdays">
              {WEEKDAYS.map(
                (weekday) => (
                  <span key={weekday}>
                    {weekday}
                  </span>
                ),
              )}
            </div>

            <div className="professor-assignment-date-dropdown__calendar">
              {calendarCells.map(
                (day, index) =>
                  day ? (
                    <button
                      key={`${calendarYear}-${calendarMonth}-${day}`}
                      type="button"
                      className={
                        selectedYear ===
                          calendarYear &&
                        selectedMonth ===
                          calendarMonth &&
                        selectedDay ===
                          day
                          ? "is-selected"
                          : ""
                      }
                      onClick={() =>
                        handleSelectDate(
                          day,
                        )
                      }
                    >
                      {day}
                    </button>
                  ) : (
                    <span
                      key={`empty-${index}`}
                      aria-hidden="true"
                    />
                  ),
              )}
            </div>

            <div className="professor-assignment-date-dropdown__divider" />

            <div className="professor-assignment-date-dropdown__time">
              <span className="professor-assignment-date-dropdown__time-label">
                시간
              </span>

              <div className="professor-assignment-date-dropdown__time-control">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={
                    selectedDate
                      ? pad2(
                          selectedDate.getHours(),
                        )
                      : "23"
                  }
                  disabled={
                    !selectedDate
                  }
                  aria-label="시"
                  onChange={
                    handleHourChange
                  }
                />

                <span>:</span>

                <input
                  type="number"
                  min="0"
                  max="59"
                  value={
                    selectedDate
                      ? pad2(
                          selectedDate.getMinutes(),
                        )
                      : "59"
                  }
                  disabled={
                    !selectedDate
                  }
                  aria-label="분"
                  onChange={
                    handleMinuteChange
                  }
                />
              </div>

              <button
                type="button"
                className="professor-assignment-date-dropdown__confirm"
                disabled={
                  !selectedDate
                }
                onClick={() =>
                  setIsDateOpen(false)
                }
              >
                확인
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        ref={closeTypeDropdownRef}
        className="professor-assignment-editor__field professor-assignment-editor__field--close-type"
      >
        <button
          type="button"
          className={`professor-assignment-editor__dropdown-trigger${
            closeType
              ? " has-value"
              : ""
          }`}
          disabled={isSaving}
          aria-expanded={
            isCloseTypeOpen
          }
          onClick={
            handleToggleCloseType
          }
        >
          <span>
            {closeTypeLabel}
          </span>

          <img
            className="professor-assignment-editor__dropdown-icon"
            src={
              isCloseTypeOpen
                ? chevronUpIcon
                : chevronDownIcon
            }
            alt=""
          />
        </button>

        {isCloseTypeOpen && (
          <div className="professor-assignment-close-type-dropdown">
            <button
              type="button"
              className={
                closeType === "AUTO"
                  ? "is-selected"
                  : ""
              }
              onClick={() =>
                handleSelectCloseType(
                  "AUTO",
                )
              }
            >
              <span>
                자동마감
              </span>

              {closeType ===
                "AUTO" && (
                <i
                  className="professor-assignment-close-type-dropdown__check"
                  aria-hidden="true"
                />
              )}
            </button>

            <button
              type="button"
              className={
                closeType ===
                "MANUAL"
                  ? "is-selected"
                  : ""
              }
              onClick={() =>
                handleSelectCloseType(
                  "MANUAL",
                )
              }
            >
              <span>
                수동마감
              </span>

              {closeType ===
                "MANUAL" && (
                <i
                  className="professor-assignment-close-type-dropdown__check"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        )}
      </div>

      <div className="professor-assignment-editor__field professor-assignment-editor__field--description">
        <label htmlFor="assignment-editor-description">
          과제 설명
        </label>

        <textarea
          id="assignment-editor-description"
          value={description}
          disabled={isSaving}
          placeholder="제출과 관련해 학생들에게 전달할 내용을 입력해주세요."
          onChange={(event) =>
            setDescription(
              event.target.value,
            )
          }
        />
      </div>

      <div className="professor-assignment-editor__flow">
        <div className="professor-assignment-editor__files-flow">
          <label>
            첨부 파일
          </label>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            disabled={isSaving}
            onChange={handleFileChange}
          />

          <button
            type="button"
            className="professor-assignment-editor__dropzone"
            disabled={isSaving}
            onClick={
              handleOpenFilePicker
            }
            onDragOver={
              handleDragOver
            }
            onDrop={handleDrop}
          >
            <span>
              파일을 선택하거나 여기로 끌어다 놓으세요.
            </span>

            <strong>
              파일 첨부
            </strong>
          </button>

          {(retainedFiles.length >
            0 ||
            newFiles.length > 0) && (
            <div className="professor-assignment-editor__file-list">
              {retainedFiles.map(
                (file) => {
                  const fileSize =
                    getFileSizeText(
                      file,
                    );

                  return (
                    <div
                      className="professor-assignment-editor__file-card"
                      key={
                        file.file_id
                      }
                    >
                      <img
                        className="professor-assignment-editor__file-icon"
                        src={pdfIcon}
                        alt=""
                      />

                      <div className="professor-assignment-editor__file-info">
                        <strong>
                          {
                            file.file_name
                          }
                        </strong>

                        {fileSize && (
                          <span>
                            {fileSize}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="professor-assignment-editor__file-remove"
                        aria-label={`${file.file_name} 삭제`}
                        disabled={
                          isSaving
                        }
                        onClick={() =>
                          handleRemoveExistingFile(
                            file.file_id,
                          )
                        }
                      >
                        <img
                          src={closeIcon}
                          alt=""
                        />
                      </button>
                    </div>
                  );
                },
              )}

              {newFiles.map(
                (file, index) => (
                  <div
                    className="professor-assignment-editor__file-card"
                    key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                  >
                    <img
                      className="professor-assignment-editor__file-icon"
                      src={pdfIcon}
                      alt=""
                    />

                    <div className="professor-assignment-editor__file-info">
                      <strong>
                        {file.name}
                      </strong>

                      <span>
                        {formatFileSize(
                          file.size,
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="professor-assignment-editor__file-remove"
                      aria-label={`${file.name} 삭제`}
                      disabled={isSaving}
                      onClick={() =>
                        handleRemoveNewFile(
                          index,
                        )
                      }
                    >
                      <img
                        src={closeIcon}
                        alt=""
                      />
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {formError && (
          <p
            className="professor-assignment-editor__error"
            role="alert"
          >
            {formError}
          </p>
        )}

        <div className="professor-assignment-editor__actions">
          <p>
            {isEdit
              ? "수정 후 학생들에게 바로 반영됩니다."
              : "등록 후 학생들에게 바로 공개됩니다."}
          </p>

          <button
            type="submit"
            className="professor-assignment-editor__save"
            disabled={!canSubmit || isSaving}
          >
            {isSaving
              ? "저장 중"
              : isEdit
                ? "수정 완료"
                : "과제 등록"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default AssignmentEditorForm;