import { Injectable } from '@nestjs/common';
import { CreateUserDto, UserDocument } from '../user-schema';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UsersRepository) {}

  async createNewUser(dto: CreateUserDto): Promise<UserDocument['id']> {
    return await this.userRepository.createUser(dto);
  }
}
