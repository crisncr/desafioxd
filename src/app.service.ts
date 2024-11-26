
import { Injectable, NestMiddleware } from '@nestjs/common';


@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}

// default-variables.middleware.ts

import { Request, Response, NextFunction } from 'express';

@Injectable()
export class DefaultVariablesMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    res.locals.errorMessage = null; // Define errorMessage por defecto
    next();
  }
}