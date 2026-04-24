import BrandMark from './BrandMark'



function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <BrandMark />
         
        </div>

        <div className="site-footer__legal">
<p>© 2026 SL Instruments Research Lab. All rights reserved.</p>
          {/* <p>Built for research, applicant screening, and evaluator workflows.</p> */}
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
