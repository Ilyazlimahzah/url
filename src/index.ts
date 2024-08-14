import dotenv from 'dotenv';
import { Express } from 'express';
import app from './app';
import mongoose from 'mongoose';

dotenv.config();

import { getConfig } from './utils/config';

function connectMongo(server: Express) {
  mongoose.set('strictQuery', false);

  mongoose
    .connect(getConfig().dataBase.mongo, {
      dbName: 'URLShortener',
    })
    .then(() => {
      console.log('Connected to MongoDB');
      server.listen(getConfig().port, () => {
        console.log(
          `Server is running on http://localhost:${getConfig().port}`
        );
      });
    })
    .catch((error: any) => {
      console.error('Error connecting to MongoDB: ', error);
    });
}

connectMongo(app);
