import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import 'dotenv/config';

const storage = new GridFsStorage({
  url: process.env.MONGODB_URL, 
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');

      if (!isImage && !isVideo) {
        return reject(new Error('Only images and videos are allowed!'));
      }

      const filename = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
      resolve({
        filename: filename,
        bucketName: 'uploads' 
      });
    });
  }
});


const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } 
});

export default upload;