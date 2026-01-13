/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Optional,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorResponse } from '../dtos';
import { type GlobalFilterOptions } from '../interfaces/filter.interface';
import { ErrorCode } from '../enums';
import { randomUUID } from 'crypto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(@Optional() private readonly options: GlobalFilterOptions = {}) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
    let validationErrors = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;

      message = res.message || exception.message;
      errorCode = res.errorCode || errorCode;
      if (res.errors) validationErrors = res.errors;
      if (Array.isArray(res.message)) {
        validationErrors = res.message;
        message = 'Validation failed';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }
    const traceId = status >= (500 as HttpStatus) ? randomUUID() : undefined;
    if (traceId) {
      message = `Internal server error (Trace ID: ${traceId})`;
    }

    const shouldLog =
      this.options.debug ?? process.env.NODE_ENV !== 'production';

    if (shouldLog && status >= (500 as HttpStatus)) {
      if (exception instanceof Error) {
        this.logger.error({
          msg: `Error processing ${request.method} ${request.url}`,
          traceId,
          exception: exception instanceof Error ? exception.stack : exception,
          body: request.body,
        });
      } else {
        this.logger.error(JSON.stringify(exception));
      }
    }

    const errorResponse = new ErrorResponse(message, errorCode, status);
    const finalStatus = errorResponse.error.statusCode || status || 500;

    const finalResponse = {
      ...errorResponse,
      ...(traceId ? { traceId } : null),
      ...(validationErrors ? { details: validationErrors } : null),
    };

    response.status(finalStatus).json(finalResponse);
  }
}
