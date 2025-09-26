// src/lib/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { container } from "tsyringe";

import { PrismaClient } from "../generated/prisma";
import { AuthService } from "../services/auth/AuthService";

// Define una extensión de la interfaz Request de Express para añadir el usuario
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

const authService = container.resolve(AuthService);
const prisma = new PrismaClient();

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Acceso denegado. No se proporcionó un token." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token inválido o expirado." });
  }

  const payload = authService.verifyToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Token inválido o expirado." });
  }

  // Opcional pero recomendado: verifica que el usuario todavía existe en la DB
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    return res
      .status(401)
      .json({ message: "Usuario asociado al token ya no existe." });
  }

  // Añade el usuario a la petición para que los controladores posteriores puedan usarlo
  req.user = { id: user.id };
  next();
};
