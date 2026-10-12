import { useEffect, useRef, useState } from 'react'
import { X, Camera, Trash2, Save, User as UserIcon, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'

const MAX_DIM = 240 // px, longest side
const JPEG_QUALITY = 0.85

/**
 * Resize a File to a small square-ish JPEG data URL.
 * Keeps localStorage usage tiny (~15–40 KB per avatar).
 */
function resizeImage(file, maxDim = MAX_DIM) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Unsupported image'))
      img.onload = () => {
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

function initials(name) {
  if (!name) return '··'
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function ProfileModal({ open, onClose, member, onSave }) {
  const [draft, setDraft] = useState(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  // Reset the draft each time the modal opens
  useEffect(() => {
    if (open && member) {
      setDraft({
        name: member.name || '',
        phone: member.phone && member.phone !== '—' ? member.phone : '',
        avatar: member.avatar || null,
      })
      setBusy(false)
    }
  }, [open, member])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onEsc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  if (!open || !member || !draft) return null

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image is too large. Pick one under 5 MB.')
      return
    }
    setBusy(true)
    try {
      const dataUrl = await resizeImage(file)
      setDraft((d) => ({ ...d, avatar: dataUrl }))
    } catch {
      toast.error('Could not process that image.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removePhoto = () => setDraft((d) => ({ ...d, avatar: null }))

  const save = () => {
    const name = draft.name.trim()
    if (!name) return toast.error('Name cannot be empty.')
    onSave({
      name,
      phone: draft.phone.trim() || '—',
      avatar: draft.avatar || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div
        className="bg-white border border-line rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-line">
          <div>
            <h3 className="font-display font-semibold text-navy text-[1.05rem]">Your profile</h3>
            <p className="mt-0.5 text-[0.82rem] text-ink-soft">
              Update how you appear to other members.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-paper text-ink-soft hover:text-navy transition"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Avatar picker */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {draft.avatar ? (
                <img
                  src={draft.avatar}
                  alt={draft.name}
                  className="w-20 h-20 rounded-2xl object-cover border border-line"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-forest to-emerald text-white grid place-items-center font-display font-bold text-2xl border border-line">
                  {initials(draft.name)}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-forest text-white grid place-items-center shadow-md hover:bg-forest-dark transition"
                aria-label="Upload photo"
                disabled={busy}
              >
                <Camera size={14} strokeWidth={2} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
            </div>

            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="text-[0.82rem] font-semibold text-navy">Profile photo</div>
              <div className="text-[0.76rem] text-ink-soft">
                JPG or PNG. We'll resize it to 240 px.
              </div>
              {draft.avatar && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="mt-1 self-start inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-red-600 hover:text-red-700 transition"
                >
                  <Trash2 size={13} strokeWidth={2} />
                  Remove photo
                </button>
              )}
            </div>
          </div>

          {/* Name */}
          <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">
            Full name
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-line bg-white focus-within:border-forest transition">
              <UserIcon size={15} strokeWidth={2} className="text-ink-soft shrink-0" />
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Your name"
                className="w-full outline-none text-[0.92rem] font-normal text-navy bg-transparent"
              />
            </div>
          </label>

          {/* Phone */}
          <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">
            Phone
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-line bg-white focus-within:border-forest transition">
              <Phone size={15} strokeWidth={2} className="text-ink-soft shrink-0" />
              <input
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                placeholder="0712 345 678"
                className="w-full outline-none text-[0.92rem] font-normal text-navy bg-transparent font-mono"
              />
            </div>
          </label>

          {/* Email — read-only */}
          <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">
            Email
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-line bg-paper">
              <Mail size={15} strokeWidth={2} className="text-ink-soft shrink-0" />
              <input
                value={member.email || ''}
                readOnly
                className="w-full outline-none text-[0.92rem] font-normal text-ink-soft bg-transparent cursor-not-allowed"
              />
            </div>
            <span className="text-[0.72rem] text-ink-soft font-normal">
              Email is tied to your account and can't be changed here.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-line bg-paper/40">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold hover:border-navy transition"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-[0.86rem] font-semibold hover:bg-forest-dark transition disabled:opacity-60"
          >
            <Save size={14} strokeWidth={2} />
            {busy ? 'Processing…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}