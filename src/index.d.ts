import { UserDocument } from '../src/users/user-schema';
declare global {
  declare namespace Express {
    export interface Request {
      user: Pick<UserDocument, 'id' | 'login'> | null;
    }
  }
}
