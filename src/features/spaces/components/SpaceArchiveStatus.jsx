import { useSpaceAccess } from "../context/SpaceAccessContext.js";
import "../styles/space-archive-status.css";

export default function SpaceArchiveStatus() {
  const { archived } = useSpaceAccess();
  if (!archived) return null;

  const description = "보관된 Space입니다. 조회와 다운로드만 가능하며 작성·수정·삭제할 수 없습니다.";
  return (
    <span className="space-archive-status" role="status" aria-label={description} title={description}>
      보관됨 · 조회 전용
    </span>
  );
}
