import { useEffect, useRef, useState } from "react";

import ModalActions from "../../../components/common/ModalActions.jsx";
import ModalBackdrop from "../../../components/common/ModalBackdrop.jsx";
import closeIconSrc from "../../../assets/icons/close.svg";

import "../styles/createSpaceModal.css";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];

function createTimeBlock(id, schedule = {}) {
  return {
    id,
    days: schedule.days ?? [],
    startTime: schedule.startTime ?? "",
    startPeriod: schedule.startPeriod ?? "AM",
    endTime: schedule.endTime ?? "",
    endPeriod: schedule.endPeriod ?? "PM",
  };
}

function createInitialTimeBlocks(initialData) {
  if (
    initialData?.schedules &&
    initialData.schedules.length > 0
  ) {
    return initialData.schedules.map((schedule, index) =>
      createTimeBlock(index + 1, schedule),
    );
  }

  return [
    createTimeBlock(1),
  ];
}

function formatTimeInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)} : ${digits.slice(2)}`;
}

function PeriodSelector({
  value,
  isOpen,
  onToggle,
  onChange,
}) {
  return (
    <div
      className="create-space-modal__period"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onToggle(false);
        }
      }}
    >
      <button
        type="button"
        className="create-space-modal__period-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => onToggle(!isOpen)}
      >
        {value}
      </button>

      {isOpen && (
        <div
          className="create-space-modal__period-dropdown"
          role="listbox"
          aria-label="오전 오후 선택"
        >
          {["AM", "PM"].map((period) => (
            <button
              key={period}
              type="button"
              role="option"
              aria-selected={value === period}
              className={`create-space-modal__period-option ${
                value === period ? "is-selected" : ""
              }`}
              onClick={() => {
                onChange(period);
                onToggle(false);
              }}
            >
              {period}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TimePicker({
  value,
  placeholder,
  period,
  isPeriodOpen,
  onPeriodToggle,
  onTimeChange,
  onPeriodChange,
}) {
  return (
    <div className="create-space-modal__time-picker">
      <input
        type="text"
        inputMode="numeric"
        className={`create-space-modal__time-input ${
          value ? "has-value" : ""
        }`}
        value={value}
        placeholder={placeholder}
        aria-label="수업 시간"
        onChange={(event) => {
          onTimeChange(formatTimeInput(event.target.value));
        }}
      />

      <PeriodSelector
        value={period}
        isOpen={isPeriodOpen}
        onToggle={onPeriodToggle}
        onChange={onPeriodChange}
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
  const [openPeriod, setOpenPeriod] = useState(null);

  const hasSelectedDay = block.days.length > 0;

  return (
    <div
      className="create-space-modal__time-box"
      data-active={hasSelectedDay}
    >
      {canRemove && (
        <button
          type="button"
          className="create-space-modal__remove-time"
          aria-label="수업 시간 삭제"
          onClick={() => onRemove(block.id)}
        >
          <img
            src={closeIconSrc}
            alt=""
          />
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
          placeholder="10 : 30"
          period={block.startPeriod}
          isPeriodOpen={openPeriod === "start"}
          onPeriodToggle={(open) => {
            setOpenPeriod(open ? "start" : null);
          }}
          onTimeChange={(value) => {
            onChange(block.id, "startTime", value);
          }}
          onPeriodChange={(value) => {
            onChange(block.id, "startPeriod", value);
          }}
        />

        <span className="create-space-modal__time-separator">
          ~
        </span>

        <TimePicker
          value={block.endTime}
          placeholder="12 : 00"
          period={block.endPeriod}
          isPeriodOpen={openPeriod === "end"}
          onPeriodToggle={(open) => {
            setOpenPeriod(open ? "end" : null);
          }}
          onTimeChange={(value) => {
            onChange(block.id, "endTime", value);
          }}
          onPeriodChange={(value) => {
            onChange(block.id, "endPeriod", value);
          }}
        />
      </div>
    </div>
  );
}

function CreateSpaceModal({
  onClose,
  onSave,
  initialData = null,
}) {
  const [spaceName, setSpaceName] = useState(
    initialData?.name ?? "",
  );

  const [classroom, setClassroom] = useState(
    initialData?.classroom ?? "",
  );

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
      body.scrollHeight -
      body.scrollTop -
      body.clientHeight;

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
          : Math.max(
              ...previous.map((block) => block.id),
            ) + 1;

      return [
        ...previous,
        createTimeBlock(nextId),
      ];
    });
  };

  const handleRemoveTimeBlock = (blockId) => {
    setTimeBlocks((previous) =>
      previous.filter(
        (block) => block.id !== blockId,
      ),
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSave?.({
      name: spaceName.trim(),
      classroom: classroom.trim(),

      schedules: timeBlocks.map(
        ({
          days,
          startTime,
          startPeriod,
          endTime,
          endPeriod,
        }) => ({
          days,
          startTime,
          startPeriod,
          endTime,
          endPeriod,
        }),
      ),
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
              <h3 className="create-space-modal__field-label">
                수업 시간
              </h3>

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
            <div
              className="create-space-modal__body-fade"
              aria-hidden="true"
            />
          )}
        </div>

        <ModalActions
          className="create-space-modal__actions"
          onCancel={onClose}
          confirmType="submit"
        />
      </form>
    </ModalBackdrop>
  );
}

export default CreateSpaceModal;