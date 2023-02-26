import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import {
  CreateSessionDto,
  Session,
  SessionDocument,
} from '../sessions/session.schema';
import { CreateUserDto, User, UserDocument } from '../user-schema';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserDocument['id']> {
    createUserDto['password'] = await bcrypt.hash(createUserDto.password, 1);
    const createdUser = new this.userModel(createUserDto);
    const result = await createdUser.save();
    return result._id.toString();
  }

  async createNewSession(createSessionDto: CreateSessionDto) {
    const newSession = new this.sessionModel(createSessionDto);
    const result = await newSession.save();
    return result._id.toString();
  }

  async saveUser(user: UserDocument) {
    await user.save();
  }

  async saveSession(session: SessionDocument) {
    await session.save();
  }

  async deleteSession(sessionId: Types.ObjectId) {
    await this.sessionModel.findByIdAndDelete(sessionId);
  }

  async deleteAllUsers() {
    return this.userModel.deleteMany({});
  }

  async deleteAllSessions() {
    return this.sessionModel.deleteMany({});
  }

  async findUserByLoginOrEmail(login: string, email: string) {
    const user = await this.userModel.findOne().or([{ login }, { email }]);
    return user;
  }

  async findUserByEmail(email: string) {
    const user = await this.userModel.findOne({ email });
    return user;
  }

  async findUserById(id: string) {
    const user = await this.userModel.findById(id);
    return user;
  }

  async findUserByConfirmCode(code: string) {
    const user = await this.userModel.findOne({
      'emailConfirmation.confirmationCode': code,
    });
    return user;
  }

  async findUserByRecoveryCode(code: string) {
    const user = await this.userModel.findOne({
      'passwordRecovery.recoveryCode': code,
    });
    return user;
  }
}
