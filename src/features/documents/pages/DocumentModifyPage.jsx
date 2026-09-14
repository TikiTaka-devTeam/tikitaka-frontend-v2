import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import checkmarkOffIcon from "../../../assets/icons/documents/checkmark-off.svg";
import checkmarkOnIcon from "../../../assets/icons/documents/checkmark-on.svg";
import deletedWatermarkIcon from "../../../assets/icons/documents/deleted_watermark.svg";
import documentTitlePenIcon from "../../../assets/icons/documents/document-modify-title-pen.svg";
import helpIcon from "../../../assets/icons/documents/help.svg";
import goBackIcon from "../../../assets/icons/go-back.svg";
import noteIcon from "../../../assets/icons/documents/note.svg";
import redoIcon from "../../../assets/icons/documents/redo.svg";
import saveIcon from "../../../assets/icons/documents/save.svg";
import selectedPageDeleteIcon from "../../../assets/icons/documents/selected-page-delete.svg";
import undoIcon from "../../../assets/icons/documents/undo.svg";
import fallbackThumbnail from "../../../assets/images/ci-cd-pipeline-notes.png";

import DocumentModifyHelpOverlay from "../components/DocumentModifyHelpOverlay.jsx";
import "../styles/documentModify.css";

GlobalWorkerOptions.workerSrc = pdfWorker;

