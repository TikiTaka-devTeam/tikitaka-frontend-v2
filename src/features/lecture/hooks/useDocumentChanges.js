import { useCallback, useRef, useState } from "react";
import { acknowledgeDocumentChange, parseDocumentChanges, reconcileDocumentChanges } from "../utils/documentChanges.js";

function getUserIdentity() {
  try {
    const user = JSON.parse(localStorage.getItem("tikitaka_user") || "null");
    return user?.user_id ?? user?.userId ?? user?.id ?? user?.email ?? null;
  } catch (error) {
    console.warn("페이지 확인 기록의 사용자 정보를 읽지 못했습니다.", error);
    return null;
  }
}

export default function useDocumentChanges({ spaceId, documentId }) {
  const [userId] = useState(getUserIdentity);
  const key = JSON.stringify([userId, spaceId ?? "", documentId]);
  const storageKey = `tikitaka_document_changes_v1:${key}`;
  const sessionRef = useRef(null);
  const [state, setState] = useState(null);

  const persist = useCallback((record) => {
    if (!userId) return; // Unidentified sessions never share browser records.
    try {
      localStorage.setItem(storageKey, JSON.stringify(record));
    } catch (error) {
      console.warn("페이지 확인 기록을 저장하지 못했습니다. 현재 화면에서만 유지합니다.", error);
    }
  }, [storageKey, userId]);

  const observeSlides = useCallback((slides) => {
    let previous = sessionRef.current?.key === key ? sessionRef.current.record : null;
    if (!previous && userId) {
      try {
        previous = parseDocumentChanges(localStorage.getItem(storageKey));
      } catch (error) {
        console.warn("이전 페이지 기록을 읽지 못했습니다.", error);
      }
    }
    const record = reconcileDocumentChanges(previous, slides);
    const next = { key, record, modalOpen: record.changes.some((change) => !change.reviewed) };
    sessionRef.current = next;
    setState(next);
    persist(record);
  }, [key, storageKey, userId, persist]);

  function closeModal() {
    const current = sessionRef.current;
    if (current?.key !== key) return;
    const next = { ...current, modalOpen: false };
    sessionRef.current = next;
    setState(next);
  }

  function acknowledge(slideId) {
    const current = sessionRef.current;
    if (current?.key !== key) return null;
    const result = acknowledgeDocumentChange(current.record, slideId);
    const next = { ...current, record: result.record, modalOpen: false };
    sessionRef.current = next;
    setState(next);
    persist(result.record);
    return result.nextId;
  }

  return {
    observeSlides, closeModal, acknowledge,
    changes: state?.key === key ? state.record.changes : [],
    modalOpen: state?.key === key && state.modalOpen,
  };
}
