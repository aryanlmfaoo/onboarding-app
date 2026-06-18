import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class UnknownExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    // If something already threw a proper HttpException (yours or Nest's),
    // leave it alone and pass it through as-is.
    if (exception instanceof HttpException) {
      return response
        .status(exception.getStatus())
        .json(exception.getResponse());
    }

    // Anything else falls through to the generic 500.
    const fallback = new HttpException(
      'Unknown Error Occurred',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    return response.status(fallback.getStatus()).json(fallback.getResponse());
  }
}
