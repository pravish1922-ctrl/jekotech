'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { createBrowserSupabaseClient as createBrowserClient } from '@/lib/supabase-browser'
import { useBooking } from '../booking-context'

const MAX_PHOTOS = 4

export default function PhotosPage() {
  const { photoUrls, addPhoto, removePhoto, setCanProceed } = useBooking()
  const [supabase] = useState(() => createBrowserClient())
  const [uploading, setUploading]   = useState(false)
  const [uploadErr, setUploadErr]   = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCanProceed(true) // always enabled — photos are optional
  }, [setCanProceed])

  async function handleFiles(files: FileList | null) {
    if (!files || uploading) return
    setUploadErr(null)

    const remaining = MAX_PHOTOS - photoUrls.length
    const toUpload  = Array.from(files).slice(0, remaining)

    if (toUpload.length === 0) return
    setUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    for (const file of toUpload) {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/\s/g, '_')}`
      const { error } = await supabase.storage
        .from('booking-photos')
        .upload(path, file, { upsert: false })

      if (error) {
        setUploadErr(error.message)
        break
      }

      const { data: urlData } = supabase.storage
        .from('booking-photos')
        .getPublicUrl(path)

      addPhoto(urlData.publicUrl)
    }

    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const slots = Array.from({ length: MAX_PHOTOS })

  return (
    <div className="px-6 pt-10 pb-4">
      <p className="font-mono text-[9px] tracking-mono2 uppercase text-steel2 mb-3">
        STEP 6 OF 8
      </p>
      <h1 className="font-display text-[28px] font-bold text-bone tracking-tighter mb-2">
        Add photos
      </h1>
      <p className="font-mono text-[10px] tracking-mono uppercase text-steel3 mb-8">
        Optional — up to 4 images
      </p>

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {slots.map((_, idx) => {
          const url = photoUrls[idx]
          return (
            <div
              key={idx}
              className="relative aspect-square"
              style={{ border: `1px dashed ${url ? '#FF5A1F' : '#2A2F33'}`, background: '#15181A' }}
            >
              {url ? (
                <>
                  <Image
                    src={url}
                    alt={`Photo ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 448px) 50vw, 200px"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className="absolute top-1.5 right-1.5 flex items-center justify-center bg-ink text-bone font-mono text-[10px] leading-none"
                    style={{ width: 20, height: 20, border: '1px solid #2A2F33' }}
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => !uploading && photoUrls.length < MAX_PHOTOS && inputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center gap-2"
                  disabled={uploading || photoUrls.length >= MAX_PHOTOS}
                >
                  <span className="font-display text-[28px] text-steel2 leading-none">+</span>
                  <span className="font-mono text-[9px] tracking-mono uppercase text-steel2">
                    Add photo
                  </span>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {uploading && (
        <p className="font-mono text-[10px] tracking-mono uppercase text-steel3 mt-2">
          Uploading…
        </p>
      )}
      {uploadErr && (
        <p className="font-mono text-[10px] tracking-mono uppercase text-red mt-2" role="alert">
          {uploadErr}
        </p>
      )}
    </div>
  )
}
