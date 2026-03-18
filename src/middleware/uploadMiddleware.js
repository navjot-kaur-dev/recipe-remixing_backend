import multer from 'multer'
import path from 'path'
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_MB } from '../utils/constants.js'

// Store uploads in memory (we'll pass the buffer to Supabase Storage)
const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`), false)
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
})

// Handle multer errors gracefully
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: `File too large. Max size: ${MAX_FILE_SIZE_MB}MB` })
    }
    return res.status(400).json({ message: err.message })
  }
  if (err) {
    return res.status(400).json({ message: err.message })
  }
  next()
}
