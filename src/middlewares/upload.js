import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/profile_images"),
  filename: (req, file, cb) => {
    const name = req.body.firstName ? `${req.body.firstName}_` : "";
    cb(null, `${name}${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const isValidType =
      /jpeg|jpg|png/.test(file.mimetype) &&
      /\.(jpeg|jpg|png)$/i.test(file.originalname);

    if (isValidType) return cb(null, true);

    req.fileValidationError = "Only .jpeg, .jpg, and .png files are allowed!";
    cb(null, false, new Error("Only .jpeg, .jpg, and .png files are allowed!"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

function multerErrorHandling(err, req, res, next) {
  if (err.code === "LIMIT_FILE_SIZE") {
    req.fileSizeLimitError = true;
    return res.status(400).json({ message: "File size exceeds 5MB limit" });
  }
  next(err);
}

export { upload, multerErrorHandling };
