import type { NextFunction, Request, Response } from "express";

/**
 * Erro de aplicação com status HTTP. Lance isso nas camadas de negócio
 * (ex: `throw new AppError(404, "Product not found")`) para controlar
 * o status devolvido; qualquer outro erro vira 500.
 */
export class AppError extends Error {
    constructor(public readonly statusCode: number, message: string) {
        super(message);
        this.name = "AppError";
    }
}

/**
 * Middleware de tratamento de erros. Precisa ter os 4 parâmetros
 * (err, req, res, next) para o Express reconhecê-lo como error handler,
 * e deve ser registrado DEPOIS de todas as rotas.
 */
export const errorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ message: err.message });
    }

    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
};
