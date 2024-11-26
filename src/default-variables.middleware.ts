
import { Injectable, NestMiddleware } from '@nestjs/common';  // Asegúrate de importar NestMiddleware aquí
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class DefaultVariablesMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    res.locals.errorMessage = null; // Define errorMessage por defecto
    next();
  }
}
