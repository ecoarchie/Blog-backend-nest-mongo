import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BasicAuthGuard } from '../../auth/guards/basic.auth.guard';
import { UsersQueryRepository } from '../repositories/users.query-repository';
import {
  BanUserDto,
  CreateUserDto,
  UserPaginatorOptions,
  UsersPagination,
} from '../user-schema';
import { UsersService } from '../users.service';

@UseGuards(BasicAuthGuard)
@Controller('sa/users')
export class UserController {
  constructor(
    private readonly userQueryRepository: UsersQueryRepository,
    private readonly userService: UsersService,
  ) {}

  @Get()
  async findAll(
    @Query() userPaginatorQuery: UserPaginatorOptions,
  ): Promise<UsersPagination> {
    console.log(
      '🚀 ~ file: users.controller.ts:36 ~ UserController ~ userPaginatorQuery:',
      userPaginatorQuery,
    );
    const userPaginatorOptions = new UserPaginatorOptions(userPaginatorQuery);
    const users = await this.userQueryRepository.findAll(userPaginatorOptions);
    return users;
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    console.log(
      '🚀 ~ file: users.controller.ts:47 ~ UserController ~ create ~ dto:',
      dto,
    );
    const newUserId = await this.userService.createNewUser(dto);
    return this.userQueryRepository.findUserById(newUserId);
  }

  @HttpCode(204)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    const result = await this.userQueryRepository.deleteUserById(id);
    if (!result) throw new NotFoundException();
  }

  @HttpCode(204)
  @Put(':id/ban')
  async banUnbanUser(
    @Param('id') userId: string,
    @Body() banUserDto: BanUserDto,
  ) {
    await this.userService.banUnbanUser(userId, banUserDto);
  }
}
