import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import backIcon from "../../../assets/icons/go-back.svg";
import DeleteIcon from "../../../assets/icons/delete.svg?react";
import noticeCreateIcon from "../../../assets/icons/notice-create.svg";
import noticeEmptyIcon from "../../../assets/icons/notice-empty.svg";
import pdfIcon from "../../../assets/icons/pdf.svg";
import PencilEditIcon from "../../../assets/icons/pencil-edit.svg?react";
import moreIcon from "../../../assets/icons/space/space-more.svg";

import {
  AppToolbars,
} from "../../../components/common/AppToolbars.jsx";

import SpaceToolbar from "../../spaces/components/SpaceToolbar.jsx";

import {
  deleteSpaceNotice,
  getSpaceNoticeDetail,
  getSpaceNotices,
} from "../api/spaceNoticesApi.js";

import NoticeDeleteModal from "../components/NoticeDeleteModal.jsx";
import SpaceNoticeCreateView from "../components/SpaceNoticeCreateView.jsx";

import "../styles/spaceNotices.css";

function decodeJwtPayload(token) {
  try {
    if (!token) {
      return null;
    }

    const [, payload] =
      token.split(".");

    if (!payload) {
      return null;
    }

    const normalized =
      payload
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const decoded =
      decodeURIComponent(
        atob(normalized)
          .split("")
          .map(
            (character) =>
              `%${character
                .charCodeAt(0)
                .toString(16)
                .padStart(
                  2,
                  "0",
                )}`,
          )
          .join(""),
      );

    return JSON.parse(
      decoded,
    );
  } catch {
    return null;
  }
}

function normalizeRoleValues(
  value,
) {
  if (!value) {
    return [];
  }

  if (
    Array.isArray(
      value,
    )
  ) {
    return value.flatMap(
      normalizeRoleValues,
    );
  }

  if (
    typeof value ===
    "object"
  ) {
    return Object.values(
      value,
    ).flatMap(
      normalizeRoleValues,
    );
  }

  return [
    String(
      value,
    ).toUpperCase(),
  ];
}

function isNoticeWriterRole(
  role,
) {
  const normalizedRole =
    String(
      role || "",
    ).toUpperCase();

  return (
    normalizedRole.includes(
      "PROFESSOR",
    ) ||
    normalizedRole.includes(
      "ASSISTANT",
    )
  );
}

function readStoredRoleValues() {
  const storedValues = [];

  const userStorageKeys = [
    "tikitaka_user",
    "user",
  ];

  userStorageKeys.forEach(
    (key) => {
      const rawValue =
        localStorage.getItem(
          key,
        );

      if (!rawValue) {
        return;
      }

      try {
        storedValues.push(
          JSON.parse(
            rawValue,
          ),
        );
      } catch {
        storedValues.push(
          rawValue,
        );
      }
    },
  );

  storedValues.push(
    localStorage.getItem(
      "tikitaka_account_type",
    ),
    localStorage.getItem(
      "account_type",
    ),
    localStorage.getItem(
      "role",
    ),
  );

  return normalizeRoleValues(
    storedValues,
  );
}

function canWriteNotice(
  locationState,
) {
  const token =
    localStorage.getItem(
      "tikitaka_access_token",
    );

  const payload =
    decodeJwtPayload(
      token,
    );

  const roles =
    normalizeRoleValues([
      locationState?.role,
      locationState?.userRole,
      locationState?.user_role,
      locationState?.spaceRole,
      locationState?.space_role,

      ...readStoredRoleValues(),

      payload?.role,
      payload?.roles,
      payload?.userRole,
      payload?.user_role,
      payload?.accountType,
      payload?.account_type,
      payload?.spaceRole,
      payload?.space_role,
      payload?.authority,
      payload?.authorities,
    ]);

  return roles.some(
    isNoticeWriterRole,
  );
}

