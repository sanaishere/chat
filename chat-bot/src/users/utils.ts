import { extname } from 'path';
import { v4 } from 'uuid';

export const imageFileFilter = (req, file, callback) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error('Only image files are allowed!'), false);
      }
      callback(null, true);
};

export const editFileName = (req, file, callback) => {
      const name = file.originalname.split('.')[0];
      const fileExtName = extname(file.originalname);
      callback( null,`${v4()}${fileExtName}`);
};
