import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({
    minLength: 8,
    description:
      'Password must be at least 8 characters long, include at least one uppercase letter and one special character',
  })
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/(?=.*[!@#$%^&*])/, { message: 'Password must contain at least one special character' })
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false, default: 'user' })
  @IsOptional()
  @IsString()
  role?: string;  
}
