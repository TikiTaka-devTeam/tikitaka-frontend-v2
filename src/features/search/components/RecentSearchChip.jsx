import closeIcon from "../../../assets/icons/search/search-recent-close.svg";

function RecentSearchChip({ keyword, onDelete, onSearch }) {
  return (
    <li className="search-recent-chip">
      <button type="button" className="search-recent-chip__keyword" onClick={onSearch}>
        {keyword}
      </button>
      <button
        type="button"
        className="search-recent-chip__delete"
        aria-label={`${keyword} 검색 기록 삭제`}
        onClick={onDelete}
      >
        <img src={closeIcon} alt="" />
      </button>
    </li>
  );
}

export default RecentSearchChip;
