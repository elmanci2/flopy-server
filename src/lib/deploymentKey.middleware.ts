// src/lib/deploymentKey.middleware.ts

import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware";
import { container } from "tsyringe";
import { IAppMetadataStore } from "../services/metadata/IAppMetadataStore";
import { App } from "@prisma/client";

// Extendemos la petición para que pueda contener la información de la app validada
export interface ValidatedAppRequest extends AuthenticatedRequest {
  validatedApp?: App;
  validatedChannel?: string;
}

const appStore = container.resolve<IAppMetadataStore>("IAppMetadataStore");

/**
 * Middleware para validar una deploymentKey.
 * Verifica que la clave exista y que la appId/channel de la petición coincidan.
 */
export const deploymentKeyAuth = async (
  req: ValidatedAppRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const deploymentKey = req.headers["x-deployment-key"];
  const appId = req.body.appId || (req.query.appId as string);
  const channel = req.body.channel || (req.query.channel as string);

  if (!deploymentKey) {
    return res
      .status(401)
      .json({ message: "Falta la clave de despliegue (deploymentKey)." });
  }

  try {
    //1 validate key formates
    if (typeof deploymentKey !== "string") {
      return res.status(400).json({
        message: "La clave de despliegue no tiene el formato correcto.",
      });
    }

    const keyInfo = await appStore.findByDeploymentKey(deploymentKey);

    if (!keyInfo) {
      return res
        .status(403)
        .json({ message: "La clave de despliegue es inválida." });
    }

    if (appId && keyInfo.app.id !== appId) {
      return res.status(403).json({
        message:
          "Permiso denegado: La clave de despliegue no pertenece a esta aplicación.",
      });
    }

    if (channel && keyInfo.channel !== channel) {
      return res.status(403).json({
        message:
          "Permiso denegado: La clave de despliegue no es para este canal.",
      });
    }

    req.validatedApp = keyInfo.app;
    req.validatedChannel = keyInfo.channel;
    req.body = keyInfo;

    next();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error interno del servidor al validar la clave." });
  }
};
