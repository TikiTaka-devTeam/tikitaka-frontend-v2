import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import mockMaterialPreview from "../../../assets/images/search-material-preview.png";
import { BottomNavigation, SearchToolbar } from "../../../components/common/AppToolbars.jsx";
import BrandLogo from "../../../components/common/BrandLogo.jsx";
import { getDocumentSlides } from "../../lecture/api/lectureApi.js";
import { searchAll } from "../api/searchApi.js";
import RecentSearchChip from "../components/RecentSearchChip.jsx";
import SearchDocumentCard from "../components/SearchDocumentCard.jsx";
import SearchResultCard from "../components/SearchResultCard.jsx";
import "../styles/search.css";

const MOCK_RECENT_SEARCHES = [
  { search_id: "mock-search-1", keyword: "자료구조" },
  { search_id: "mock-search-2", keyword: "데이터베이스" },
  { search_id: "mock-search-3", keyword: "Spring" },
];

const MOCK_RECENT_DOCUMENTS = Array.from({ length: 3 }, (_, index) => ({
  id: `mock-document-${index + 1}`,
  title: "7강. 으갸갸갸갹",
  thumbnailUrl: mockMaterialPreview,
  meta: "2026.05.10 · 34페이지",
}));

const MOCK_RECENT_QUESTIONS = Array.from({ length: 3 }, (_, index) => ({
  id: `mock-question-${index + 1}`,
  title: "PWM 출력 주파수가 계산값보다 느립니다",
  meta: "PWM · 답변 5",
}));

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll(". ", ".")
    .replace(/\.$/, "");
}

function readUserRole() {
  try {
    const user = JSON.parse(localStorage.getItem("tikitaka_user") || "null");
    return String(
      user?.account_type
      ?? user?.accountType
      ?? user?.role
      ?? user?.user?.account_type
      ?? user?.user?.accountType
      ?? user?.user?.role
      ?? "",
    ).toUpperCase();
  } catch {
    return "";
  }
}

function getArray(value, ...keys) {
  if (Array.isArray(value)) return value;
  for (const key of keys) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
}

function normalizeDocument(document) {
  const uploadedAt = document.uploaded_at ?? document.uploadedAt;
  const viewedAt = document.viewed_at ?? document.viewedAt;
  const pageCount = document.page_count ?? document.pageCount;
  const detailParts = [formatDate(uploadedAt || viewedAt)];

  if (pageCount !== undefined && pageCount !== null) {
    detailParts.push(`${pageCount}페이지`);
  }

  return {
    ...document,
    id: document.document_id ?? document.documentId ?? document.id,
    spaceId: document.space_id ?? document.spaceId,
    spaceName: document.space_name ?? document.spaceName ?? "Space",
    title: document.title ?? "강의자료",
    thumbnailUrl: document.thumbnail_url ?? document.thumbnailUrl ?? "",
    pageCount,
    uploadedAt,
    meta: detailParts.filter(Boolean).join(" · "),
  };
}

function normalizeResultItem(item, type) {
  const isNotice = type === "notice";
  const categories = getArray(item?.categories)
    .map((category) => category.category_name ?? category.name)
    .filter(Boolean);
  const spaceName = item.space_name ?? item.spaceName ?? "Space";
  const createdAt = item.created_at ?? item.createdAt;
  const metaParts = [spaceName];

  if (!isNotice && categories.length > 0) {
    metaParts.push(categories.join(", "));
  } else if (createdAt) {
    metaParts.push(formatDate(createdAt));
  }

  return {
    ...item,
    id: isNotice
      ? item.announcement_id ?? item.notice_id ?? item.id
      : item.question_id ?? item.questionId ?? item.id,
    spaceId: item.space_id ?? item.spaceId,
    spaceName,
    title: item.title ?? (isNotice ? "공지사항" : "질문"),
    meta: metaParts.filter(Boolean).join(" · "),
  };
}

function SearchSection({ children, count, title, variant }) {
  return (
    <section className={`search-section search-section--${variant}`}>
      <header className="search-section__heading">
        <h2>{title}</h2>
        {count !== undefined ? <span>{count}</span> : null}
      </header>
      {children}
    </section>
  );
}

