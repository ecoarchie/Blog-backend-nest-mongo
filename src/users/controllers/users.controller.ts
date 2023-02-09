import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersQueryRepository } from '../repositories/users.query-repository';
import {
  CreateUserDto,
  UserPaginatorOptions,
  UsersPagination,
} from '../user-schema';
import { UsersService } from '../services/users.service';
import { Request, Response } from 'express';

@Controller('users')
export class UserController {
  constructor(
    private readonly userQueryRepository: UsersQueryRepository,
    private readonly userService: UsersService,
  ) {}

  @Get()
  async findAll(
    @Query() userPaginatorQuery: UserPaginatorOptions,
  ): Promise<UsersPagination> {
    const userPaginatorOptions = new UserPaginatorOptions(userPaginatorQuery);
    const users = await this.userQueryRepository.findAll(userPaginatorOptions);
    return users;
  }

  @Post()
  @UsePipes(ValidationPipe)
  async create(@Body() dto: CreateUserDto) {
    const newUserId = await this.userService.createNewUser(dto);
    return this.userQueryRepository.findUserById(newUserId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Res() res: Response) {
    const result = await this.userQueryRepository.deleteUserById(id);
    if (!result) return res.sendStatus(404);
    res.sendStatus(204);
  }
}