function SlideBlock({
  checked,
  deleted = false,
  image,
  page,
  selected,
  onCheck,
  onSelect,
}) {
  return (
    <div
      className={[
        "document-modify-slide-block",
        selected ? "is-selected" : "",
        deleted ? "is-deleted" : "",
      ].filter(Boolean).join(" ")}
    >
      <button
        type="button"
        className="document-modify-slide-preview"
        aria-label={`${page}페이지 미리보기`}
        onClick={onSelect}
      >
        <img src={image} alt="" />
        <span>{page}</span>
      </button>
      <button
        type="button"
        className="document-modify-slide-check"
        aria-label={deleted
          ? `${page}페이지 삭제 예정`
          : `${page}페이지 ${checked ? "선택 해제" : "선택"}`}
        aria-pressed={checked}
        disabled={deleted}
        onClick={onCheck}
      >
        <img src={checked ? checkmarkOnIcon : checkmarkOffIcon} alt="" />
      </button>
      {deleted && (
        <img
          className="document-modify-slide-deleted-watermark"
          src={deletedWatermarkIcon}
          alt=""
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function DocumentModifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { spaceId } = useParams();
  const revisionFileInputRef = useRef(null);
  const [selectedPage, setSelectedPage] = useState(1);
  const [selectedSource, setSelectedSource] = useState("original");
  const [checkedOriginalPages, setCheckedOriginalPages] = useState([]);
  const [checkedRevisionPages, setCheckedRevisionPages] = useState([]);
  const [deletedOriginalPages, setDeletedOriginalPages] = useState([]);
  const [revisionFile, setRevisionFile] = useState(null);
  const [revisionSlides, setRevisionSlides] = useState([]);
  const [notice, setNotice] = useState("");
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const material = location.state?.material ?? {};
  const spaceName = location.state?.spaceName ?? "강의 Space";
  const initialDocumentName = material.fileName ?? material.title ?? "강의자료.pdf";
  const [documentName, setDocumentName] = useState(initialDocumentName);
  const [documentNameDraft, setDocumentNameDraft] = useState(initialDocumentName);
  const [isEditingDocumentName, setIsEditingDocumentName] = useState(false);
  const pageCount = Math.max(1, Number(material.pageCount) || 1);
  const pages = useMemo(
    () => Array.from({ length: pageCount }, (_, index) => index + 1),
    [pageCount],
  );
  const previewImage = material.thumbnailUrl || fallbackThumbnail;
  const selectedRevisionSlide = revisionSlides.find(({ page }) => page === selectedPage);
  const selectedPreviewImage = selectedSource === "revision"
    ? selectedRevisionSlide?.image || previewImage
    : previewImage;
  const isSelectedPageDeleted = selectedSource === "original"
    && deletedOriginalPages.includes(selectedPage);

  useEffect(() => {
    if (!revisionFile) {
      return undefined;
    }

    let cancelled = false;
    let loadingTask;

    const createRevisionSlides = async () => {
      try {
        const data = await revisionFile.arrayBuffer();
        loadingTask = getDocument({ data });
        const pdf = await loadingTask.promise;
        const slides = [];

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          if (cancelled) return;

          const pdfPage = await pdf.getPage(pageNumber);
          const viewport = pdfPage.getViewport({ scale: 0.4 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await pdfPage.render({ canvasContext: context, viewport }).promise;
          slides.push({ page: pageNumber, image: canvas.toDataURL("image/jpeg", 0.8) });
        }

        if (!cancelled) setRevisionSlides(slides);
      } catch {
        if (!cancelled) {
          setRevisionSlides([]);
          setNotice("PDF 페이지를 불러오지 못했습니다.");
        }
      }
    };

    createRevisionSlides();

    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [revisionFile]);

  const toggleCheckedPage = (setCheckedPages, page) => {
    setCheckedPages((currentPages) => (
      currentPages.includes(page)
        ? currentPages.filter((currentPage) => currentPage !== page)
        : [...currentPages, page]
    ));
  };

  const deleteCheckedOriginalPages = () => {
    if (checkedOriginalPages.length === 0) return;

    setDeletedOriginalPages((currentPages) => (
      [...new Set([...currentPages, ...checkedOriginalPages])]
    ));
    setSelectedSource("original");
    setSelectedPage(checkedOriginalPages[0]);
    setCheckedOriginalPages([]);
  };

  const startEditingDocumentName = () => {
    setDocumentNameDraft(documentName);
    setIsEditingDocumentName(true);
  };

  const finishEditingDocumentName = () => {
    const nextDocumentName = documentNameDraft.trim();

    if (!nextDocumentName) {
      setDocumentNameDraft(documentName);
      setNotice("강의자료 이름은 비워둘 수 없습니다.");
    } else {
      setDocumentName(nextDocumentName);
      setDocumentNameDraft(nextDocumentName);
    }

    setIsEditingDocumentName(false);
  };

  const cancelEditingDocumentName = () => {
    setDocumentNameDraft(documentName);
    setIsEditingDocumentName(false);
  };

  const selectRevisionFile = (file) => {
    if (!file) return;
    setRevisionFile(file);
    setRevisionSlides([]);
    setCheckedRevisionPages([]);
    setSelectedSource("original");
    setSelectedPage(1);
  };

  return (
    <main className="document-modify-page">
      <div className="document-modify-page__orb document-modify-page__orb--left" />
      <div className="document-modify-page__orb document-modify-page__orb--right" />

      <button
        type="button"
        className={`document-modify-back${isHelpOpen ? " is-help-open" : ""}`}
        aria-label={isHelpOpen ? "강의자료 수정 화면으로 돌아가기" : "강의자료 목록으로 돌아가기"}
        onClick={() => {
          if (isHelpOpen) {
            setIsHelpOpen(false);
            return;
          }

          navigate(`/spaces/${spaceId}`);
        }}
      >
        <img src={goBackIcon} alt="" />
      </button>

      <header className="document-modify-header">
        <h1>{spaceName}</h1>
        <p>강의자료 수정</p>
      </header>

      <div className="document-modify-actions" aria-label="강의자료 수정 도구">
        <button type="button" aria-label="실행 취소" onClick={() => setNotice("실행 취소할 변경 사항이 없습니다.")}>
          <img src={undoIcon} alt="" />
        </button>
        <button type="button" aria-label="다시 실행" onClick={() => setNotice("다시 실행할 변경 사항이 없습니다.")}>
          <img src={redoIcon} alt="" />
        </button>
        <button type="button" aria-label="저장" onClick={() => setNotice("API 연동 전이라 수정 내용은 저장되지 않습니다.")}>
          <img src={saveIcon} alt="" />
        </button>
        <button
          type="button"
          aria-label="도움말"
          aria-haspopup="dialog"
          aria-expanded={isHelpOpen}
          onClick={() => setIsHelpOpen(true)}
        >
          <img src={helpIcon} alt="" />
        </button>
      </div>

      <section className="document-modify-layout" aria-label={`${documentName} 수정`}>
        <section className="document-modify-preview-panel">
          <header>
            <div className="document-modify-preview-title">
              {isEditingDocumentName ? (
                <input
                  type="text"
                  className="document-modify-preview-title-input"
                  value={documentNameDraft}
                  aria-label="강의자료 이름"
                  autoFocus
                  onFocus={(event) => event.currentTarget.select()}
                  onChange={(event) => setDocumentNameDraft(event.target.value)}
                  onBlur={finishEditingDocumentName}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      finishEditingDocumentName();
                    }

                    if (event.key === "Escape") {
                      cancelEditingDocumentName();
                    }
                  }}
                />
              ) : (
                <>
                  <h2>{documentName}</h2>
                  <button
                    type="button"
                    className="document-modify-preview-title-edit"
                    aria-label="강의자료 이름 변경"
                    onClick={startEditingDocumentName}
                  >
                    <img src={documentTitlePenIcon} alt="" />
                  </button>
                </>
              )}
            </div>
            {isSelectedPageDeleted && (
              <img
                className="document-modify-preview-deleted-watermark"
                src={deletedWatermarkIcon}
                alt="삭제 예정"
              />
            )}
            <p>페이지 미리보기</p>
          </header>
          <div className="document-modify-preview-divider" />
          <div className="document-modify-preview-image">
            <img src={selectedPreviewImage} alt={`${documentName} ${selectedPage}페이지 미리보기`} />
          </div>
          <p
            className={`document-modify-preview-guide${isSelectedPageDeleted ? " is-deleted" : ""}`}
          >
            {isSelectedPageDeleted
              ? "※ 이 페이지는 삭제될 예정입니다"
              : "※ 오른쪽 패널에서 수정 자료본을 업로드하세요"}
          </p>
        </section>

        <aside className="document-modify-pages-panel">
          <header>
            <strong>기존 강의자료</strong>
            {checkedOriginalPages.length > 0 ? (
              <span className="document-modify-selected-count">
                {checkedOriginalPages.length}개 선택됨
              </span>
            ) : (
              <span>{documentName}</span>
            )}
            {checkedOriginalPages.length > 0 && (
              <button
                type="button"
                className="document-modify-selected-delete"
                aria-label={`선택한 ${checkedOriginalPages.length}개 페이지 삭제`}
                onClick={deleteCheckedOriginalPages}
              >
                <img src={selectedPageDeleteIcon} alt="" />
              </button>
            )}
          </header>
          <div className="document-modify-panel-divider" />
          <div className="document-modify-page-list">
            {pages.map((page) => (
              <SlideBlock
                key={page}
                page={page}
                image={previewImage}
                selected={selectedSource === "original" && selectedPage === page}
                checked={checkedOriginalPages.includes(page)}
                deleted={deletedOriginalPages.includes(page)}
                onSelect={() => {
                  setSelectedSource("original");
                  setSelectedPage(page);
                }}
                onCheck={() => toggleCheckedPage(setCheckedOriginalPages, page)}
              />
            ))}
          </div>
        </aside>

        <aside className="document-modify-upload-panel">
          <header>
            <strong>새 강의자료</strong>
            <span>{revisionFile?.name ?? "수정본을 선택해 주세요"}</span>
          </header>
          <div className="document-modify-panel-divider" />
          {revisionSlides.length === 0 && (
            <button
              type="button"
              className="document-modify-upload-dropzone"
              onClick={() => revisionFileInputRef.current?.click()}
            >
              <img src={noteIcon} alt="" />
              <strong>{revisionFile ? revisionFile.name : "수정본 업로드"}</strong>
              <small>수정본 파일을 업로드하세요</small>
            </button>
          )}
          <input
            ref={revisionFileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => selectRevisionFile(event.target.files?.[0])}
          />
          {revisionSlides.length > 0 && (
            <div className="document-modify-page-list">
              {revisionSlides.map(({ page, image }) => (
                <SlideBlock
                  key={page}
                  page={page}
                  image={image}
                  selected={selectedSource === "revision" && selectedPage === page}
                  checked={checkedRevisionPages.includes(page)}
                  onSelect={() => {
                    setSelectedSource("revision");
                    setSelectedPage(page);
                  }}
                  onCheck={() => toggleCheckedPage(setCheckedRevisionPages, page)}
                />
              ))}
            </div>
          )}
        </aside>
      </section>

      {isHelpOpen && (
        <DocumentModifyHelpOverlay onClose={() => setIsHelpOpen(false)} />
      )}
      {notice && <p className="document-modify-toast" role="status">{notice}</p>}
    </main>
  );
}

export default DocumentModifyPage;
