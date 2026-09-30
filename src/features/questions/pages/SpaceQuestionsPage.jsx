import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";

import backIcon from "../../../assets/icons/go-back.svg";
import totalQuestionIcon from "../../../assets/icons/questions/total-question.svg";
import totalQuestionSelectedIcon from "../../../assets/icons/questions/total-question-selected.svg";
import myQuestionIcon from "../../../assets/icons/questions/my-question.svg";
import myQuestionSelectedIcon from "../../../assets/icons/questions/my-question-selected.svg";
import categoryIcon from "../../../assets/icons/questions/question-category-modify.svg";
import categorySelectedIcon from "../../../assets/icons/questions/question-category-modify-selected.svg";
import viewIcon from "../../../assets/icons/questions/view-count.svg";
import heartIcon from "../../../assets/icons/questions/heart.svg";
import selectedHeartIcon from "../../../assets/icons/questions/selected-heart.svg";
import deleteQuestionIcon from "../../../assets/icons/questions/delete-question.svg";
import downloadIcon from "../../../assets/icons/download.svg";
import moreIcon from "../../../assets/icons/space/space-more.svg";
import { AppToolbars } from "../../../components/common/AppToolbars.jsx";
import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";
import { getDocuments } from "../../spaces/api/documentsApi.js";
import DeleteCompleteModal from "../../spaces/components/DeleteCompleteModal.jsx";
import DeleteConfirmModal from "../../spaces/components/DeleteConfirmModal.jsx";
import SpaceToolbar from "../../spaces/components/SpaceToolbar.jsx";
import { deleteQuestion } from "../../lecture/api/questionApi.js";
import {
  exportSpaceQuestions,
  getMyQuestionSummary,
  getMySpaceQuestions,
  getSpaceQuestionCategories,
  getSpaceQuestions,
} from "../api/spaceQuestionsApi.js";
import QuestionComposer from "../components/QuestionComposer.jsx";
import QuestionCategoryManager from "../components/QuestionCategoryManager.jsx";
import SpaceQuestionDetail from "../components/SpaceQuestionDetail.jsx";
import "../styles/spaceQuestions.css";

const SORT_OPTIONS = [
  { label: "최신순", value: "LATEST" },
  { label: "인기순", value: "MOST_POPULAR" },
  { label: "조회순", value: "MOST_VIEWED" },
];

// 1·3·5번째 줄은 최대 5개와 라벨 자리, 2·4·6번째 줄은 왼쪽부터 최대 6개.
// 카테고리가 늘어나도 이 두 줄 패턴을 반복한다.
const CATEGORY_ROW_LIMITS = [5, 6];

function splitCategoryRows(categories) {
  const rows = [];
  for (let index = 0; index < categories.length;) {
    const rowSize = CATEGORY_ROW_LIMITS[rows.length % CATEGORY_ROW_LIMITS.length];
    rows.push(categories.slice(index, index + rowSize));
    index += rowSize;
  }
  return rows;
}

function readUserRole() {
  try {
    const user = JSON.parse(localStorage.getItem("tikitaka_user") || "null");
    return String(
      user?.account_type ?? user?.accountType ?? user?.role ??
      user?.user?.account_type ?? user?.user?.accountType ?? user?.user?.role ??
      localStorage.getItem("tikitaka_account_type") ??
      localStorage.getItem("account_type") ?? localStorage.getItem("role") ?? "",
    ).toUpperCase();
  } catch {
    return "";
  }
}

function getQuestionLikeStorageKey(spaceId) {
  try {
    const user = JSON.parse(localStorage.getItem("tikitaka_user") || "null");
    const userId = user?.user_id ?? user?.userId ?? user?.id ?? user?.user?.user_id ?? user?.user?.id ?? "current";
    return `tikitaka_question_likes:${userId}:${spaceId}`;
  } catch {
    return `tikitaka_question_likes:current:${spaceId}`;
  }
}

function readQuestionLikeOverrides(spaceId) {
  try {
    return JSON.parse(localStorage.getItem(getQuestionLikeStorageKey(spaceId)) || "{}") ?? {};
  } catch {
    return {};
  }
}

function formatQuestionTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`;
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}

function QuestionRow({ question, isProfessor, isMenuOpen, onDeleteRequest, onMenuToggle, onSelect }) {
  const category = question.categories?.map((item) => item.name ?? item.category_name).filter(Boolean).join(", ");
  const detail = [question.document?.title, category, formatQuestionTime(question.created_at)].filter(Boolean).join(" · ");

  return (
    <li className="space-questions-row">
      <button type="button" className={`space-questions-row__button${isProfessor ? " has-menu" : ""}`} onClick={() => onSelect(question)}>
        <span className="space-questions-row__thumbnail">
          {question.slide?.thumbnail_url ? <img src={question.slide.thumbnail_url} alt="" /> : null}
        </span>
        <span className="space-questions-row__copy">
          <strong>{question.title}</strong>
          <span>{detail}</span>
        </span>
        <span className="space-questions-row__stats" aria-label={`조회 ${question.view_count ?? 0}, 공감 ${question.like_count ?? 0}`}>
          <span><img src={viewIcon} alt="" />{question.view_count ?? 0}</span>
          <span><img src={question.liked ? selectedHeartIcon : heartIcon} alt="" />{question.like_count ?? 0}</span>
        </span>
      </button>
      {isProfessor && <>
        <div className="space-questions-row__menu-wrapper">
          <button type="button" className={`space-questions-row__more${isMenuOpen ? " is-active" : ""}`} aria-label={`${question.title} 메뉴`} aria-expanded={isMenuOpen} onClick={() => onMenuToggle(question)}>
            <img src={moreIcon} alt="" />
          </button>
          {isMenuOpen && <div className="space-questions-row__menu">
            <button type="button" onClick={() => onDeleteRequest(question)}><img src={deleteQuestionIcon} alt="" /><span>삭제</span></button>
          </div>}
        </div>
      </>}
    </li>
  );
}

export default function SpaceQuestionsPage() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const spaceName = location.state?.spaceName || "Space";
  const userRole = readUserRole();
  const isProfessor = userRole === "PROFESSOR";
  const [view, setView] = useState("all");
  const [sort, setSort] = useState("LATEST");
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [documentMenuOpen, setDocumentMenuOpen] = useState(false);
  const [categoryData, setCategoryData] = useState(null);
  const [mineCategoryData, setMineCategoryData] = useState(null);
  const [mySummary, setMySummary] = useState(null);
  const [categoryError, setCategoryError] = useState("");
  const [mineCategoryError, setMineCategoryError] = useState("");
  const [questions, setQuestions] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [exportModal, setExportModal] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedQuestionId, setSelectedQuestionId] = useState(
    () => searchParams.get("questionId") ?? "",
  );
  const [questionLikeOverrides, setQuestionLikeOverrides] = useState(() => readQuestionLikeOverrides(spaceId));
  const [questionMenuId, setQuestionMenuId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteModal, setDeleteModal] = useState("");
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);
  const [deleteQuestionError, setDeleteQuestionError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getDocuments(spaceId, { signal: controller.signal })
      .then((data) => setDocuments(Array.isArray(data) ? data : data?.documents ?? []))
      .catch((cause) => {
        if (cause.code !== "ERR_CANCELED") setActionError("강의자료 목록을 불러오지 못했습니다.");
      });
    return () => controller.abort();
  }, [spaceId]);

  useEffect(() => {
    const controller = new AbortController();
    const params = { sort, size: 20 };
    if (selectedDocumentId) params.document_id = selectedDocumentId;
    const request = view === "mine" && !isProfessor ? getMySpaceQuestions : getSpaceQuestions;
    request(spaceId, params, { signal: controller.signal })
      .then((data) => {
        const nextQuestions = (data?.questions ?? []).map((question) => ({
          ...question,
          liked: question.liked ?? question.is_liked ?? question.isLiked,
        }));
        setQuestions(nextQuestions);
        const responseLikeOverrides = Object.fromEntries(nextQuestions
          .filter((question) => typeof question.liked === "boolean")
          .map((question) => [question.question_id ?? question.id, {
            liked: question.liked,
            like_count: question.like_count ?? 0,
          }]));
        if (Object.keys(responseLikeOverrides).length > 0) {
          setQuestionLikeOverrides((current) => {
            const next = { ...current, ...responseLikeOverrides };
            localStorage.setItem(getQuestionLikeStorageKey(spaceId), JSON.stringify(next));
            return next;
          });
        }
        setNextCursor(data?.has_next ? data.next_cursor : null);
      })
      .catch((cause) => {
        if (cause.code !== "ERR_CANCELED") setError("질문을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [spaceId, sort, selectedDocumentId, view, isProfessor, refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    getSpaceQuestionCategories(spaceId, { signal: controller.signal })
      .then((data) => {
        setCategoryData({ spaceId, refreshKey, documents: data?.documents ?? [] });
        setCategoryError("");
      })
      .catch((cause) => {
        if (cause.code !== "ERR_CANCELED") setCategoryError("카테고리를 불러오지 못했습니다.");
      });
    return () => controller.abort();
  }, [spaceId, refreshKey]);

  useEffect(() => {
    if (view !== "mine" || isProfessor) return;
    const controller = new AbortController();

    async function loadMineCategories() {
      const categoriesByDocument = {};
      const seenCursors = new Set();
      let cursor;
      try {
        do {
          const data = await getMySpaceQuestions(
            spaceId,
            { sort: "LATEST", size: 20, ...(cursor ? { cursor } : {}) },
            { signal: controller.signal },
          );
          for (const question of data?.questions ?? []) {
            const documentId = question.document?.document_id ?? question.document_id;
            if (!documentId) continue;
            const ids = categoriesByDocument[documentId] ?? new Set();
            for (const category of question.categories ?? []) {
              if (category.category_id) ids.add(category.category_id);
            }
            categoriesByDocument[documentId] = ids;
          }
          cursor = data?.has_next ? data.next_cursor : null;
          if (cursor && seenCursors.has(cursor)) throw new Error("Repeated question cursor");
          if (cursor) seenCursors.add(cursor);
        } while (cursor && !controller.signal.aborted);

        if (!controller.signal.aborted) {
          setMineCategoryData({ spaceId, refreshKey, categoriesByDocument });
          setMineCategoryError("");
        }
      } catch (cause) {
        if (cause.code !== "ERR_CANCELED" && !controller.signal.aborted) {
          setMineCategoryError("내 질문의 카테고리를 불러오지 못했습니다.");
        }
      }
    }

    loadMineCategories();
    return () => controller.abort();
  }, [spaceId, view, isProfessor, refreshKey]);

  useEffect(() => {
    if (view !== "mine" || isProfessor) return;
    const controller = new AbortController();
    getMyQuestionSummary(spaceId, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setMySummary(data);
      })
      .catch((cause) => {
        if (cause.code !== "ERR_CANCELED" && !controller.signal.aborted) setMySummary(null);
      });
    return () => controller.abort();
  }, [spaceId, view, isProfessor, refreshKey]);

  async function loadMore() {
    if (!nextCursor || isLoading) return;
    setIsLoading(true);
    setError("");
    try {
      const params = { sort, size: 20, cursor: nextCursor };
      if (selectedDocumentId) params.document_id = selectedDocumentId;
      const request = view === "mine" && !isProfessor ? getMySpaceQuestions : getSpaceQuestions;
      const data = await request(spaceId, params);
      const nextQuestions = (data?.questions ?? []).map((question) => ({
        ...question,
        liked: question.liked ?? question.is_liked ?? question.isLiked,
      }));
      setQuestions((current) => [...current, ...nextQuestions]);
      const responseLikeOverrides = Object.fromEntries(nextQuestions
        .filter((question) => typeof question.liked === "boolean")
        .map((question) => [question.question_id ?? question.id, {
          liked: question.liked,
          like_count: question.like_count ?? 0,
        }]));
      if (Object.keys(responseLikeOverrides).length > 0) {
        setQuestionLikeOverrides((current) => {
          const next = { ...current, ...responseLikeOverrides };
          localStorage.setItem(getQuestionLikeStorageKey(spaceId), JSON.stringify(next));
          return next;
        });
      }
      setNextCursor(data?.has_next ? data.next_cursor : null);
    } catch {
      setError("질문을 더 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExport() {
    if (isExporting) return;
    setIsExporting(true);
    setExportError("");
    let downloadLink;
    try {
      const data = await exportSpaceQuestions(spaceId);
      if (!data?.download_url) throw new Error("Missing download URL");
      downloadLink = document.createElement("a");
      downloadLink.href = data.download_url;
      downloadLink.download = "questions.csv";
      downloadLink.hidden = true;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      setExportModal("success");
    } catch {
      setExportError("질문 내보내기에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      downloadLink?.remove();
      setIsExporting(false);
    }
  }

  function closeExportModal() {
    setExportModal("");
    setExportError("");
  }

  const selectedDocument = documents.find((item) => (item.document_id ?? item.id) === selectedDocumentId);
  const currentCategoryData = categoryData?.spaceId === spaceId && categoryData.refreshKey === refreshKey ? categoryData : null;
  const categoryDocuments = currentCategoryData?.documents ?? [];
  const currentMineCategoryData = mineCategoryData?.spaceId === spaceId && mineCategoryData.refreshKey === refreshKey ? mineCategoryData : null;
  const mineCategoryIds = currentMineCategoryData?.categoriesByDocument ?? null;
  const categoryGroups = categoryDocuments
    .filter((document) => !selectedDocumentId || document.document_id === selectedDocumentId)
    .map((document) => ({
      ...document,
      categories: (document.categories ?? []).filter((category) =>
        view !== "mine" || Boolean(mineCategoryIds?.[document.document_id]?.has(category.category_id))),
    }))
    .filter((document) => document.categories.length > 0);
  const isCategoryLoading = (!currentCategoryData && !categoryError) || (view === "mine" && !isProfessor && !currentMineCategoryData && !mineCategoryError);
  const shouldShowCategorySection = view !== "all" || Boolean(selectedDocumentId);

  function changeView(nextView) {
    setIsManagingCategories(false);
    if (nextView === view) {
      setSelectedQuestionId("");
      setSelectedCategories([]);
      return;
    }
    setQuestions([]);
    setNextCursor(null);
    setIsLoading(true);
    setError("");
    setMineCategoryError("");
    setSelectedCategories([]);
    setSelectedQuestionId("");
    if (nextView === "mine") setMineCategoryData(null);
    setView(nextView);
  }

  function changeSort(nextSort) {
    if (nextSort === sort) return;
    setQuestions([]);
    setNextCursor(null);
    setIsLoading(true);
    setError("");
    setSort(nextSort);
  }

  function changeDocument(id) {
    setDocumentMenuOpen(false);
    if (id === selectedDocumentId) return;
    setQuestions([]);
    setNextCursor(null);
    setIsLoading(true);
    setError("");
    setSelectedDocumentId(id);
    setSelectedCategories([]);
    setSelectedQuestionId("");
  }

  function changeCategory(category) {
    setSelectedQuestionId("");
    setSelectedCategories((current) => current.some((item) => item.category_id === category.category_id)
      ? current.filter((item) => item.category_id !== category.category_id)
      : [...current, category]);
  }

  function handleQuestionUpdated(updatedQuestion) {
    const updatedId = updatedQuestion.question_id ?? updatedQuestion.id ?? selectedQuestionId;
    if (typeof updatedQuestion.liked === "boolean") {
      setQuestionLikeOverrides((current) => {
        const next = {
          ...current,
          [updatedId]: {
            liked: updatedQuestion.liked,
            like_count: updatedQuestion.like_count ?? 0,
          },
        };
        localStorage.setItem(getQuestionLikeStorageKey(spaceId), JSON.stringify(next));
        return next;
      });
    }
    setQuestions((current) => current.map((item) =>
      (item.question_id ?? item.id) === updatedId
        ? {
          ...item,
          status: updatedQuestion.status,
          categories: updatedQuestion.categories,
          liked: updatedQuestion.liked,
          like_count: updatedQuestion.like_count,
        }
        : item));
  }

  function requestQuestionDelete(question) {
    setQuestionMenuId("");
    setDeleteTarget(question);
    setDeleteQuestionError("");
    setDeleteModal("confirm");
  }

  async function confirmQuestionDelete() {
    const questionId = deleteTarget?.question_id ?? deleteTarget?.id;
    if (!questionId || isDeletingQuestion) return;
    setIsDeletingQuestion(true);
    setDeleteQuestionError("");
    try {
      await deleteQuestion(questionId);
      setQuestions((current) => current.filter((question) => (question.question_id ?? question.id) !== questionId));
      setQuestionLikeOverrides((current) => {
        const next = { ...current };
        delete next[questionId];
        localStorage.setItem(getQuestionLikeStorageKey(spaceId), JSON.stringify(next));
        return next;
      });
      if (selectedQuestionId === questionId) setSelectedQuestionId("");
      setDeleteModal("success");
    } catch (cause) {
      setDeleteQuestionError(cause.response?.data?.message ?? "질문을 삭제하지 못했습니다.");
    } finally {
      setIsDeletingQuestion(false);
    }
  }

  function closeQuestionDeleteModal() {
    if (isDeletingQuestion) return;
    setDeleteModal("");
    setDeleteTarget(null);
    setDeleteQuestionError("");
  }

  const visibleQuestions = selectedCategories.length > 0
    ? questions.filter((question) => (question.categories ?? []).some((questionCategory) =>
      selectedCategories.some((selectedCategory) =>
        (questionCategory.category_id && questionCategory.category_id === selectedCategory.category_id) ||
        (questionCategory.name ?? questionCategory.category_name) === selectedCategory.name)))
    : questions;

  return (
    <main className="space-questions-page space-page-transition">
      <div className="space-questions-background" aria-hidden="true">
        <div className="space-questions-page__orb space-questions-page__orb--left" />
        <div className="space-questions-page__orb space-questions-page__orb--right" />
      </div>
      <div className="app-frame space-questions-frame">
        <button type="button" className="space-questions-back" aria-label="Space 목록으로 돌아가기" onClick={() => navigate("/spaces")}>
          <img src={backIcon} alt="" />
        </button>
        <header className="space-questions-header"><h1>{spaceName}</h1><p>질문</p></header>
        <AppToolbars showBottomNavigation={false} onSearch={() => navigate("/search")} />

        <div className="space-questions-layout app-container">
          {isComposing && !isProfessor ? (
            <QuestionComposer
              spaceId={spaceId}
              documents={documents}
              documentError={actionError}
              onReturnToMine={() => {
                setIsComposing(false);
                setRefreshKey((value) => value + 1);
                setCategoryError("");
                changeView("mine");
              }}
            />
          ) : <>
          <aside className="space-questions-sidebar" aria-label="질문 탐색">
            <div className="space-questions-sidebar__heading">탐색</div>
            <div className="space-questions-sidebar__nav">
              <button type="button" className={view === "all" && !isManagingCategories ? "is-active" : ""} onClick={() => changeView("all")}>
                <img src={view === "all" && !isManagingCategories ? totalQuestionSelectedIcon : totalQuestionIcon} alt="" />
                <span>전체 질문</span>
              </button>
              <button type="button" className={isProfessor ? (isManagingCategories ? "is-active" : "") : (view === "mine" ? "is-active" : "")} onClick={() => {
                if (!isProfessor) {
                  changeView("mine");
                  return;
                }
                setActionError("");
                setSelectedQuestionId("");
                setQuestionMenuId("");
                setIsManagingCategories(true);
              }}>
                <img src={isProfessor ? (isManagingCategories ? categorySelectedIcon : categoryIcon) : (view === "mine" ? myQuestionSelectedIcon : myQuestionIcon)} alt="" />
                <span>{isProfessor ? "질문 카테고리 수정" : "내 질문"}</span>
              </button>
            </div>
            <label className="space-questions-sidebar__label" htmlFor="space-questions-document">자료별 질문 탐색</label>
            <div className="space-questions-document">
              <button id="space-questions-document" type="button" className="space-questions-document__trigger" aria-expanded={documentMenuOpen} onClick={() => setDocumentMenuOpen((open) => !open)}>
                <span>{selectedDocument?.title ?? "전체 강의자료"}</span><span className={documentMenuOpen ? "space-questions-chevron is-open" : "space-questions-chevron"} />
              </button>
              {documentMenuOpen && <div className="space-questions-document__menu" role="listbox" aria-label="강의자료 선택">
                <button type="button" role="option" aria-selected={!selectedDocumentId} className={!selectedDocumentId ? "is-selected" : ""} onClick={() => changeDocument("")}>전체 강의자료</button>
                {documents.map((document) => {
                  const id = document.document_id ?? document.id;
                  return <button key={id} type="button" role="option" aria-selected={id === selectedDocumentId} className={id === selectedDocumentId ? "is-selected" : ""} onClick={() => changeDocument(id)}>{document.title}</button>;
                })}
              </div>}
            </div>
            {isProfessor && <button type="button" className="space-questions-sidebar__action" onClick={() => setExportModal("confirm")}>질문 내보내기</button>}
            {!isProfessor && <button type="button" className="space-questions-sidebar__action" onClick={() => setIsComposing(true)}>질문하기</button>}
            {actionError && <p className="space-questions-action-error" role="alert">{actionError}</p>}
          </aside>

          {isManagingCategories ? <QuestionCategoryManager
            key={`${spaceId}-${refreshKey}-${currentCategoryData ? "loaded" : "loading"}`}
            documents={currentCategoryData?.documents ?? []}
            onCancel={() => setIsManagingCategories(false)}
            onCategoriesChanged={() => {
              setCategoryData(null);
              setCategoryError("");
              setRefreshKey((value) => value + 1);
            }}
          /> : selectedQuestionId ? <SpaceQuestionDetail
            key={selectedQuestionId}
            questionId={selectedQuestionId}
            role={userRole}
            onBack={() => setSelectedQuestionId("")}
            onUpdated={handleQuestionUpdated}
          /> : <section className="space-questions-content" aria-labelledby="space-questions-title">
            <div className="space-questions-content__heading">
              <h2 id="space-questions-title">{selectedDocument?.title ?? (view === "mine" ? "내 질문" : "전체 질문")}</h2>
              <p>{selectedDocument ? "질문 모아보기" : view === "mine" ? "해당 SPACE에서 내가 질문한 것들을 모아볼 수 있어요." : "현재 SPACE의 모든 질문을 최근순으로 모아볼 수 있어요."}</p>
            </div>
            {view === "mine" && !isProfessor && <div className="space-questions-summary" aria-label="내 질문 요약">
              <div className="space-questions-summary__card space-questions-summary__card--total">
                <strong>{mySummary?.total_count ?? "-"}</strong>
                <span>내 질문</span>
              </div>
              <div className="space-questions-summary__card">
                <strong>{mySummary?.answered_count ?? "-"}</strong>
                <span>답변 받음</span>
              </div>
              <div className="space-questions-summary__card">
                <strong>{mySummary?.pending_count ?? "-"}</strong>
                <span>답변 대기</span>
              </div>
            </div>}
            {shouldShowCategorySection && <>
            <div className="space-questions-categories" aria-label="질문 카테고리">
              <button
                type="button"
                className="space-questions-categories__clear"
                disabled={selectedCategories.length === 0}
                onClick={() => setSelectedCategories([])}
              >Clear</button>
              {categoryGroups.map((document) => <div className="space-questions-categories__group" key={document.document_id}>
                {!selectedDocumentId && <span className="space-questions-categories__document">{document.title}</span>}
                {splitCategoryRows(document.categories).map((row, rowIndex) => <div className="space-questions-categories__row" key={row[0].category_id}>
                  {rowIndex === 0 && <span className="space-questions-categories__label">{document.categories.some((category) => category.source === "MANUAL") ? "카테고리" : "AI 카테고리"}</span>}
                  {/* 세 번째 줄부터 홀수 번째 줄은 첫 줄의 라벨 자리를 비워 같은 x축에서 시작한다. */}
                  {rowIndex > 0 && rowIndex % 2 === 0 && <span className="space-questions-categories__offset" aria-hidden="true" />}
                  {row.map((category) => <button
                    type="button"
                    key={category.category_id}
                    className={selectedCategories.some((item) => item.category_id === category.category_id) ? "is-selected" : ""}
                    aria-pressed={selectedCategories.some((item) => item.category_id === category.category_id)}
                    onClick={() => changeCategory(category)}
                  >{category.name}</button>)}
                </div>)}
              </div>)}
              {!isCategoryLoading && !categoryError && categoryGroups.length === 0 && (view !== "mine" || (mySummary?.total_count ?? 0) > 0) && <p className="space-questions-category-status">등록된 카테고리가 없습니다.</p>}
            </div>
            {isCategoryLoading && <p className="space-questions-category-status" role="status">카테고리를 불러오는 중입니다.</p>}
            {categoryError && <p className="space-questions-category-error" role="alert">{categoryError}</p>}
            {view === "mine" && mineCategoryError && <p className="space-questions-category-error" role="alert">{mineCategoryError}</p>}
            </>}
            <div className="space-questions-sort" aria-label="질문 정렬">
              {SORT_OPTIONS.map((option) => <button key={option.value} type="button" className={sort === option.value ? "is-active" : ""} aria-pressed={sort === option.value} onClick={() => changeSort(option.value)}>{option.label}</button>)}
            </div>
            {isLoading && questions.length === 0 ? <p className="space-questions-status" role="status">질문을 불러오는 중입니다.</p> : null}
            {error && <p className="space-questions-status space-questions-status--error" role="alert">{error}</p>}
            {!isLoading && !error && visibleQuestions.length === 0 && <p className="space-questions-status">{selectedCategories.length > 0 ? "해당 카테고리에 질문이 없습니다." : "등록된 질문이 없습니다."}</p>}
            <ul className="space-questions-list">{visibleQuestions.map((question) => {
              const questionId = question.question_id ?? question.id;
              return <QuestionRow
                key={questionId}
                question={{ ...question, ...(questionLikeOverrides[questionId] ?? {}) }}
                isProfessor={isProfessor}
                isMenuOpen={questionMenuId === questionId}
                onMenuToggle={(selectedQuestion) => {
                  const selectedId = selectedQuestion.question_id ?? selectedQuestion.id;
                  setQuestionMenuId((current) => current === selectedId ? "" : selectedId);
                }}
                onDeleteRequest={requestQuestionDelete}
                onSelect={(selectedQuestion) => {
                  setQuestionMenuId("");
                  setSelectedQuestionId(selectedQuestion.question_id ?? selectedQuestion.id);
                }}
              />;
            })}</ul>
            {nextCursor && <button type="button" className="space-questions-more" onClick={loadMore} disabled={isLoading}>{isLoading ? "불러오는 중..." : "더 보기"}</button>}
          </section>}
          </>}
        </div>
        <SpaceToolbar activeItem="question" spaceId={spaceId} spaceName={spaceName} />
      </div>
      {exportModal && <CompactModal
        onClose={isExporting ? undefined : closeExportModal}
        labelledBy="question-export-modal-title"
        describedBy="question-export-modal-description"
        className="question-export-modal"
      >
        <div className="compact-modal__icon" aria-hidden="true"><img src={downloadIcon} alt="" /></div>
        <div className="compact-modal__text">
          <h2 id="question-export-modal-title">{exportModal === "success" ? "데이터를 다운로드했습니다" : "데이터를 다운로드하시겠습니까?"}</h2>
          <p id="question-export-modal-description">{exportModal === "success" ? "다운로드 폴더에서 파일을 확인할 수 있습니다" : "현재 Space의 질문/답변을 CSV로 다운로드합니다"}</p>
          {exportError && <p className="question-export-modal__error" role="alert">{exportError}</p>}
        </div>
        <ModalActions
          onCancel={closeExportModal}
          onConfirm={exportModal === "success" ? closeExportModal : handleExport}
          cancelText="취소"
          confirmText={exportModal === "success" ? "확인" : isExporting ? "다운로드 중" : "다운로드"}
          cancelDisabled={isExporting}
          confirmDisabled={isExporting}
          showCancel={exportModal !== "success"}
        />
      </CompactModal>}
      {deleteModal === "confirm" && <DeleteConfirmModal
        description="삭제한 질문은 다시 복구할 수 없습니다"
        error={deleteQuestionError}
        isConfirming={isDeletingQuestion}
        onCancel={closeQuestionDeleteModal}
        onConfirm={confirmQuestionDelete}
      />}
      {deleteModal === "success" && <DeleteCompleteModal
        description="삭제한 질문은 다시 복구할 수 없습니다"
        onConfirm={closeQuestionDeleteModal}
      />}
    </main>
  );
}
