import multer from "multer";
import path from "path";
import crypto from "crypto";

// Files are written to the OS temp folder and then uploaded to Cloudinary.
const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    // Random name so uploads with the same original name don't collide
    callback(null, crypto.randomUUID() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith("image/")) {
      callback(null, true);
    } else {
      callback(new Error("Only image files are allowed"));
    }
  },
});

export default upload;
