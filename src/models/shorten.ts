import { Schema, model, Document } from 'mongoose';
import { UserDoc } from './user';

export interface ShortenDoc extends Document {
  originalUrl: string;
  shortUrl: string;
  visitCount: number;
  urlLink: string;
  location: string[];
  creator: UserDoc;
}

const urlSchema = new Schema(
  {
    originalUrl: {
      type: String,
      required: true,
    },
    shortUrl: {
      type: String,
      required: true,
    },
    visitCount: {
      type: Number,
      default: 0,
    },
    urlLink: {
      type: String,
      required: true,
    },
    location: [
      {
        type: String,
        required: true,
      },
    ],
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc: any, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.creator.password;
        delete ret.creator.__v;
      },
    },
  }
);

const URL = model<ShortenDoc>('URL', urlSchema);

export { URL };
