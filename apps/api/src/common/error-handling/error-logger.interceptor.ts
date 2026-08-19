import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorLoggerInterceptor<T> implements NestInterceptor {
  private readonly logger = new Logger(ErrorLoggerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<T> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    return next.handle().pipe(
      catchError((error) => {
        // Body and headers are deliberately absent. A failed POST /auth/login
        // carries the password in the body and the session in the Cookie
        // header, and logs get shipped, tailed and pasted into tickets. Method
        // and path are enough to find the request in the pino access log,
        // which already redacts the sensitive headers.
        this.logger.error({
          message: 'Request failed',
          error: {
            message: error.message,
            stack: error.stack,
          },
          request: { method, url },
        });

        return throwError(() => error);
      }),
    );
  }
}
