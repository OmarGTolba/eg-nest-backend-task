import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}
 
  async create(createUserDto: CreateUserDto) {
    const existing = await this.userModel.findOne({ email: createUserDto.email });
    if (existing) throw new ConflictException('Email already registered');
    const hashed = await bcrypt.hash(createUserDto.password, 10);
    const created = new this.userModel({ ...createUserDto, password: hashed });
    return created.save();
  }
 
  async findAll() {
    return this.userModel.find().exec();
  }
 
  async findOne(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
 
  async update(id: string, updateUserDto: UpdateUserDto) {
    const updated = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }
 
  async remove(id: string) {
    const deleted = await this.userModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('User not found');
    return deleted;
  }
 
  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

async findByResetToken(token: string) {
  return this.userModel.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  });
}

  async findById(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
