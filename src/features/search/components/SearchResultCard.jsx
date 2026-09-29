import chevronIcon from "../../../assets/icons/search/search-card-chevron.svg";
import typeCircleIcon from "../../../assets/icons/search/search-type-circle.svg";

function SearchResultCard({ item, type = "question", onSelect }) {
  const typeLabel = type === "notice" ? "공지" : "질문";
  const typeLetter = type === "notice" ? "A" : "Q";

  return (
    <button
      type="button"
      className="search-result-card"
      aria-label={`${typeLabel} ${item.title} 열기`}
      onClick={() => onSelect(item)}
    >
      <span className="search-result-card__type" aria-hidden="true">
        <img src={typeCircleIcon} alt="" />
        <span>{typeLetter}</span>
      </span>
      <span className="search-result-card__copy">
        <strong title={item.title}>{item.title}</strong>
        <small>{item.meta}</small>
      </span>
      <img className="search-result-card__chevron" src={chevronIcon} alt="" />
    </button>
  );
}

export default SearchResultCard;
