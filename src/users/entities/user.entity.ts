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

  @Prop({ default: 'user' })
  role?: string;

  @Prop({ type: String, required: false })
resetPasswordCode?: string;

@Prop({ type: Date, required: false })
resetPasswordExpires?: Date;

@Prop({ type: Boolean, default: false })
resetPasswordVerified?: boolean;  


}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);
