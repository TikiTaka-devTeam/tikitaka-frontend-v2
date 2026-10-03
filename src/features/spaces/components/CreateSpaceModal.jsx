import { useEffect, useRef, useState } from "react";

import ModalActions from "../../../components/common/ModalActions.jsx";
import ModalBackdrop from "../../../components/common/ModalBackdrop.jsx";
import closeIconSrc from "../../../assets/icons/close.svg";

import "../styles/createSpaceModal.css";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];

const API_DAY_TO_LABEL = {
  MONDAY: "월",
  TUESDAY: "화",
  WEDNESDAY: "수",
  THURSDAY: "목",
  FRIDAY: "금",
  SATURDAY: "토",
  SUNDAY: "일",
};

function createTimeBlock(id) {
  return {
    id,
    days: [],
    startTime: "",
    endTime: "",
  };
}

function formatTimeInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)} : ${digits.slice(2)}`;
}

function isValidTime(value, allowEndOfDay = false) {
  const digits = value.replace(/\D/g, "");

  if (digits.length !== 4) {
    return false;
  }

  const hour = Number(digits.slice(0, 2));

  const minute = Number(digits.slice(2, 4));

  if (allowEndOfDay && hour === 24) {
    return minute === 0;
  }

  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function createInitialTimeBlocks(initialData) {
  const schedules = initialData?.schedules;

  if (!Array.isArray(schedules) || schedules.length === 0) {
    return [createTimeBlock(1)];
  }

  const isUiSchedule = schedules.some((schedule) =>
    Array.isArray(schedule.days),
  );

  if (isUiSchedule) {
    return schedules.map((schedule, index) => ({
      id: index + 1,
      days: Array.isArray(schedule.days) ? schedule.days : [],
      startTime: formatTimeInput(schedule.startTime ?? ""),
      endTime: formatTimeInput(schedule.endTime ?? ""),
    }));
  }

  const groupedSchedules = new Map();

  schedules.forEach((schedule) => {
    const startTime = schedule.start_time ?? "";

    const endTime = schedule.end_time ?? "";

    const key = `${startTime}-${endTime}`;

    const day = API_DAY_TO_LABEL[schedule.day];

    if (!groupedSchedules.has(key)) {
      groupedSchedules.set(key, {
        days: [],
        startTime,
        endTime,
      });
    }

    if (day) {
      groupedSchedules.get(key).days.push(day);
    }
  });

  return Array.from(groupedSchedules.values()).map((schedule, index) => ({
    id: index + 1,
    days: schedule.days,
    startTime: formatTimeInput(schedule.startTime),
    endTime: formatTimeInput(schedule.endTime),
  }));
}

function TimePicker({
  value,
  placeholder,
  onTimeChange,
}) {
  return (
    <div className="create-space-modal__time-picker">
      <input
        type="text"
        inputMode="numeric"
        className={`create-space-modal__time-input ${value ? "has-value" : ""}`}
        value={value}
        placeholder={placeholder}
        aria-label="수업 시간"
        onChange={(event) => {
          onTimeChange(formatTimeInput(event.target.value));
        }}
      />
    </div>
  );
}

function TimeScheduleBlock({
  block,
  canRemove,
  onRemove,
  onToggleDay,
  onChange,
}) {
  return (
    <div
      className={`create-space-modal__time-box ${
        block.days.length > 0 ? "has-value" : ""
      }`}
    >
      {canRemove && (
        <button
          type="button"
          className="create-space-modal__remove-time"
          aria-label="수업 시간 삭제"
          onClick={() => onRemove(block.id)}
        >
          <img src={closeIconSrc} alt="" />
        </button>
      )}

      <div className="create-space-modal__day-list">
        {DAYS.map((day) => {
          const isSelected = block.days.includes(day);

          return (
            <button
              key={day}
              type="button"
              aria-pressed={isSelected}
              className={`create-space-modal__day-button ${
                isSelected ? "is-selected" : ""
              }`}
              onClick={() => onToggleDay(block.id, day)}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="create-space-modal__time-row">
        <TimePicker
          value={block.startTime}
          placeholder="09 : 00"
          onTimeChange={(value) => {
            onChange(block.id, "startTime", value);
          }}
        />

        <span className="create-space-modal__time-separator">~</span>

        <TimePicker
          value={block.endTime}
          placeholder="16 : 00"
          onTimeChange={(value) => {
            onChange(block.id, "endTime", value);
          }}
        />
      </div>
    </div>
  );
}

function CreateSpaceModal({ initialData = null, onClose, onSave }) {
  const [spaceName, setSpaceName] = useState(initialData?.name ?? "");

  const [classroom, setClassroom] = useState(initialData?.classroom ?? "");

  const [timeBlocks, setTimeBlocks] = useState(() =>
    createInitialTimeBlocks(initialData),
  );

  const bodyRef = useRef(null);

  const [hasMoreBelow, setHasMoreBelow] = useState(false);

  const updateScrollFade = () => {
    const body = bodyRef.current;

    if (!body) {
      return;
    }

    const remainingScroll =
      body.scrollHeight - body.scrollTop - body.clientHeight;

    setHasMoreBelow(remainingScroll > 2);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      updateScrollFade();
    });

    window.addEventListener("resize", updateScrollFade);

    return () => {
      cancelAnimationFrame(frame);

      window.removeEventListener("resize", updateScrollFade);
    };
  }, [timeBlocks]);

  const handleToggleDay = (blockId, day) => {
    setTimeBlocks((previous) =>
      previous.map((block) => {
        if (block.id !== blockId) {
          return block;
        }

        const hasDay = block.days.includes(day);

        return {
          ...block,
          days: hasDay
            ? block.days.filter((item) => item !== day)
            : [...block.days, day],
        };
      }),
    );
  };

  const handleTimeChange = (blockId, field, value) => {
    setTimeBlocks((previous) =>
      previous.map((block) =>
        block.id === blockId
          ? {
              ...block,
              [field]: value,
            }
          : block,
      ),
    );
  };

  const handleAddTimeBlock = () => {
    setTimeBlocks((previous) => {
      const nextId =
        previous.length === 0
          ? 1
          : Math.max(...previous.map((block) => block.id)) + 1;

      return [...previous, createTimeBlock(nextId)];
    });
  };

  const handleRemoveTimeBlock = (blockId) => {
    setTimeBlocks((previous) =>
      previous.filter((block) => block.id !== blockId),
    );
  };

  const isScheduleComplete = timeBlocks.every(
    (block) =>
      block.days.length >= 1 &&
      isValidTime(block.startTime) &&
      isValidTime(block.endTime, true),
  );

  const isFormComplete =
    spaceName.trim().length > 0 &&
    classroom.trim().length > 0 &&
    timeBlocks.length > 0 &&
    isScheduleComplete;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!isFormComplete) {
      return;
    }

    onSave?.({
      name: spaceName.trim(),

      classroom: classroom.trim(),

      schedules: timeBlocks.map(({ days, startTime, endTime }) => ({
        days,
        startTime,
        endTime,
      })),
    });
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <form
        className="create-space-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-space-modal-title"
        onSubmit={handleSubmit}
      >
        <header className="create-space-modal__header">
          <h2
            id="create-space-modal-title"
            className="create-space-modal__title"
          >
            Space 생성
          </h2>

          <p className="create-space-modal__description">
            새로운 Space를 생성해주세요!
          </p>

          <div className="create-space-modal__divider" />
        </header>

        <div className="create-space-modal__body-wrap">
          <div
            ref={bodyRef}
            className="create-space-modal__body"
            onScroll={updateScrollFade}
          >
            <div className="create-space-modal__field">
              <label
                className="create-space-modal__field-label"
                htmlFor="create-space-name"
              >
                Space 이름
              </label>

              <input
                id="create-space-name"
                type="text"
                className={`create-space-modal__field-input ${
                  spaceName.trim() ? "has-value" : ""
                }`}
                placeholder="Space 이름"
                value={spaceName}
                onChange={(event) => {
                  setSpaceName(event.target.value);
                }}
              />
            </div>

            <section className="create-space-modal__time-section">
              <h3 className="create-space-modal__field-label">수업 시간</h3>

              <div className="create-space-modal__time-list">
                {timeBlocks.map((block, index) => (
                  <TimeScheduleBlock
                    key={block.id}
                    block={block}
                    canRemove={index > 0}
                    onRemove={handleRemoveTimeBlock}
                    onToggleDay={handleToggleDay}
                    onChange={handleTimeChange}
                  />
                ))}
              </div>

              <button
                type="button"
                className="create-space-modal__add-time"
                onClick={handleAddTimeBlock}
              >
                <span aria-hidden="true">+</span>

                <span>추가</span>
              </button>
            </section>

            <div className="create-space-modal__field create-space-modal__classroom">
              <label
                className="create-space-modal__field-label"
                htmlFor="create-space-classroom"
              >
                강의실
              </label>

              <input
                id="create-space-classroom"
                type="text"
                className={`create-space-modal__field-input ${
                  classroom.trim() ? "has-value" : ""
                }`}
                placeholder="강의실"
                value={classroom}
                onChange={(event) => {
                  setClassroom(event.target.value);
                }}
              />
            </div>
          </div>

          {hasMoreBelow && (
            <div className="create-space-modal__body-fade" aria-hidden="true" />
          )}
        </div>

        <ModalActions
          className="create-space-modal__actions"
          onCancel={onClose}
          confirmType="submit"
          confirmDisabled={!isFormComplete}
        />
      </form>
    </ModalBackdrop>
  );
}

export default CreateSpaceModal;
