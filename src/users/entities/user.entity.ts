import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: false })
  firstName?: string;

  @Prop({ required: false })
  lastName?: string;

  @Prop({ default: 'user', required: true })
  role: string;

  @Prop({ type: String, required: false })
  resetPasswordCode?: string;

  @Prop({ type: Date, required: false })
  resetPasswordExpires?: Date;

  @Prop({ type: Boolean, default: false })
  resetPasswordVerified?: boolean;

  @Prop({ type: String, required: false })
  emailVerificationToken?: string;

  @Prop({ type: Boolean, default: false })
  isEmailVerified?: boolean;

  @Prop({ type: String, required: false })
  refreshToken?: string;

  @Prop({ type: Number, default: 0 })
  loginAttempts?: number;

  @Prop({ type: Date, required: false })
  accountLockedUntil?: Date;

  @Prop({ type: Date, required: false })
  lastLoginAttempt?: Date;

  @Prop({ type: Date, required: false })
  lastLogin?: Date;
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);