import { useRef, useState } from "react";

import closeIcon from "../../../assets/icons/close.svg";
import cloudUploadIcon from "../../../assets/icons/space/material-cloud-upload.svg";
import materialPdfIcon from "../../../assets/icons/space/material-pdf.svg";
import materialPptIcon from "../../../assets/icons/space/material-ppt.svg";
import ModalActions from "../../../components/common/ModalActions.jsx";
import ModalBackdrop from "../../../components/common/ModalBackdrop.jsx";

import "../styles/materialUploadModal.css";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ".pdf,application/pdf";
const ACCEPTED_FILE_EXTENSIONS = ["pdf"];

function getFileExtension(fileName) {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

function getFileNameWithoutExtension(fileName) {
  return fileName.replace(/\.[^.]+$/, "");
}

function formatFileSize(size) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function MaterialUploadModal({ initialMaterial, onClose, onSave }) {
  const fileInputRef = useRef(null);
  const initialFileTitle = initialMaterial?.file
    ? getFileNameWithoutExtension(initialMaterial.file.name)
    : "";
  const [title, setTitle] = useState(initialMaterial?.title || "");
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(
    Boolean(initialMaterial?.title && initialMaterial.title !== initialFileTitle),
  );
  const [file, setFile] = useState(initialMaterial?.file || null);
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const selectFile = (nextFile) => {
    if (!nextFile) return;

    const extension = getFileExtension(nextFile.name);

    if (!ACCEPTED_FILE_EXTENSIONS.includes(extension)) {
      setFile(null);
      setFileError("PDF 파일만 업로드할 수 있습니다.");
      return;
    }

    if (nextFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setFileError("20MB 이하의 파일을 선택해 주세요.");
      return;
    }

    setFile(nextFile);
    setFileError("");

    if (!isTitleManuallyEdited || !title.trim()) {
      setTitle(getFileNameWithoutExtension(nextFile.name));
      setIsTitleManuallyEdited(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!title.trim() || !file) return;
    onSave?.({ title: title.trim(), file });
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <form
        className="material-upload-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="material-upload-modal-title"
        aria-describedby="material-upload-modal-description"
        onSubmit={handleSubmit}
      >
        <header className="material-upload-modal__header">
          <h2 id="material-upload-modal-title">
            강의자료 추가
          </h2>
          <p id="material-upload-modal-description">
            새로운 강의자료를 업로드 해주세요!
          </p>
        </header>

        <div className="material-upload-modal__divider" />

        <div className="material-upload-modal__body">
          <label className="material-upload-modal__field">
            <span>강의자료 이름</span>
            <span className="material-upload-modal__input-wrap">
              <input
                type="text"
                value={title}
                maxLength={100}
                placeholder="강의자료 이름을 입력하세요"
                onChange={(event) => {
                  setTitle(event.target.value);
                  setIsTitleManuallyEdited(true);
                }}
                autoFocus
              />
              {title && (
                <button
                  type="button"
                  aria-label="강의자료 이름 지우기"
                  onClick={() => {
                    setTitle("");
                    setIsTitleManuallyEdited(true);
                  }}
                >
                  <img src={closeIcon} alt="" />
                </button>
              )}
            </span>
          </label>

          <div className="material-upload-modal__field">
            <span>첨부파일</span>
            <button
              type="button"
              className={`material-upload-modal__dropzone ${isDragging ? "is-dragging" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                selectFile(event.dataTransfer.files?.[0]);
              }}
            >
              <img src={cloudUploadIcon} alt="" />
              <strong>파일 추가</strong>
              <small>파일을 선택하거나 드래그하세요</small>
              <small>PDF (최대 20MB)</small>
            </button>
            <input
              ref={fileInputRef}
              className="material-upload-modal__file-input"
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
            {fileError && (
              <p className="material-upload-modal__error" role="alert">
                {fileError}
              </p>
            )}
          </div>

          <div className="material-upload-modal__field">
            <span>업로드된 파일</span>
            {file ? (
              <div className="material-upload-modal__file">
                <img
                  className={
                    getFileExtension(file.name) === "pdf" ? "is-pdf" : ""
                  }
                  src={
                    getFileExtension(file.name) === "pdf"
                      ? materialPdfIcon
                      : materialPptIcon
                  }
                  alt=""
                />
                <span>
                  <strong>{file.name}</strong>
                  <small>{formatFileSize(file.size)}</small>
                </span>
                <button
                  type="button"
                  aria-label={`${file.name} 삭제`}
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <img src={closeIcon} alt="" />
                </button>
              </div>
            ) : (
              <div className="material-upload-modal__file material-upload-modal__file--empty">
                선택된 파일이 없습니다.
              </div>
            )}
          </div>
        </div>

        <footer className="material-upload-modal__footer">
          <ModalActions
            onCancel={onClose}
            confirmText="저장"
            confirmType="submit"
            confirmDisabled={!title.trim() || !file}
          />
        </footer>
      </form>
    </ModalBackdrop>
  );
}

export default MaterialUploadModal;
