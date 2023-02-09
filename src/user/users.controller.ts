import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { UsersRepository } from './users-repository';
import { User, CreateUserDto } from './user-schema';

@Controller('users')
export class UserController {
  constructor(private readonly userRepository: UsersRepository) {}

  @Get()
  async findAll(): Promise<User[]> {
    const users = await this.userRepository.findAll();
    return users;
  }

  @HttpCode(201)
  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.userRepository.create(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    return this.userRepository.deleteUserById(id);
  }
}
