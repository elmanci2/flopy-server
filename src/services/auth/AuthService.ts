// src/core/AuthService.ts

import { singleton } from "tsyringe";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient, User } from "@prisma/client";

interface JwtPayload {
  userId: string;
}

@singleton()
export class AuthService {
  private prisma = new PrismaClient();
  private jwtSecret = process.env.JWT_SECRET!;

  constructor() {
    if (!this.jwtSecret) {
      throw new Error("La variable de entorno JWT_SECRET es requerida.");
    }
  }

  async register(email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
  }

  async login(email: string, password: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const payload: JwtPayload = { userId: user.id };
    return jwt.sign(payload, this.jwtSecret, { expiresIn: "30d" }); // El token expira en 30 días
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch (error) {
      return null; // Token inválido o expirado
    }
  }
}