function normalizeNotice(
  notice,
) {
  return {
    id:
      notice.notice_id ??
      notice.id ??
      "",

    title:
      notice.title ??
      "",

    preview:
      notice.content_preview ??
      notice.contentPreview ??
      "",

    createdAt:
      notice.created_at ??
      notice.createdAt ??
      "",

    isRead: Boolean(
      notice.is_read ??
        notice.isRead,
    ),
  };
}

function normalizeNoticeDetail(
  notice,
) {
  if (!notice) {
    return null;
  }

  return {
    id:
      notice.notice_id ??
      notice.id ??
      "",

    title:
      notice.title ??
      "",

    createdAt:
      notice.created_at ??
      notice.createdAt ??
      "",

    authorName:
      notice.author_name ??
      notice.authorName ??
      "",

    viewCount: Number(
      notice.view_count ??
        notice.viewCount ??
        0,
    ),

    content:
      notice.content ??
      "",

    files:
      Array.isArray(
        notice.files,
      )
        ? notice.files.map(
            (file) => ({
              id:
                file.file_id ??
                file.id ??
                "",

              name:
                file.file_name ??
                file.fileName ??
                "",

              url:
                file.file_url ??
                file.fileUrl ??
                "#",

              sizeText:
                file.file_size_text ??
                file.fileSizeText ??
                "",
            }),
          )
        : [],
  };
}

function formatListDate(
  value,
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return `${
    date.getMonth() + 1
  }.${date.getDate()}`;
}

