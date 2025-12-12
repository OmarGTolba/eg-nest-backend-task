import { ApiProperty } from '@nestjs/swagger';

export class ApiResponse<T = any> {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  data?: T;

  @ApiProperty({ required: false })
  error?: string;

  @ApiProperty({ required: false })
  timestamp?: string;

  constructor(statusCode: number, message: string, data?: T, error?: string) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(message: string, data?: T, statusCode: number = 200): ApiResponse<T> {
    return new ApiResponse(statusCode, message, data);
  }

  static error(message: string, error?: string, statusCode: number = 400): ApiResponse {
    return new ApiResponse(statusCode, message, undefined, error);
  }
}