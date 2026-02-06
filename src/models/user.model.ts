import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  plan: 'FREE' | 'PREMIUM';
  otpCode?: string | undefined;
  otpExpires?: Date | undefined;
  otpRequestsToday?: number;
  lastOtpRequestDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastPasswordChangeDate?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      enum: ['FREE', 'PREMIUM'],
      default: 'FREE',
    },
    otpCode: String,
    otpExpires: Date,
    otpRequestsToday: { type: Number, default: 0 },
    lastOtpRequestDate: Date,
    isActive: { type: Boolean, default: true },
    lastPasswordChangeDate: Date,
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);