function formatDetailDate(
  value,
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(
      value,
    );

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

function makePreview(
  content,
) {
  return String(
    content ?? "",
  )
    .replace(
      /<[^>]*>/g,
      "",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim()
    .slice(
      0,
      60,
    );
}

function NoticeEmptyState({
  title,
  description,
}) {
  return (
    <div className="notice-empty">
      <div
        className="notice-empty__icon"
        aria-hidden="true"
      >
        <img
          src={noticeEmptyIcon}
          alt=""
        />
      </div>

      <strong>
        {title}
      </strong>

      <p>
        {description}
      </p>
    </div>
  );
}

function SpaceNoticePage() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    spaceId,
  } = useParams();

  const [
    searchParams,
    setSearchParams,
  ] =
    useSearchParams();

  const spaceName =
    location.state?.spaceName ||
    "Space";

  const showCreateButton =
    useMemo(
      () =>
        canWriteNotice(
          location.state,
        ),
      [
        location.state,
      ],
    );

  const mode =
    searchParams.get(
      "mode",
    );

  const isCreateMode =
    mode === "create";

  const isEditMode =
    mode === "edit";

  const editNoticeId =
    searchParams.get(
      "noticeId",
    );

  const targetNoticeId =
    !isCreateMode &&
    !isEditMode
      ? editNoticeId
      : null;

  const [
    notices,
    setNotices,
  ] =
    useState([]);

  const [
    selectedNoticeId,
    setSelectedNoticeId,
  ] =
    useState(null);

  const [
    selectedNotice,
    setSelectedNotice,
  ] =
    useState(null);

  const [
    editingNotice,
    setEditingNotice,
  ] =
    useState(null);

  const [
    unreadCount,
    setUnreadCount,
  ] =
    useState(0);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    detailLoading,
    setDetailLoading,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    isNoticeMenuOpen,
    setIsNoticeMenuOpen,
  ] =
    useState(false);

  const [
    deleteModalType,
    setDeleteModalType,
  ] =
    useState(null);

  const [
    isDeleting,
    setIsDeleting,
  ] =
    useState(false);

  const [
    deletedNoticeId,
    setDeletedNoticeId,
  ] =
    useState(null);

  useEffect(
    () => {
      if (
        !isNoticeMenuOpen
      ) {
        return undefined;
      }

      function handleOutsideClick(
        event,
      ) {
        if (
          !event.target.closest(
            ".notice-detail__menu-wrapper",
          )
        ) {
          setIsNoticeMenuOpen(
            false,
          );
        }
      }

      function handleEscape(
        event,
      ) {
        if (
          event.key ===
          "Escape"
        ) {
          setIsNoticeMenuOpen(
            false,
          );
        }
      }

      document.addEventListener(
        "mousedown",
        handleOutsideClick,
      );

      document.addEventListener(
        "keydown",
        handleEscape,
      );

      return () => {
        document.removeEventListener(
          "mousedown",
          handleOutsideClick,
        );

        document.removeEventListener(
          "keydown",
          handleEscape,
        );
      };
    },
    [
      isNoticeMenuOpen,
    ],
  );

  useEffect(
    () => {
      if (
        isCreateMode ||
        isEditMode
      ) {
        return undefined;
      }

      const controller =
        new AbortController();

      async function loadNotices() {
        setIsLoading(
          true,
        );

        setErrorMessage(
          "",
        );

        try {
          const response =
            await getSpaceNotices(
              spaceId,
              {
                signal:
                  controller
                    .signal,
              },
            );

          if (
            controller
              .signal
              .aborted
          ) {
            return;
          }

          const list =
            Array.isArray(
              response?.notices,
            )
              ? response.notices
              : [];

          setNotices(
            list.map(
              normalizeNotice,
            ),
          );

          setUnreadCount(
            Number(
              response?.unread_count ??
                response?.unreadCount ??
                0,
            ),
          );
        } catch (
          error
        ) {
          if (
            error?.code !==
            "ERR_CANCELED"
          ) {
            setErrorMessage(
              error?.response?.data
                ?.message ??
                error?.response?.data
                  ?.detail ??
                "공지사항을 불러오지 못했습니다.",
            );
          }
        } finally {
          if (
            !controller
              .signal
              .aborted
          ) {
            setIsLoading(
              false,
            );
          }
        }
      }

      loadNotices();

      return () => {
        controller.abort();
      };
    },
    [
      spaceId,
      isCreateMode,
      isEditMode,
    ],
  );

  useEffect(
    () => {
      if (
        !isEditMode ||
        !editNoticeId ||
        editingNotice
      ) {
        return undefined;
      }

      let isCancelled =
        false;

      async function loadEditingNotice() {
        try {
          const response =
            await getSpaceNoticeDetail(
              editNoticeId,
            );

          if (
            !isCancelled
          ) {
            setEditingNotice(
              normalizeNoticeDetail(
                response,
              ),
            );
          }
        } catch {
          if (
            !isCancelled
          ) {
            setSearchParams(
              {},
            );
          }
        }
      }

      loadEditingNotice();

      return () => {
        isCancelled =
          true;
      };
    },
    [
      editNoticeId,
      editingNotice,
      isEditMode,
      setSearchParams,
    ],
  );

  useEffect(
    () => {
      if (
        !targetNoticeId ||
        isLoading
      ) {
        return undefined;
      }

      let isCancelled =
        false;

      async function loadTargetNotice() {
        setSelectedNoticeId(
          targetNoticeId,
        );

        setSelectedNotice(
          null,
        );

        setDetailLoading(
          true,
        );

        setErrorMessage(
          "",
        );

        try {
          const response =
            await getSpaceNoticeDetail(
              targetNoticeId,
            );

          if (
            isCancelled
          ) {
            return;
          }

          setSelectedNotice(
            normalizeNoticeDetail(
              response,
            ),
          );

          setNotices(
            (current) => {
              let wasUnread =
                false;

              const next =
                current.map(
                  (notice) => {
                    if (
                      notice.id !==
                      targetNoticeId
                    ) {
                      return notice;
                    }

                    wasUnread =
                      !notice.isRead;

                    return {
                      ...notice,
                      isRead: true,
                    };
                  },
                );

              if (
                wasUnread
              ) {
                setUnreadCount(
                  (count) =>
                    Math.max(
                      0,
                      count - 1,
                    ),
                );
              }

              return next;
            },
          );
        } catch (
          error
        ) {
          if (
            isCancelled
          ) {
            return;
          }

          setSelectedNotice(
            null,
          );

          setErrorMessage(
            error?.response?.data
              ?.message ??
              error?.response?.data
                ?.detail ??
              "공지사항을 불러오지 못했습니다.",
          );
        } finally {
          if (
            !isCancelled
          ) {
            setDetailLoading(
              false,
            );
          }
        }
      }

      loadTargetNotice();

      return () => {
        isCancelled =
          true;
      };
    },
    [
      isLoading,
      targetNoticeId,
    ],
  );

  async function handleSelectNotice(
    notice,
  ) {
    if (
      !notice?.id ||
      detailLoading
    ) {
      return;
    }

    setIsNoticeMenuOpen(
      false,
    );

    setSelectedNoticeId(
      notice.id,
    );

    setDetailLoading(
      true,
    );

    setErrorMessage(
      "",
    );

    try {
      const response =
        await getSpaceNoticeDetail(
          notice.id,
        );

      const detail =
        normalizeNoticeDetail(
          response,
        );

      setSelectedNotice(
        detail,
      );

      if (
        !notice.isRead
      ) {
        setNotices(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                notice.id
                  ? {
                      ...item,
                      isRead:
                        true,
                    }
                  : item,
            ),
        );

        setUnreadCount(
          (current) =>
            Math.max(
              0,
              current - 1,
            ),
        );
      }
    } catch (
      error
    ) {
      setSelectedNotice(
        null,
      );

      setErrorMessage(
        error?.response?.data
          ?.message ??
          error?.response?.data
            ?.detail ??
          "공지사항을 불러오지 못했습니다.",
      );
    } finally {
      setDetailLoading(
        false,
      );
    }
  }

  function handleFileClick(
    file,
  ) {
    if (
      !file?.url ||
      file.url === "#"
    ) {
      return;
    }

    window.open(
      file.url,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function handleEditNotice() {
    if (
      !selectedNotice
    ) {
      return;
    }

    setIsNoticeMenuOpen(
      false,
    );

    setEditingNotice(
      selectedNotice,
    );

    setSearchParams({
      mode: "edit",
      noticeId:
        selectedNotice.id,
    });
  }

  function handleDeleteNotice() {
    if (
      !selectedNotice
    ) {
      return;
    }

    setIsNoticeMenuOpen(
      false,
    );

    setDeletedNoticeId(
      null,
    );

    setDeleteModalType(
      "confirm",
    );
  }

  function handleCancelDelete() {
    if (
      isDeleting
    ) {
      return;
    }

    setDeletedNoticeId(
      null,
    );

    setDeleteModalType(
      null,
    );
  }

  async function handleConfirmDelete() {
    if (
      !selectedNotice ||
      isDeleting
    ) {
      return;
    }

    const noticeId =
      selectedNotice.id;

    setIsDeleting(
      true,
    );

    setErrorMessage(
      "",
    );

    try {
      await deleteSpaceNotice(
        noticeId,
      );

      setDeletedNoticeId(
        noticeId,
      );

      setDeleteModalType(
        "success",
      );
    } catch (
      error
    ) {
      setDeleteModalType(
        null,
      );

      setErrorMessage(
        error?.response?.data
          ?.message ??
          error?.response?.data
            ?.detail ??
          "공지사항을 삭제하지 못했습니다.",
      );
    } finally {
      setIsDeleting(
        false,
      );
    }
  }

  function handleDeleteSuccessConfirm() {
    if (
      deletedNoticeId
    ) {
      setNotices(
        (current) =>
          current.filter(
            (notice) =>
              notice.id !==
              deletedNoticeId,
          ),
      );
    }

    setSelectedNoticeId(
      null,
    );

    setSelectedNotice(
      null,
    );

    setEditingNotice(
      null,
    );

    setDeletedNoticeId(
      null,
    );

    setDeleteModalType(
      null,
    );
  }

  function handleEditorBack() {
    setEditingNotice(
      null,
    );

    setSearchParams(
      {},
    );
  }

  function handleNoticeSaved(
    result,
  ) {
    if (
      result.mode ===
      "edit"
    ) {
      setSelectedNotice(
        (current) => {
          if (
            !current
          ) {
            return current;
          }

          return {
            ...current,
            title:
              result.title,
            content:
              result.content,
            files:
              result.existingFiles,
          };
        },
      );

      setNotices(
        (current) =>
          current.map(
            (notice) =>
              notice.id ===
              result.noticeId
                ? {
                    ...notice,
                    title:
                      result.title,
                    preview:
                      makePreview(
                        result.content,
                      ),
                  }
                : notice,
          ),
      );
    }

    setEditingNotice(
      null,
    );
  }

  if (
    isCreateMode
  ) {
    return (
      <SpaceNoticeCreateView
        spaceId={
          spaceId
        }
        spaceName={
          spaceName
        }
        mode="create"
        useMock={
          false
        }
        onBack={
          handleEditorBack
        }
        onSaved={
          handleNoticeSaved
        }
      />
    );
  }

  if (
    isEditMode
  ) {
    if (
      !editingNotice
    ) {
      return (
        <main className="notice-create-page">
          <div className="notice-create-edit-loading">
            공지사항을 불러오는 중입니다.
          </div>
        </main>
      );
    }

    return (
      <SpaceNoticeCreateView
        spaceId={
          spaceId
        }
        spaceName={
          spaceName
        }
        mode="edit"
        initialNotice={
          editingNotice
        }
        useMock={
          false
        }
        onBack={
          handleEditorBack
        }
        onSaved={
          handleNoticeSaved
        }
      />
    );
  }

  return (
    <main className="notice-page space-page-transition">
      <div
        className="notice-background"
        aria-hidden="true"
      >
        <div className="notice-page__orb notice-page__orb--left" />
        <div className="notice-page__orb notice-page__orb--right" />
      </div>

      <div className="app-frame notice-frame">
        <button
          type="button"
          className="notice-back"
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

        <header className="notice-header">
          <h1>
            {spaceName}
          </h1>

          <p>
            공지사항
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

        <section className="notice-layout">
          <aside className="notice-list-panel">
            <div className="notice-list-panel__header">
              <span>
                최신순
              </span>

              <strong>
                읽지 않음{" "}
                {
                  unreadCount
                }
              </strong>
            </div>

            <div className="notice-list-panel__divider" />

            {isLoading && (
              <div className="notice-list-panel__state">
                공지사항을 불러오는 중입니다.
              </div>
            )}

            {!isLoading &&
              errorMessage &&
              notices.length ===
                0 && (
                <div className="notice-list-panel__state notice-list-panel__state--error">
                  {
                    errorMessage
                  }
                </div>
              )}

            {!isLoading &&
              notices.length >
                0 && (
                <div className="notice-list">
                  {notices.map(
                    (notice) => (
                      <button
                        type="button"
                        key={
                          notice.id
                        }
                        className={`notice-list-item${
                          selectedNoticeId ===
                          notice.id
                            ? " is-selected"
                            : ""
                        }`}
                        onClick={() =>
                          handleSelectNotice(
                            notice,
                          )
                        }
                      >
                        <span
                          className={`notice-list-item__dot${
                            notice.isRead
                              ? " is-read"
                              : ""
                          }`}
                        />

                        <span className="notice-list-item__body">
                          <strong>
                            {
                              notice.title
                            }
                          </strong>

                          <small>
                            {
                              notice.preview
                            }
                          </small>
                        </span>

                        <span className="notice-list-item__date">
                          {formatListDate(
                            notice.createdAt,
                          )}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              )}

            {showCreateButton && (
              <button
                type="button"
                className="notice-write-button"
                aria-label="공지사항 작성"
                onClick={() =>
                  setSearchParams({
                    mode: "create",
                  })
                }
              >
                <img
                  src={
                    noticeCreateIcon
                  }
                  alt=""
                />
              </button>
            )}
          </aside>

          <section className="notice-detail-panel">
            {!selectedNoticeId ? (
              <NoticeEmptyState
                title="공지사항을 선택해 확인하세요"
                description="왼쪽 목록에서 확인할 공지사항을 선택해 주세요."
              />
            ) : detailLoading ? (
              <div className="notice-detail-panel__state">
                공지사항을 불러오는 중입니다.
              </div>
            ) : selectedNotice ? (
              <article className="notice-detail">
                {showCreateButton && (
                  <div className="notice-detail__menu-wrapper">
                    <button
                      type="button"
                      className={`notice-detail__more${
                        isNoticeMenuOpen
                          ? " is-active"
                          : ""
                      }`}
                      onClick={() =>
                        setIsNoticeMenuOpen(
                          (current) =>
                            !current,
                        )
                      }
                    >
                      <img
                        src={
                          moreIcon
                        }
                        alt=""
                      />
                    </button>

                    {isNoticeMenuOpen && (
                      <div className="notice-detail-menu">
                        <button
                          type="button"
                          onClick={
                            handleEditNotice
                          }
                        >
                          <PencilEditIcon />

                          <span>
                            수정
                          </span>
                        </button>

                        <button
                          type="button"
                          className="notice-detail-menu__delete"
                          onClick={
                            handleDeleteNotice
                          }
                        >
                          <DeleteIcon />

                          <span>
                            삭제
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <h2>
                  {
                    selectedNotice
                      .title
                  }
                </h2>

                <div className="notice-detail__meta">
                  <span>
                    {formatDetailDate(
                      selectedNotice
                        .createdAt,
                    )}
                  </span>

                  <span>
                    ·
                  </span>

                  <span>
                    {
                      selectedNotice
                        .authorName
                    }
                  </span>

                  <span>
                    ·
                  </span>

                  <span>
                    조회{" "}
                    {
                      selectedNotice
                        .viewCount
                    }
                    회
                  </span>
                </div>

                <div className="notice-detail__divider notice-detail__divider--top" />

                <div className="notice-detail__content">
                  {
                    selectedNotice
                      .content
                  }
                </div>

                <div className="notice-detail__divider notice-detail__divider--files" />

                <div className="notice-detail__attachments">
                  <div className="notice-detail__attachments-title">
                    <strong>
                      첨부파일
                    </strong>

                    <span>
                      {
                        selectedNotice
                          .files
                          .length
                      }
                      개
                    </span>
                  </div>

                  <div className="notice-detail__file-list">
                    {selectedNotice.files.map(
                      (file) => (
                        <button
                          type="button"
                          key={
                            file.id
                          }
                          className="notice-detail__file"
                          onClick={() =>
                            handleFileClick(
                              file,
                            )
                          }
                        >
                          <img
                            src={
                              pdfIcon
                            }
                            alt=""
                            className="notice-detail__file-icon"
                          />

                          <strong>
                            {
                              file.name
                            }
                          </strong>

                          {file.sizeText && (
                            <span>
                              (
                              {
                                file.sizeText
                              }
                              )
                            </span>
                          )}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </article>
            ) : null}
          </section>
        </section>

        <SpaceToolbar
          activeItem="notice"
          spaceId={
            spaceId
          }
          spaceName={
            spaceName
          }
        />

        <NoticeDeleteModal
          type={
            deleteModalType ||
            "confirm"
          }
          isOpen={
            Boolean(
              deleteModalType,
            )
          }
          isDeleting={
            isDeleting
          }
          onCancel={
            handleCancelDelete
          }
          onConfirm={
            deleteModalType ===
            "success"
              ? handleDeleteSuccessConfirm
              : handleConfirmDelete
          }
        />
      </div>
    </main>
  );
}

export default SpaceNoticePage;