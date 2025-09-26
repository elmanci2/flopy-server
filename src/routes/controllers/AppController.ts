// src/routes/controllers/app.ts
import { Request, Response } from "express";
import { IAppMetadataStore } from "../../services/metadata/IAppMetadataStore";
import { container } from "tsyringe";
import { AuthenticatedRequest } from "../../lib/auth.middleware";

// Clase normal, sin decoradores
class AppController {
  constructor(private readonly appStore: IAppMetadataStore) {}

  async createApp(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ message: "El campo 'name' es requerido." });
        return;
      }

      const ownerId = req.user?.id;
      if (!ownerId) {
        res
          .status(401)
          .json({ message: "No se pudo identificar al usuario autenticado." });
        return;
      }

      const newApp = await this.appStore.create(name, ownerId);
      res.status(201).json(newApp);
    } catch (error: any) {
      if (error.code === "P2002") {
        res.status(409).json({
          message: `La aplicación con el nombre '${req.body.name}' ya existe.`,
        });
      } else {
        res.status(500).json({ message: "Error interno del servidor." });
      }
    }
  }

  async listApps(_: Request, res: Response): Promise<void> {
    const apps = await this.appStore.listAll();
    res.status(200).json(apps);
  }

  async getApp(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "El campo 'id' es requerido." });
      return;
    }
    const app = await this.appStore.findById(id);
    if (!app) {
      res.status(404).json({ message: "Aplicación no encontrada." });
      return;
    }
    res.status(200).json(app);
  }

  async deleteApp(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "El campo 'id' es requerido." });
      return;
    }
    const deletedApp = await this.appStore.deleteById(id);
    if (!deletedApp) {
      res.status(404).json({ message: "Aplicación no encontrada." });
      return;
    }

    res.status(204).send();
  }
}

const appMetadataStore =
  container.resolve<IAppMetadataStore>("IAppMetadataStore");

const appController = new AppController(appMetadataStore);

export { appController };
