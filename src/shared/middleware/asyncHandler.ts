import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Envolve um handler async e encaminha qualquer erro para o middleware de
 * erro via `next()`. No Express 4, erros de rotas async não chegam sozinhos
 * ao error handler — este wrapper resolve isso e dispensa o try/catch nas rotas.
 */
export const asyncHandler =
    (handler: RequestHandler): RequestHandler =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