function SearchPage() {
  const navigate = useNavigate();
  const searchRequestIdRef = useRef(0);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState(MOCK_RECENT_SEARCHES);
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");

  async function runSearch(nextKeyword = query) {
    const keyword = nextKeyword.trim();

    if (!keyword) {
      setSubmittedQuery("");
      setResults(null);
      setErrorMessage("");
      return;
    }

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;
    setQuery(keyword);
    setSubmittedQuery(keyword);
    setIsSearching(true);
    setErrorMessage("");

    try {
      const response = await searchAll(keyword);
      if (searchRequestIdRef.current !== requestId) return;

      setResults({
        notices: getArray(response, "announcements", "notices")
          .map((notice) => normalizeResultItem(notice, "notice")),
        documents: getArray(response, "documents").map(normalizeDocument),
        questions: getArray(response, "questions")
          .map((question) => normalizeResultItem(question, "question")),
      });

      setRecentSearches((items) => [
        { search_id: `mock-search-${Date.now()}`, keyword },
        ...items.filter((item) => item.keyword !== keyword),
      ].slice(0, 3));
    } catch (error) {
      if (searchRequestIdRef.current !== requestId) return;
      setResults(null);
      setErrorMessage(
        error?.response?.data?.message
        ?? error?.response?.data?.detail
        ?? "검색 결과를 불러오지 못했습니다.",
      );
    } finally {
      if (searchRequestIdRef.current === requestId) setIsSearching(false);
    }
  }

  function handleDeleteRecent(searchId) {
    setRecentSearches((items) => items.filter((item) => (
      (item.search_id ?? item.searchId ?? item.id) !== searchId
    )));
  }

  function handleDeleteAllRecent() {
    setRecentSearches([]);
  }

  function openNotice(notice) {
    if (!notice.spaceId || !notice.id) return;
    navigate(`/spaces/${encodeURIComponent(notice.spaceId)}/notices?noticeId=${encodeURIComponent(notice.id)}`, {
      state: { spaceName: notice.spaceName },
    });
  }

  function openQuestion(question) {
    if (!question.spaceId || !question.id) return;
    navigate(`/spaces/${encodeURIComponent(question.spaceId)}/questions?questionId=${encodeURIComponent(question.id)}`, {
      state: { spaceName: question.spaceName },
    });
  }

  async function openDocument(document) {
    if (!document.spaceId || !document.id) return;
    setActionError("");

    try {
      const response = await getDocumentSlides(document.id);
      const viewerRole = readUserRole() === "PROFESSOR" ? "professor" : "student";

      navigate(
        `/spaces/${encodeURIComponent(document.spaceId)}/documents/${encodeURIComponent(document.id)}/lecture/${viewerRole}`,
        {
          state: {
            documentId: document.id,
            documentTitle: document.title,
            spaceName: document.spaceName,
            pdfUrl: response?.pdf_url ?? response?.pdfUrl ?? "",
            pageCount: response?.page_count ?? response?.pageCount ?? document.pageCount,
            slides: response?.slides ?? [],
          },
        },
      );
    } catch (error) {
      setActionError(
        error?.response?.data?.message
        ?? error?.response?.data?.detail
        ?? "강의자료를 열지 못했습니다.",
      );
    }
  }

  const hasResults = results && (
    results.notices.length > 0
    || results.documents.length > 0
    || results.questions.length > 0
  );
  return (
    <main className="search-page space-page-transition">
      <div className="search-page__background" aria-hidden="true">
        <div className="search-page__orb search-page__orb--left" />
        <div className="search-page__orb search-page__orb--right" />
      </div>

      <div className={`app-frame search-page__frame${submittedQuery ? "" : " is-overview"}`}>
        <BrandLogo variant="blue" className="app-brand" />
        <SearchToolbar
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onSubmit={() => runSearch()}
        />
        <BottomNavigation />

        <div className={`app-container search-page__content${submittedQuery ? "" : " is-overview-fixed"}`}>
          {actionError ? <p className="search-page__action-error" role="alert">{actionError}</p> : null}

          {submittedQuery ? (
            <div className="search-results" aria-live="polite" aria-busy={isSearching}>
              {isSearching ? <p className="search-page__status">검색 중입니다.</p> : null}
              {errorMessage ? <p className="search-page__status search-page__status--error" role="alert">{errorMessage}</p> : null}
              {!isSearching && !errorMessage && !hasResults ? (
                <p className="search-page__status">‘{submittedQuery}’과 관련된 내용을 찾지 못했습니다.</p>
              ) : null}

              {!isSearching && !errorMessage && hasResults ? (
                <>
                  <SearchSection title="공지" count={results.notices.length} variant="notices">
                    <div className="search-result-card-grid">
                      {results.notices.map((notice) => (
                        <SearchResultCard key={notice.id} item={notice} type="notice" onSelect={openNotice} />
                      ))}
                    </div>
                  </SearchSection>

                  <SearchSection title="강의자료" count={results.documents.length} variant="documents">
                    <div className="search-document-card-grid">
                      {results.documents.map((document) => (
                        <SearchDocumentCard key={document.id} document={document} onSelect={openDocument} />
                      ))}
                    </div>
                  </SearchSection>

                  <SearchSection title="질문" count={results.questions.length} variant="questions">
                    <div className="search-result-card-grid">
                      {results.questions.map((question) => (
                        <SearchResultCard key={question.id} item={question} onSelect={openQuestion} />
                      ))}
                    </div>
                  </SearchSection>
                </>
              ) : null}
            </div>
          ) : (
            <div className="search-overview is-fixed" aria-live="polite">
              <SearchSection title="최근 검색어" variant="recent">
                {recentSearches.length > 0 ? (
                  <button type="button" className="search-recent-clear" onClick={handleDeleteAllRecent}>전체 삭제</button>
                ) : null}
                <ul className="search-recent-list">
                  {recentSearches.map((item) => {
                    const searchId = item.search_id ?? item.searchId ?? item.id;
                    return (
                      <RecentSearchChip
                        key={searchId}
                        keyword={item.keyword}
                        onSearch={() => runSearch(item.keyword)}
                        onDelete={() => handleDeleteRecent(searchId)}
                      />
                    );
                  })}
                </ul>
              </SearchSection>

              <SearchSection title="최근 열어본 강의자료" variant="recent-documents">
                <div className="search-document-card-grid">
                  {MOCK_RECENT_DOCUMENTS.map((document) => (
                    <SearchDocumentCard key={document.id} document={document} onSelect={openDocument} />
                  ))}
                </div>
              </SearchSection>

              <SearchSection title="최근 열어본 질문" variant="recent-questions">
                <div className="search-result-card-grid">
                  {MOCK_RECENT_QUESTIONS.map((question) => (
                    <SearchResultCard key={question.id} item={question} onSelect={openQuestion} />
                  ))}
                </div>
              </SearchSection>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default SearchPage;
