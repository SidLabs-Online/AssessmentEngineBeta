function BrandMark({ compact = false }) {
  return (
    <div className={`brand-mark${compact ? ' brand-mark--compact' : ''}`}>
      <div aria-hidden="true" className="brand-mark__icon">
        <span className="brand-mark__glyph">S</span>
        <span className="brand-mark__glyph brand-mark__glyph--right">L</span>
      </div>
      <div className="brand-mark__copy">
        <strong>SidLabs</strong>
        <span>This research is powered by SidLabs LLP</span>
      </div>
    </div>
  )
}

export default BrandMark
