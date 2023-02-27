import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { BlogsRepository } from '../blogs/repositories/blogs.repository';

@ValidatorConstraint({ name: 'IsBlogExists', async: true })
@Injectable()
export class IsBlogExistsConstraint implements ValidatorConstraintInterface {
  constructor(private blogsRepo: BlogsRepository) {}
  async validate(blogId: string) {
    const blog = await this.blogsRepo.findBlogById(blogId);
    if (!blog) return false;
    return true;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return 'Blog with this ID not exists!';
  }
}

// export function IsBlogExists(validationOptions?: ValidationOptions) {
//   return function (object: object, propertyName: string) {
//     registerDecorator({
//       target: object.constructor,
//       propertyName: propertyName,
//       options: validationOptions,
//       constraints: [],
//       validator: IsBlogExistsConstraint,
//     });
//   };
