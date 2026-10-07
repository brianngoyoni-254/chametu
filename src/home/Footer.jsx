import { FiMapPin, FiHeart } from 'react-icons/fi'

export default function Footer() {
  return (
    <footer className="border-t border-line py-[26px]">
      <div className="wrap flex flex-wrap items-center justify-between gap-3 text-[.8rem] text-ink-soft">
        <div className="flex flex-wrap items-center gap-2">
          <span>&copy; 2026 Chametu</span>
          <span className="text-line">|</span>
          <span className="inline-flex items-center gap-1.5">
            Made with
            <FiHeart size={12} className="text-forest" aria-hidden="true" />
            in Kenya
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <FiMapPin size={13} className="text-forest" aria-hidden="true" />
          <span>Nairobi, Kenya. Built for chamas, SACCOs &amp; investment groups</span>
        </div>
      </div>
    </footer>
  )
}