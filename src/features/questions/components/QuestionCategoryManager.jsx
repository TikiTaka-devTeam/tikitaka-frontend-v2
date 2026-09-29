import { useRef, useState } from "react";

import addCategoryIcon from "../../../assets/icons/questions/add-new-category.svg";
import confirmCheckIcon from "../../../assets/icons/confirm-check.svg";
import deleteCategoryIcon from "../../../assets/icons/questions/delete-category.svg";
import CompactModal from "../../../components/common/CompactModal.jsx";
import ModalActions from "../../../components/common/ModalActions.jsx";
import {
  createDocumentQuestionCategory,
  deleteQuestionCategory,
  updateQuestionCategory,
} from "../api/spaceQuestionsApi.js";
import "../styles/questionCategoryManager.css";

function createInitialGroups(documents) {
  return (documents ?? []).map((document) => ({
    id: document.document_id ?? document.id,
    title: document.title,
    categories: (document.categories ?? []).map((category) => ({
      id: category.category_id ?? category.id,
      name: category.name ?? category.category_name ?? "",
      state: "unchanged",
    })),
  }));
}

function splitRows(categories, groupId) {
  const slots = [...categories, { id: `add-category-${groupId}`, isAddButton: true }];
  const rows = [];
  let index = 0;
  while (index < slots.length) {
    const size = rows.length % 2 === 0 ? 5 : 6;
    rows.push(slots.slice(index, index + size));
    index += size;
  }
  return rows;
}

