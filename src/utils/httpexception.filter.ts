import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    if (status === 400) {
      const errorsResponse = {
        errorsMessages: [] as any,
      };
      const res: any = exception.getResponse();
      if (typeof res.message === 'object') {
        res.message.forEach((m: any) => errorsResponse.errorsMessages.push(m));
      } else {
        errorsResponse.errorsMessages.push(res);
      }
      response.status(status).json(errorsResponse);
    } else if ([401, 404, 429].includes(status)) {
      response.sendStatus(status);
    } else {
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
