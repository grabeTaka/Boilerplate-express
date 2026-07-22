import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler.ts";

/**
 * Middleware que roda ANTES da rota e verifica se a requisição traz o
 * header `Authorization`. Se não vier, encaminha um 401 para o error
 * handler; se vier, segue para o próximo handler com `next()`.
 */
export const ensureAuth = (req: Request, _res: Response, next: NextFunction) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return next(new AppError(401, "Missing authorization header"));
    }

    return next();
};
