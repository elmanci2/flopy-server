// src/lib/multer.config.ts
import multer from "multer";

export const upload = multer({
  dest: "/tmp/flopy-uploads",
  fileFilter: (_, file, cb) => {
    if (file.mimetype === "application/zip") {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos .zip"));
    }
  },
});
