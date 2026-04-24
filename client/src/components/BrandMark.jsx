function BrandMark({ compact = false }) {
  return (
    <div className={`brand-mark${compact ? ' brand-mark--compact' : ''}`}>
  
      <div className="brand-mark__copy">
         <strong>SL Instruments</strong>
        <span>Technical Research Lab</span>
      </div>
    </div>
  )
}

export default BrandMark
