import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import backIcon from "../../../assets/icons/go-back.svg";
import noticeEmptyIcon from "../../../assets/icons/notice-empty.svg";
import moreIcon from "../../../assets/icons/more.svg";
import pdfIcon from "../../../assets/icons/pdf.svg";

import { AppToolbars } from "../../../components/common/AppToolbars.jsx";
import SpaceToolbar from "../../spaces/components/SpaceToolbar.jsx";

import {
  getSpaceNoticeDetail,
  getSpaceNotices,
} from "../api/spaceNoticesApi.js";

import {
  MOCK_NOTICE_DETAILS,
  MOCK_NOTICE_LIST,
} from "../data/noticeMock.js";

import "../styles/spaceNotices.css";

const USE_NOTICE_MOCK = true;

function normalizeNotice(notice) {
  return {
    id: notice.notice_id ?? notice.id ?? "",
    title: notice.title ?? "",
    preview: notice.content_preview ?? notice.contentPreview ?? "",
    createdAt: notice.created_at ?? notice.createdAt ?? "",
    isRead: Boolean(notice.is_read ?? notice.isRead),
  };
}

function normalizeNoticeDetail(notice) {
  if (!notice) {
    return null;
  }

  return {
    id: notice.notice_id ?? notice.id ?? "",
    title: notice.title ?? "",
    createdAt: notice.created_at ?? notice.createdAt ?? "",
    authorName: notice.author_name ?? notice.authorName ?? "",
    viewCount: Number(
      notice.view_count ??
        notice.viewCount ??
        0,
    ),
    content: notice.content ?? "",
    files: Array.isArray(notice.files)
      ? notice.files.map((file) => ({
          id: file.file_id ?? file.id ?? "",
          name: file.file_name ?? file.fileName ?? "",
          url: file.file_url ?? file.fileUrl ?? "#",
          sizeText:
            file.file_size_text ??
            file.fileSizeText ??
            "",
        }))
      : [],
  };
}

function formatListDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getMonth() + 1}.${date.getDate()}`;
}

function formatDetailDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
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

      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function SpaceNoticePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { spaceId } = useParams();

  const spaceName =
    location.state?.spaceName ||
    "실무중심산학협력프로젝트1";

  const [notices, setNotices] = useState([]);
  const [selectedNoticeId, setSelectedNoticeId] =
    useState(null);
  const [selectedNotice, setSelectedNotice] =
    useState(null);
  const [unreadCount, setUnreadCount] =
    useState(0);
  const [isLoading, setIsLoading] =
    useState(true);
  const [detailLoading, setDetailLoading] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadNotices() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = USE_NOTICE_MOCK
          ? MOCK_NOTICE_LIST
          : await getSpaceNotices(
              spaceId,
              {
                signal:
                  controller.signal,
              },
            );

        if (
          controller.signal.aborted
        ) {
          return;
        }

        const list = Array.isArray(
          response?.notices,
        )
          ? response.notices
          : Array.isArray(response)
            ? response
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
              list.filter(
                (notice) =>
                  !(
                    notice.is_read ??
                    notice.isRead
                  ),
              ).length,
          ),
        );
      } catch (error) {
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
          !controller.signal
            .aborted
        ) {
          setIsLoading(false);
        }
      }
    }

    loadNotices();

    return () => {
      controller.abort();
    };
  }, [spaceId]);

  async function handleSelectNotice(
    notice,
  ) {
    if (
      !notice?.id ||
      detailLoading
    ) {
      return;
    }

    setSelectedNoticeId(
      notice.id,
    );

    setDetailLoading(true);
    setErrorMessage("");

    try {
      const response =
        USE_NOTICE_MOCK
          ? MOCK_NOTICE_DETAILS[
              notice.id
            ]
          : await getSpaceNoticeDetail(
              notice.id,
            );

      setSelectedNotice(
        normalizeNoticeDetail(
          response,
        ),
      );

      if (!notice.isRead) {
        setNotices(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                notice.id
                  ? {
                      ...item,
                      isRead: true,
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
    } catch (error) {
      setSelectedNotice(null);

      setErrorMessage(
        error?.response?.data
          ?.message ??
          error?.response?.data
            ?.detail ??
          "공지사항을 불러오지 못했습니다.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function handleFileClick(file) {
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

  return (
    <main className="notice-page">
      <div
        className="notice-page__orb notice-page__orb--left-middle"
        aria-hidden="true"
      />

      <div
        className="notice-page__orb notice-page__orb--right-top"
        aria-hidden="true"
      />

      <div
        className="notice-page__orb notice-page__orb--left-bottom"
        aria-hidden="true"
      />

      <div className="app-frame notice-frame">
        <button
          type="button"
          className="notice-back"
          aria-label="Space 목록으로 돌아가기"
          onClick={() =>
            navigate("/spaces")
          }
        >
          <img
            src={backIcon}
            alt=""
          />
        </button>

        <header className="notice-header">
          <h1>{spaceName}</h1>
          <p>공지사항</p>
        </header>

        <AppToolbars
          showBottomNavigation={
            false
          }
          onSearch={() =>
            navigate("/search")
          }
        />

        <section
          className="notice-layout"
          aria-label={`${spaceName} 공지사항`}
        >
          <aside className="notice-list-panel">
            <div className="notice-list-panel__header">
              <span>최신순</span>

              <strong>
                읽지 않음{" "}
                {unreadCount}
              </strong>
            </div>

            <div
              className="notice-list-panel__divider"
              aria-hidden="true"
            />

            {isLoading && (
              <div className="notice-list-panel__state">
                공지사항을 불러오는
                중입니다.
              </div>
            )}

            {!isLoading &&
              errorMessage &&
              !selectedNotice && (
                <div className="notice-list-panel__state notice-list-panel__state--error">
                  {errorMessage}
                </div>
              )}

            {!isLoading &&
              !errorMessage &&
              notices.length ===
                0 && (
                <div className="notice-list-panel__state">
                  공지사항이 없습니다.
                </div>
              )}

            {!isLoading &&
              notices.length > 0 && (
                <div className="notice-list">
                  {notices.map(
                    (notice) => {
                      const isSelected =
                        selectedNoticeId ===
                        notice.id;

                      return (
                        <button
                          type="button"
                          key={
                            notice.id
                          }
                          className={`notice-list-item${
                            isSelected
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
                            aria-hidden="true"
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
                      );
                    },
                  )}
                </div>
              )}
          </aside>

          <section className="notice-detail-panel">
            {notices.length ===
              0 &&
            !isLoading ? (
              <NoticeEmptyState
                title="등록된 공지사항이 없습니다."
                description="새로운 공지사항이 등록되면 이곳에서 확인할 수 있습니다."
              />
            ) : !selectedNoticeId ? (
              <NoticeEmptyState
                title="공지사항을 선택해 확인하세요"
                description="왼쪽 목록에서 확인할 공지사항을 선택해 주세요."
              />
            ) : detailLoading ? (
              <div className="notice-detail-panel__state">
                공지사항을 불러오는
                중입니다.
              </div>
            ) : selectedNotice ? (
              <article className="notice-detail">
                <button
                  type="button"
                  className="notice-detail__more"
                  aria-label="공지사항 더보기"
                >
                  <img
                    src={moreIcon}
                    alt=""
                  />
                </button>

                <h2>
                  {
                    selectedNotice.title
                  }
                </h2>

                <div className="notice-detail__meta">
                  <span>
                    {formatDetailDate(
                      selectedNotice.createdAt,
                    )}
                  </span>

                  <span
                    aria-hidden="true"
                  >
                    ·
                  </span>

                  <span>
                    {
                      selectedNotice.authorName
                    }
                  </span>

                  <span
                    aria-hidden="true"
                  >
                    ·
                  </span>

                  <span>
                    조회{" "}
                    {
                      selectedNotice.viewCount
                    }
                    회
                  </span>
                </div>

                <div
                  className="notice-detail__divider notice-detail__divider--top"
                  aria-hidden="true"
                />

                <div className="notice-detail__content">
                  {
                    selectedNotice.content
                  }
                </div>

                <div
                  className="notice-detail__divider notice-detail__divider--files"
                  aria-hidden="true"
                />

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

                  {selectedNotice
                    .files.length >
                  0 ? (
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
                  ) : (
                    <p className="notice-detail__no-files">
                      첨부파일이 없습니다.
                    </p>
                  )}
                </div>
              </article>
            ) : (
              <div className="notice-detail-panel__state">
                공지사항을 불러오지
                못했습니다.
              </div>
            )}
          </section>
        </section>

        <SpaceToolbar activeItem="notice" />
      </div>
    </main>
  );
}

export default SpaceNoticePage;
