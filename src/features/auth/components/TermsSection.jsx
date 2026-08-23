function TermsSection({
  title,
  checked,
  onChange,
  content,
}) {
  return (
    <section className="terms-section">
      <div className="terms-header">
        <h3>{title}</h3>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
          />
          <span className="checkbox-custom" aria-hidden="true" />
          동의합니다.
        </label>
      </div>
      <div className="terms-content">
        <div className="terms-content-inner">
          <pre>{content}</pre>
        </div>
      </div>
    </section>
  );
}

export default TermsSection;