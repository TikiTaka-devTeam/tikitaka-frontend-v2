import {
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import backIcon from "../../../assets/icons/go-back.svg";

import {
  AppToolbars,
} from "../../../components/common/AppToolbars.jsx";

import SpaceToolbar from "../../spaces/components/SpaceToolbar.jsx";

import {
  createSpaceNotice,
  updateSpaceNotice,
} from "../api/spaceNoticesApi.js";

import NoticeConfirmModal from "./NoticeConfirmModal.jsx";
import NoticeEditor from "./NoticeEditor.jsx";
import NoticeFileUploader from "./NoticeFileUploader.jsx";

import "../styles/spaceNoticeCreate.css";

function SpaceNoticeCreateView({
  spaceId,
  spaceName,
  mode = "create",
  initialNotice = null,
  useMock = false,
  onBack,
  onSaved,
}) {
  const navigate =
    useNavigate();

  const isEdit =
    mode === "edit";

  const [
    title,
    setTitle,
  ] = useState(() =>
    isEdit
      ? initialNotice?.title ??
        ""
      : "",
  );

  const [
    content,
    setContent,
  ] = useState(() =>
    isEdit
      ? initialNotice?.content ??
        ""
      : "",
  );

  const [
    newFiles,
    setNewFiles,
  ] = useState([]);

  const [
    existingFiles,
    setExistingFiles,
  ] = useState(() =>
    isEdit &&
    Array.isArray(
      initialNotice?.files,
    )
      ? initialNotice.files
      : [],
  );

  const [
    modalStep,
    setModalStep,
  ] = useState(null);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const canSubmit =
    title.trim().length > 0 &&
    String(
      content ?? "",
    )
      .trim()
      .length > 0 &&
    !isSaving;

  function handleRequestSubmit() {
    if (!canSubmit) {
      return;
    }

    setErrorMessage("");
    setModalStep("confirm");
  }

  function handleConfirmCancel() {
    if (isSaving) {
      return;
    }

    setModalStep(null);
  }

  async function handleConfirmSave() {
    if (
      isSaving ||
      !canSubmit
    ) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      if (!useMock) {
        if (isEdit) {
          await updateSpaceNotice(
            initialNotice.id,
            {
              title:
                title.trim(),

              content,

              retainedFileIds:
                existingFiles
                  .map(
                    (file) =>
                      file.id,
                  )
                  .filter(
                    Boolean,
                  ),

              newFiles,
            },
          );
        } else {
          await createSpaceNotice(
            spaceId,
            {
              title:
                title.trim(),

              content,

              files:
                newFiles,
            },
          );
        }
      }

      setModalStep(
        "success",
      );
    } catch (error) {
      setModalStep(null);

      setErrorMessage(
        error?.response?.data
          ?.message ??
          error?.response?.data
            ?.detail ??
          (isEdit
            ? "공지사항 수정에 실패했습니다."
            : "공지사항 등록에 실패했습니다."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleSuccessConfirm() {
    onSaved?.({
      mode,

      noticeId:
        initialNotice?.id ??
        null,

      title:
        title.trim(),

      content,

      existingFiles,

      newFiles,
    });

    onBack?.();
  }

  return (
    <main className="notice-create-page">
      <div className="app-frame notice-create-frame">
        <button
          type="button"
          className="notice-create-back"
          aria-label="공지사항으로 돌아가기"
          onClick={onBack}
        >
          <img
            src={backIcon}
            alt=""
          />
        </button>

        <header className="notice-create-header">
          <h1>
            {spaceName}
          </h1>

          <p>
            <span>
              공지사항{" "}
            </span>

            <span className="notice-create-header__dot">
              ·
            </span>

            <span>
              {" "}
              {isEdit
                ? "수정"
                : "작성"}
            </span>
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

        <section className="notice-create-layout">
          <section className="notice-create-editor-panel">
            <input
              className="notice-create-title"
              type="text"
              value={title}
              placeholder="제목을 입력하세요"
              maxLength={100}
              onChange={(
                event,
              ) =>
                setTitle(
                  event
                    .target
                    .value,
                )
              }
            />

            <div
              className="notice-create-title-divider"
              aria-hidden="true"
            />

            <NoticeEditor
              key={`${mode}-${initialNotice?.id ?? "new"}`}
              value={content}
              onChange={
                setContent
              }
            />

            {errorMessage && (
              <p
                className="notice-create-error"
                role="alert"
              >
                {
                  errorMessage
                }
              </p>
            )}
          </section>

          <NoticeFileUploader
            files={
              newFiles
            }
            existingFiles={
              existingFiles
            }
            onChange={
              setNewFiles
            }
            onExistingFilesChange={
              setExistingFiles
            }
          />

          <button
            type="button"
            className="notice-create-submit"
            disabled={
              !canSubmit
            }
            onClick={
              handleRequestSubmit
            }
          >
            {isEdit
              ? "수정하기"
              : "등록하기"}
          </button>
        </section>

        <SpaceToolbar activeItem="notice" />

        <NoticeConfirmModal
          type={
            modalStep ===
            "success"
              ? "success"
              : "confirm"
          }
          mode={mode}
          isOpen={
            modalStep !==
            null
          }
          isSaving={
            isSaving
          }
          onCancel={
            handleConfirmCancel
          }
          onConfirm={
            modalStep ===
            "success"
              ? handleSuccessConfirm
              : handleConfirmSave
          }
        />
      </div>
    </main>
  );
}

export default SpaceNoticeCreateView;