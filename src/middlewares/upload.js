import multer from "multer";
import path from "path";
import { statusCode, message } from "../utils/api.response.js";

export const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profile_images");
  },

  filename: function (req, file, cb) {
    const firstName = req.body.firstName;
    if (firstName) {
      cb(null, `${firstName}_${Date.now()}${path.extname(file.originalname)}`);
    } else {
      cb(null, `${Date.now()}_${file.originalname}`);
    }
  },
});

export const upload = multer({
  storage: storage,

  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      req.fileValidationError = "Only .jpeg, .jpg, and .png files are allowed!";
      return cb(
        null,
        false,
        new Error("Only .jpeg, .jpg, and .png files are allowed!")
      );
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Export multerErrorHandling
export function multerErrorHandling(err, req, res, next) {
  if (err.code === "LIMIT_FILE_SIZE") {
    req.fileSizeLimitError = true;
    return res
      .status(statusCode.BAD_REQUEST)
      .json({ message: message.validImageError });
  }
  next(err);
}
