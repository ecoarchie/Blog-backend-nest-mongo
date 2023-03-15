import { UserPaginatorOptions, UsersPagination } from '../user-schema';

// export const UsersQueryRepository = 'UsersQueryRepository';

export interface IUsersQueryRepository {
  findAll(paginatorOptions: UserPaginatorOptions): Promise<UsersPagination>;

  findUserById(id: string): any;

  findUserByRecoveryCode(recoveryCode: string): any;

  findUserLeanDocumentById(id: string): any;

  findUserByLoginOrEmail(login: string, email: string): any;

  getUserLoginById(id: string): Promise<string | null>;

  deleteUserById(id: string): Promise<boolean>;

  // private toUserDto(user: LeanDocument<UserDocument>): any;
}
