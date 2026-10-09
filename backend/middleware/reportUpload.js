import multer from "multer";
import path from "path";
import crypto from "crypto";

// Lab report uploads: a PDF from the lab software, or a photo/scan of a printed
// report (what many labs actually have). Written to the OS temp folder first,
// then saved by services/reportStorage.js.
const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

const reportUpload = multer({
  storage: multer.diskStorage({
    filename: (req, file, callback) => callback(null, crypto.randomUUID() + path.extname(file.originalname)),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // 10 MB
  fileFilter: (req, file, callback) => {
    if (ALLOWED.has(file.mimetype)) callback(null, true);
    else callback(Object.assign(new Error("Upload a PDF or a photo (JPG/PNG) of the report"), { status: 400 }));
  },
});

export default reportUpload;
