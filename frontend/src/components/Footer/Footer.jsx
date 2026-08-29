import {
  ArrowUpRight,
  Leaf,
  MessageCircleMore,
  Recycle,
  ScanLine,
  School,
} from 'lucide-react'
import './Footer.css'

const quickLinks = [
  { label: 'Tentang', href: '#tentang' },
  { label: 'Alur', href: '#alur' },
  { label: 'Edukasi', href: '#edukasi' },
  { label: 'CamIde', href: '#camide' },
]

export default function Footer() {
  return (
    <footer id="footer" className="site-footer">
      <section className="site-footer__statement" aria-label="Misi Daurin">
        <p>
          Daurin membantu komunitas sekolah mengelola sampah dengan lebih
          <span> terukur, cepat, dan berkelanjutan.</span>
        </p>
      </section>

      <div className="site-footer__body">
        <div className="site-footer__grid">
          <section className="site-footer__identity" aria-label="Tentang Daurin">
            <a className="site-footer__brand" href="#top" aria-label="Kembali ke atas">
              <img src="/logo.png" alt="" aria-hidden="true" />
              <strong>Daurin</strong>
            </a>
            <p>Platform sekolah untuk memantau, melaporkan, dan memilah sampah secara digital.</p>
            <div className="site-footer__socials" aria-label="Fokus Daurin">
              <span aria-label="Program sekolah"><School /></span>
              <span aria-label="Daur ulang"><Recycle /></span>
              <span aria-label="Lingkungan"><Leaf /></span>
            </div>
          </section>

          <nav className="site-footer__links" aria-label="Tautan cepat">
            <h2>Tautan cepat</h2>
            <div>
              {quickLinks.map((link) => (
                <a key={link.href} href={link.href}><i aria-hidden="true" />{link.label}</a>
              ))}
            </div>
          </nav>

          <section className="site-footer__actions" aria-labelledby="footer-action-title">
            <h2 id="footer-action-title">Mulai dari sini</h2>
            <a href="/report"><MessageCircleMore /><span><small>Temukan masalah?</small>Buat laporan</span><ArrowUpRight /></a>
            <a href="/camide"><ScanLine /><span><small>Kenali jenis sampah</small>Buka CamIde</span><ArrowUpRight /></a>
          </section>
        </div>

        <div className="site-footer__bottom">
          <p>© 2026 Daurin. Untuk lingkungan sekolah yang lebih baik.</p>
          <div aria-label="Informasi situs"><span>Privasi terjaga</span><span>Data sekolah</span><span>Akses inklusif</span></div>
        </div>
      </div>
    </footer>
  )
}
