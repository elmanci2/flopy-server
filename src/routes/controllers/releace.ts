// src/routes/ReleaseController.ts

import { Request, Response } from "express";
import { ReleaseOrchestrator } from "../../core/relase";

import fs from "fs";
import { container } from "tsyringe";

class ReleaseController {
  constructor(private readonly orchestrator: ReleaseOrchestrator) {}

  async publishNewRelease(
    req: Request & { file: { path: string } },
    res: Response,
  ): Promise<void> {
    try {
      if (!req.file) {
        // req.file viene de multer
        res
          .status(400)
          .json({ message: "Falta el archivo del bundle (.zip)." });
        return;
      }
      const {
        appId,
        channel,
        targetBinaryVersion,
        isMandatory,
        rolloutPercentage,
      } = req.body;
      const newRelease = await this.orchestrator.publishNewRelease(
        appId,
        req.file.path,
        channel,
        targetBinaryVersion,
        isMandatory,
        rolloutPercentage,
      );
      await fs.promises.unlink(req.file.path);
      res.status(201).json(newRelease);
    } catch (error) {
      console.error("[Controller] Error en publishNewRelease:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  }

  /**
   * Maneja la petición del cliente para buscar una actualización.
   */
  async checkForUpdate(req: Request, res: Response): Promise<void> {
    try {
      console.log(req.body);
      const { appId, clientBinaryVersion, channel } = req.body;
      if (!appId || !clientBinaryVersion || !channel) {
        res.status(400).json({
          message:
            "Faltan parámetros requeridos: appId, clientBinaryVersion, channel.",
        });
        return;
      }
      const result = await this.orchestrator.checkForUpdate(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error("[Controller] Error en checkForUpdate:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  }

  /**
   * Maneja la petición para realizar un rollback de una versión.
   */
  async rollback(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res
          .status(400)
          .json({ message: "Falta el ID de la versión en la URL." });
        return;
      }
      await this.orchestrator.rollback(id);
      res.status(200).json({
        message: `Rollback para la versión ${id} realizado con éxito.`,
      });
    } catch (error) {
      console.error(
        `[Controller] Error en rollback para ${req.params.id}:`,
        error,
      );
      if (
        error instanceof Error &&
        error.message.includes("no fue encontrada")
      ) {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Error interno del servidor." });
      }
    }
  }

  async promoteRelease(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { toChannel } = req.body;
      if (!id || !toChannel) {
        res.status(400).json({ message: "id and toChannel are required" });
        return;
      }
      const promoted = await this.orchestrator.promoteRelease(id, toChannel);
      res.status(201).json(promoted);
    } catch (error) {
      console.error("[Controller] Error en checkForUpdate:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  }

  async reportStatus(req: Request, res: Response): Promise<void> {
    try {
      await this.orchestrator.reportDeploymentStatus(req.body);
      res.status(204).send();
    } catch (error) {
      console.error("[Controller] Error en checkForUpdate:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  }

  async getHistory(req: Request, res: Response): Promise<void> {
    if (!req.params.appId) {
      res.status(400).json({ message: "appId is required" });
      return;
    }
    const history = await this.orchestrator.getReleaseHistoryForApp(
      req.params.appId,
    );
    res.status(200).json(history);
  }

  async getMetrics(req: Request, res: Response): Promise<void> {
    if (!req.params.id) {
      res.status(400).json({ message: "id is required" });
      return;
    }
    const metrics = await this.orchestrator.getMetricsForRelease(req.params.id);
    res.status(200).json(metrics);
  }

  async changetState(req: Request, res: Response): Promise<void> {
    try {
      if (req.body.id === undefined || req.body.state === undefined) {
        const message =
          req.body.id === undefined ? "id is required" : "state is required";
        res.status(400).json({ message });
        return;
      }

      await this.orchestrator.changetState(req.body.id, req.body.state);
      res.status(204).send();
    } catch (error) {
      console.error("[Controller] Error en checkForUpdate:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  }

  // async deactivateOtherReleases(appId: string, channel: string, excludeId: string) {
  //   await this.prisma.release.updateMany({
  //     where: {
  //       appId,
  //       channel,
  //       id: { not: excludeId },
  //       isActive: true,
  //     },
  //     data: { isActive: false },
  //   });
  // }
}

const releaseOrchestrator = container.resolve(ReleaseOrchestrator);

const releaseController = new ReleaseController(releaseOrchestrator);

export { releaseController };
