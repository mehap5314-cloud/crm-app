'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'

function compressImage(file, maxW, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let w = img.width, h = img.height
      if (w > maxW) { h = (h * maxW) / w; w = maxW }
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      resolve(c.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function ImageUpload({ images = [], onImagesChange }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be under 10MB')
      return
    }

    setUploading(true)
    try {
      const dataUri = await compressImage(file, 800, 0.7)
      onImagesChange([...images, dataUri])
    } catch (err) {
      alert(err.message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeImage = (idx) => {
    onImagesChange(images.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((url, i) => (
          <div key={i} className="relative group rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
            <img src={url} alt="" className="w-20 h-20 object-cover" />
            <button type="button" onClick={() => removeImage(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
              <X size={12} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all duration-200 hover:scale-[1.02]"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
          {uploading ? (
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Upload size={16} />
              <span className="text-[10px]">Upload</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
