import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import 'dotenv/config';

const storage = new GridFsStorage({
  url: process.env.MONGODB_URL, 
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const isImage = file.mimetype.startsWith('image/');
      const isPdf = file.mimetype === 'application/pdf';

      if (!isImage && !isPdf) {
        return reject(new Error('Only images and PDFs are allowed!'));
      }

      const filename = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
      const fileInfo = {
        filename: filename,
        bucketName: 'uploads' 
      };
      resolve(fileInfo);
    });
  }
});

const upload = multer({ storage });
export default upload;