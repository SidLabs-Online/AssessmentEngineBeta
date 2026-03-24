function BrandMark({ compact = false }) {
  return (
    <div className={`brand-mark${compact ? ' brand-mark--compact' : ''}`}>
      <img
        alt="SidLabs logo"
        className="brand-mark__image"
        src="https://res.cloudinary.com/dquk8vwxi/image/upload/v1771474414/SidLabs_Logo_z1nfoz.jpg"
      />
      <div className="brand-mark__copy">
        <strong>SidLabs</strong>
        <span>This research is powered by SidLabs LLP</span>
      </div>
    </div>
  )
}

export default BrandMark
