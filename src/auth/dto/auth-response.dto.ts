
import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  token: string;

  @ApiProperty({ required: false })
  refresh_token?: string;

  @ApiProperty({ required: false })
  user?: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    isEmailVerified: boolean;
  };
}

export class TokenResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  refresh_token: string;

  @ApiProperty()
  expiresIn: number;
}

export class MessageResponseDto {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;
}