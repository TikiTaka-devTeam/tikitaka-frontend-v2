import { useRef, useState } from "react";

import closeIcon from "../../../assets/icons/close.svg";
import imageIcon from "../../../assets/icons/image.svg";
import pdfIcon from "../../../assets/icons/pdf.svg";
import pptIcon from "../../../assets/icons/ppt.svg";
import uploadIcon from "../../../assets/icons/upload.svg";

const MAX_FILE_COUNT = 5;
const MAX_FILE_SIZE =
  20 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  "pdf",
  "docx",
  "pptx",
  "png",
  "jpg",
  "jpeg",
  "zip",
];

function getExtension(fileName) {
  return (
    fileName
      ?.split(".")
      .pop()
      ?.toLowerCase() || ""
  );
}

function formatFileSize(bytes) {
  if (!bytes) {
    return "";
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(1)} MB`;
}

function getFileVisual(fileName) {
  const extension =
    getExtension(fileName);

  if (extension === "pdf") {
    return {
      icon: pdfIcon,
      label: "PDF",
    };
  }

  if (
    extension === "ppt" ||
    extension === "pptx"
  ) {
    return {
      icon: pptIcon,
      label: "PPT",
    };
  }

  if (
    extension === "png" ||
    extension === "jpg" ||
    extension === "jpeg"
  ) {
    return {
      icon: imageIcon,
      label: "IMG",
    };
  }

  if (
    extension === "doc" ||
    extension === "docx"
  ) {
    return {
      icon: null,
      label: "DOC",
    };
  }

  return {
    icon: null,
    label: "ZIP",
  };
}

function NoticeFileUploader({
  files = [],
  existingFiles = [],
  onChange,
  onExistingFilesChange,
}) {
  const inputRef = useRef(null);

  const [
    isDragging,
    setIsDragging,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const totalFileCount =
    files.length +
    existingFiles.length;

  function addFiles(fileList) {
    const incomingFiles =
      Array.from(
        fileList || [],
      );

    setErrorMessage("");

    if (
      incomingFiles.length === 0
    ) {
      return;
    }

    const validFiles = [];

    for (const file of incomingFiles) {
      const extension =
        getExtension(file.name);

      if (
        !ALLOWED_EXTENSIONS.includes(
          extension,
        )
      ) {
        setErrorMessage(
          "지원하지 않는 파일 형식이 포함되어 있습니다.",
        );

        continue;
      }

      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        setErrorMessage(
          "첨부파일은 파일당 최대 20MB까지 가능합니다.",
        );

        continue;
      }

      validFiles.push(file);
    }

    const remainingCount =
      MAX_FILE_COUNT -
      totalFileCount;

    if (
      remainingCount <= 0
    ) {
      setErrorMessage(
        "첨부파일은 최대 5개까지 추가할 수 있습니다.",
      );

      return;
    }

    if (
      validFiles.length >
      remainingCount
    ) {
      setErrorMessage(
        "첨부파일은 최대 5개까지 추가할 수 있습니다.",
      );
    }

    onChange?.([
      ...files,
      ...validFiles.slice(
        0,
        remainingCount,
      ),
    ]);
  }

  function removeNewFile(index) {
    onChange?.(
      files.filter(
        (_, fileIndex) =>
          fileIndex !== index,
      ),
    );

    setErrorMessage("");
  }

  function removeExistingFile(
    fileId,
  ) {
    onExistingFilesChange?.(
      existingFiles.filter(
        (file) =>
          file.id !== fileId,
      ),
    );

    setErrorMessage("");
  }

  function handleDrop(event) {
    event.preventDefault();

    setIsDragging(false);

    addFiles(
      event.dataTransfer.files,
    );
  }

  return (
    <aside className="notice-create-files">
      <h2>첨부파일</h2>

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.zip"
        onChange={(event) => {
          addFiles(
            event.target.files,
          );

          event.target.value =
            "";
        }}
      />

      <button
        type="button"
        className={`notice-file-dropzone${
          isDragging
            ? " is-dragging"
            : ""
        }`}
        onClick={() =>
          inputRef.current?.click()
        }
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          if (
            !event.currentTarget.contains(
              event.relatedTarget,
            )
          ) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
      >
        <img
          src={uploadIcon}
          alt=""
          className="notice-file-dropzone__icon"
        />

        <strong>
          파일 추가
        </strong>

        <span>
          파일을 선택하거나 드래그하세요
        </span>

        <small>
          PDF, DOCX, PPTX, PNG, ZIP (최대 20MB)
        </small>
      </button>

      <div className="notice-file-list-header">
        <strong>
          첨부된 파일 ({totalFileCount})
        </strong>
      </div>

      <div className="notice-file-list">
        {existingFiles.map(
          (file) => {
            const visual =
              getFileVisual(
                file.name,
              );

            return (
              <div
                key={`existing-${file.id}`}
                className="notice-file-item"
              >
                {visual.icon ? (
                  <img
                    src={visual.icon}
                    alt=""
                    className="notice-file-item__icon"
                  />
                ) : (
                  <span className="notice-file-item__fallback">
                    {visual.label}
                  </span>
                )}

                <div className="notice-file-item__body">
                  <strong>
                    {file.name}
                  </strong>

                  {file.sizeText && (
                    <span>
                      {file.sizeText}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="notice-file-item__remove"
                  aria-label={`${file.name} 삭제`}
                  onClick={() =>
                    removeExistingFile(
                      file.id,
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

        {files.map(
          (file, index) => {
            const visual =
              getFileVisual(
                file.name,
              );

            return (
              <div
                key={`${file.name}-${file.lastModified}-${index}`}
                className="notice-file-item"
              >
                {visual.icon ? (
                  <img
                    src={visual.icon}
                    alt=""
                    className="notice-file-item__icon"
                  />
                ) : (
                  <span className="notice-file-item__fallback">
                    {visual.label}
                  </span>
                )}

                <div className="notice-file-item__body">
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
                  className="notice-file-item__remove"
                  aria-label={`${file.name} 삭제`}
                  onClick={() =>
                    removeNewFile(
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
            );
          },
        )}
      </div>

      {errorMessage && (
        <p
          className="notice-file-error"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      <p className="notice-file-help">
        ⓘ&nbsp;&nbsp;첨부 파일은 최대 5개까지 추가할 수 있습니다.
      </p>
    </aside>
  );
}

export default NoticeFileUploader;