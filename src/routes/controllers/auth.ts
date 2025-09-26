// src/routes/controllers/auth.ts
import { Request, Response } from "express";
import { container } from "tsyringe";
import { AuthService } from "../../services/auth/AuthService";

class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const user = await this.authService.register(email, password);
      res.status(201).json({ id: user.id, email: user.email });
    } catch (error: any) {
      if (error.code === "P2002") {
        res.status(409).json({ message: "El email ya está en uso." });
      } else {
        res.status(500).json({ message: "Error interno del servidor." });
      }
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const token = await this.authService.login(email, password);
    if (!token) {
      res.status(401).json({ message: "Credenciales inválidas." });
      return;
    }
    res.status(200).json({ token });
  }
}

const authService = container.resolve(AuthService);
const authController = new AuthController(authService);

export { authController };
