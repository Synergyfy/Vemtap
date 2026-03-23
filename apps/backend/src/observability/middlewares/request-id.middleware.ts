import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Check if x-request-id header exists
    const incomingRequestId = req.headers['x-request-id'] as string;

    // Use incoming ID or generate a new one
    const requestId = incomingRequestId || randomUUID();

    // Attach to request object for later use
    (req as any).requestId = requestId;

    // Also send it back in the response headers
    res.setHeader('x-request-id', requestId);

    next();
  }
}