export default function QuestionCategoryManager({ documents, onCancel, onCategoriesChanged }) {
  const nextCategoryIdRef = useRef(0);
  const [groups, setGroups] = useState(() => createInitialGroups(documents));
  const [expandedIds, setExpandedIds] = useState(() => [createInitialGroups(documents)[0]?.id].filter(Boolean));
  const [editingId, setEditingId] = useState("");
  const [modal, setModal] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function updateCategory(groupId, categoryId, updater) {
    setGroups((current) => current.map((group) => group.id === groupId
      ? { ...group, categories: group.categories.map((category) => category.id === categoryId ? updater(category) : category) }
      : group));
  }

  function toggleGroup(groupId) {
    setExpandedIds((current) => current.includes(groupId)
      ? current.filter((id) => id !== groupId)
      : [...current, groupId]);
  }

  function editCategory(groupId, category) {
    if (category.state === "deleted") {
      updateCategory(groupId, category.id, (current) => ({
        ...current,
        state: current.previousState ?? "unchanged",
        previousState: undefined,
      }));
      return;
    }
    setEditingId(category.id);
  }

  function changeCategoryName(groupId, categoryId, name) {
    updateCategory(groupId, categoryId, (category) => ({
      ...category,
      name,
      state: category.state === "new" ? "new" : "modified",
    }));
  }

  function deleteCategory(groupId, category) {
    if (category.state === "new") {
      setGroups((current) => current.map((group) => group.id === groupId
        ? { ...group, categories: group.categories.filter((item) => item.id !== category.id) }
        : group));
      return;
    }
    updateCategory(groupId, category.id, (current) => ({
      ...current,
      state: "deleted",
      previousState: current.state,
    }));
    if (editingId === category.id) setEditingId("");
  }

  function addCategory(groupId) {
    nextCategoryIdRef.current += 1;
    const id = `new-category-${groupId}-${nextCategoryIdRef.current}`;
    setGroups((current) => current.map((group) => group.id === groupId
      ? { ...group, categories: [...group.categories, { id, name: "", state: "new" }] }
      : group));
    setEditingId(id);
  }

  async function saveChanges() {
    if (isSaving) return;

    const changes = groups.flatMap((group) => group.categories
      .filter((category) => category.state !== "unchanged")
      .map((category) => ({ ...category, documentId: group.id })));

    if (changes.some((category) => category.state !== "deleted" && !category.name.trim())) {
      setModal("");
      setSaveError("카테고리 이름을 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    setSaveError("");
    try {
      await Promise.all(changes.map((category) => {
        if (category.state === "new") {
          return createDocumentQuestionCategory(category.documentId, category.name.trim());
        }
        if (category.state === "modified") {
          return updateQuestionCategory(category.id, category.name.trim());
        }
        return deleteQuestionCategory(category.id);
      }));
      setEditingId("");
      setModal("success");
    } catch (cause) {
      setModal("");
      setSaveError(cause.response?.data?.message ?? cause.response?.data?.detail ?? "카테고리를 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  function finishSave() {
    setModal("");
    onCategoriesChanged?.();
  }

  const hasDeletedCategories = groups.some((group) =>
    group.categories.some((category) => category.state === "deleted"));

  return (
    <section className="space-questions-content question-category-manager" aria-labelledby="question-category-manager-title">
      <header className="question-category-manager__header">
        <h2 id="question-category-manager-title">질문 카테고리</h2>
        <p>카테고리를 선택하여 추가 / 삭제할 수 있어요.</p>
      </header>

      <div className="question-category-manager__groups">
        {groups.length === 0 && <p className="question-category-manager__empty">등록된 강의자료가 없습니다.</p>}
        {groups.map((group) => {
          const isExpanded = expandedIds.includes(group.id);
          return <section className="question-category-manager__group" key={group.id}>
            <button type="button" className="question-category-manager__group-toggle" aria-expanded={isExpanded} onClick={() => toggleGroup(group.id)}>
              <span>{group.title}</span><span className={`question-category-manager__chevron${isExpanded ? " is-open" : ""}`} />
            </button>
            {isExpanded && <div className="question-category-manager__category-rows">
              {splitRows(group.categories, group.id).map((row, rowIndex) => <div className={`question-category-manager__category-row${rowIndex % 2 === 0 ? " is-indented" : ""}`} key={row[0]?.id ?? rowIndex}>
                {row.map((category) => category.isAddButton
                  ? <button type="button" className="question-category-manager__add" key={category.id} aria-label={`${group.title} 카테고리 추가`} onClick={() => addCategory(group.id)}><img src={addCategoryIcon} alt="" /></button>
                  : <div
                  className={`question-category-manager__category is-${category.state}${editingId === category.id ? " is-editing" : ""}`}
                  key={category.id}
                  onClick={() => editCategory(group.id, category)}
                >
                  {editingId === category.id && category.state !== "deleted"
                    ? <input
                      type="text"
                      value={category.name}
                      maxLength={50}
                      aria-label="카테고리 이름"
                      autoFocus
                      onBlur={() => setEditingId("")}
                      onChange={(event) => changeCategoryName(group.id, category.id, event.target.value)}
                      onClick={(event) => event.stopPropagation()}
                    />
                    : <span>{category.name || "카테고리"}</span>}
                  {category.state !== "deleted" && <button type="button" aria-label={`${category.name || "새 카테고리"} 삭제`} onClick={(event) => { event.stopPropagation(); deleteCategory(group.id, category); }}><img src={deleteCategoryIcon} alt="" /></button>}
                </div>)}
              </div>)}
            </div>}
          </section>;
        })}
      </div>

      {saveError && <p className="question-category-manager__error" role="alert">{saveError}</p>}

      <div className="question-category-manager__actions">
        <button type="button" disabled={isSaving} onClick={onCancel}>취소</button>
        <button type="button" className="is-primary" disabled={isSaving} onClick={() => { setSaveError(""); setModal("confirm"); }}>{isSaving ? "저장 중" : "저장"}</button>
      </div>

      {modal && <CompactModal
        onClose={isSaving ? undefined : () => setModal("")}
        labelledBy="category-manager-modal-title"
        describedBy="category-manager-modal-description"
        className="question-category-manager-modal"
      >
        <div className="compact-modal__icon" aria-hidden="true"><span className="question-category-manager-modal__check" style={{ WebkitMaskImage: `url("${confirmCheckIcon}")`, maskImage: `url("${confirmCheckIcon}")` }} /></div>
        <div className="compact-modal__text">
          <h2 id="category-manager-modal-title">{modal === "success" ? "수정되었습니다" : "카테고리 변경사항을 저장하시겠습니까?"}</h2>
          <p id="category-manager-modal-description">{modal === "success"
            ? "카테고리가 수정되었습니다"
            : hasDeletedCategories
              ? "삭제한 카테고리와 모든 질문의 연결이 함께 제거됩니다."
              : "수정된 카테고리를 저장합니다"}</p>
        </div>
        <ModalActions
          onCancel={() => setModal("")}
          onConfirm={modal === "success" ? finishSave : saveChanges}
          cancelText="취소"
          confirmText={modal === "success" ? "확인" : isSaving ? "저장 중" : "저장"}
          confirmDisabled={isSaving}
          showCancel={modal !== "success"}
        />
      </CompactModal>}
    </section>
  );
}
