import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BasicAuthGuard } from '../../auth/guards/basic.auth.guard';
import { IUsersQueryRepository } from '../repositories/users.query-repository.interface';
// import { UsersQueryRepository } from '../repositories/users.query-repository';
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
    @Inject('UsersQueryRepository')
    private readonly userQueryRepository: IUsersQueryRepository,
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
  async create(@Body() dto: CreateUserDto) {
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
