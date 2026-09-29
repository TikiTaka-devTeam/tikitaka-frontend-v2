function SearchDocumentCard({ document, onSelect }) {
  return (
    <button type="button" className="search-document-card" onClick={() => onSelect(document)}>
      <span className="search-document-card__preview">
        {document.thumbnailUrl ? (
          <img src={document.thumbnailUrl} alt="" />
        ) : (
          <span className="search-document-card__preview-empty">PDF</span>
        )}
      </span>
      <strong title={document.title}>{document.title}</strong>
      <small>{document.meta}</small>
    </button>
  );
}

export default SearchDocumentCard;
