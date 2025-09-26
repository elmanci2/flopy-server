import { type Request, type Response } from "express";

export type RouteLst = {
  path: string;
  method: string;
  handler: (
    req: Request & { file: { path: string } },
    res: Response,
  ) => Promise<void>;
  middleware?: Array<(req: Request, res: Response, next: () => void) => void>;
};

/**
 * Representa el registro de una versión en la base de datos.
 */
export interface Release {
  id: string;
  appId: string;
  channel: string;
  targetBinaryVersion: string; // Rango SemVer, ej: ">=1.0.0 <2.0.0"
  bundleUrl: string;
  hash: string;
  isMandatory: boolean;
  rolloutPercentage: number;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Datos que el cliente envía para buscar una actualización.
 */
export interface CheckForUpdateRequest {
  appId: string;
  clientBinaryVersion: string;
  channel: string;
}

/**
 * La respuesta que el servidor envía al cliente.
 */
export interface CheckForUpdateResponse {
  updateAvailable: boolean;
  package?: {
    releaseId: string;
    bundleUrl: string;
    hash: string;
    isMandatory: boolean;
  };
}
