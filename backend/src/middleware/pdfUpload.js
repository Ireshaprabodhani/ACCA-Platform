import multer from 'multer';

const storage = multer.memoryStorage();  // Store file buffer in memory

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,  // max 10MB, adjust as needed
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDFs are allowed'));
    }
  },
});

export default upload;
