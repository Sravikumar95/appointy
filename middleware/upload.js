const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure destination folder exists
const uploadDirectory = path.join(__dirname, '..', 'uploads', 'doctors');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    // Generate safe, unique filename
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `doctor-${uniqueSuffix}${ext}`);
  }
});

// File filter: images only
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5 MB default
  },
  fileFilter
});

module.exports = upload;
