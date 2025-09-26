const multer = require('multer');
const path = require('path');

const storage = multer.diskstorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // pasta onde as imagens ficarão
  },
  filename: (req, file, cb) => {
    cb(null, date.now() + path.extname(file.originalname)); // nome único para evitar conflito
  },
});

const upload = multer({ storage });

module.exports = upload;
