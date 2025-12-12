import {
  Injectable,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto, PaginatedUsersResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from './repositories/user.repository';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.userRepository.existsByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashed = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.userRepository.create({
      ...createUserDto,
      password: hashed,
    });

    this.logger.log(`User created: ${user.email}`);
    return new UserResponseDto(user);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedUsersResponseDto> {
    const { page, limit, sortBy, sortOrder, search, role } = query;

    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      filter.role = role;
    }

    const sortKey = sortBy as string;
    const sort: Record<string, 1 | -1> = { [sortKey]: sortOrder === 'asc' ? 1 : -1 };

    const result = await this.userRepository.findWithPagination(filter, page, limit, sort);

    return {
      users: result.users.map(user => new UserResponseDto(user)),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      limit: result.limit,
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findByIdOrFail(id);
    return new UserResponseDto(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.userRepository.update(id, updateUserDto);
    this.logger.log(`User updated: ${user.email}`);
    return new UserResponseDto(user);
  }

  async remove(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.delete(id);
    this.logger.log(`User deleted: ${user.email}`);
    return new UserResponseDto(user);
  }

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async findByResetToken(token: string) {
    return this.userRepository.findByResetToken(token);
  }

  async findById(id: string) {
    return this.userRepository.findById(id);
  }
}