import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface UserDoc extends Document {
  email: string;
  password: string;
  type: string;

  comparePassword: (password: string) => Promise<boolean>;
}

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    type: {
      type: String,
      default: 'user',
      enum: ['user', 'admin'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc: any, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
        delete ret.__v;
      },
    },
  }
);

userSchema.pre<UserDoc>('save', async function (done) {
  if (this.isModified('password')) {
    const hashedPassword = await bcrypt.hash(this.password, 8);
    this.password = hashedPassword;
  }
  done();
});

userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.error(error);
    return false;
  }
};

const User = model<UserDoc>('User', userSchema);

export { User };
