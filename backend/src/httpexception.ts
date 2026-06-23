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

        if (exception instanceof HttpException) {
            const exceptionResponse = exception.getResponse();

            return response.status(exception.getStatus()).json(
                typeof exceptionResponse === 'string'
                    ? {
                        statusCode: exception.getStatus(),
                        message: exceptionResponse,
                    }
                    : exceptionResponse,
            );
        }

        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Unknown Error Occurred',
        });
    }
}