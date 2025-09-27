// src/routes/list.ts

import { Response } from "express";
import { RouteLst } from "../types";
import { releaseController } from "./controllers/releace";
import { appController } from "./controllers/AppController";
import { authController } from "./controllers/auth";

// --- Importaciones de Middlewares y Esquemas ---
import { upload } from "../lib/multer.config";
import { authMiddleware } from "../lib/auth.middleware";
import { validate } from "../lib/validation.middleware";
import * as schemas from "./schemas";
import { codePushController } from "./controllers/codePush";

const routesList: RouteLst[] = [
  // --- Ruta Pública de Bienvenida ---
  {
    path: "/",
    method: "GET",
    handler: async (_, res: Response) => {
      res.status(200).json({ message: "Welcome to Flopy Server!" });
    },
  },

  // --- Rutas de Autenticación (Públicas y con Validación) ---
  {
    path: "/auth/register",
    method: "POST",
    // ¡La validación se añade aquí también!
    middleware: [validate(schemas.registerSchema, "body")],
    handler: authController.register.bind(authController),
  },
  {
    path: "/auth/login",
    method: "POST",
    middleware: [validate(schemas.loginSchema, "body")],
    handler: authController.login.bind(authController),
  },

  // --- Rutas de Gestión de Releases (Protegidas y con Validación) ---
  {
    path: "/check-for-update",
    method: "POST",
    middleware: [
      authMiddleware,
      validate(schemas.checkForUpdateSchema, "body"),
    ],
    handler: releaseController.checkForUpdate.bind(releaseController),
  },
  {
    path: "/publish",
    method: "POST",
    middleware: [
      authMiddleware,
      upload.single("bundle"), // Multer debe ir antes de la validación del body
      validate(schemas.publishReleaseSchema, "body"),
    ],
    handler: releaseController.publishNewRelease.bind(releaseController),
  },
  {
    path: "/releases/:id/rollback",
    method: "POST",
    middleware: [
      authMiddleware,
      validate(schemas.releaseIdParamsSchema, "params"),
    ],
    handler: releaseController.rollback.bind(releaseController),
  },
  {
    path: "/releases/:id/promote",
    method: "POST",
    middleware: [
      authMiddleware,
      validate(schemas.releaseIdParamsSchema, "params"),
      validate(schemas.promoteReleaseSchema, "body"),
    ],
    handler: releaseController.promoteRelease.bind(releaseController),
  },
  {
    path: "/report-status",
    method: "POST",
    middleware: [authMiddleware, validate(schemas.reportStatusSchema, "body")],
    handler: releaseController.reportStatus.bind(releaseController),
  },
  {
    path: "/apps/:appId/releases",
    method: "GET",
    middleware: [authMiddleware, validate(schemas.appIdParamsSchema, "params")],
    handler: releaseController.getHistory.bind(releaseController),
  },
  {
    path: "/releases/:id/metrics",
    method: "GET",
    middleware: [
      authMiddleware,
      validate(schemas.releaseIdParamsSchema, "params"),
    ],
    handler: releaseController.getMetrics.bind(releaseController),
  },

  // --- Rutas de Gestión de Apps (Protegidas y con Validación) ---
  {
    path: "/apps",
    method: "POST",
    middleware: [authMiddleware, validate(schemas.createAppSchema, "body")],
    handler: appController.createApp.bind(appController),
  },
  {
    path: "/apps",
    method: "GET",
    middleware: [authMiddleware],
    handler: appController.listApps.bind(appController),
  },
  {
    path: "/apps/:id",
    method: "GET",
    middleware: [
      authMiddleware,
      validate(schemas.getOrDeleteAppSchema, "params"),
    ],
    handler: appController.getApp.bind(appController),
  },
  {
    path: "/apps/:id",
    method: "DELETE",
    middleware: [
      authMiddleware,
      validate(schemas.getOrDeleteAppSchema, "params"),
    ],
    handler: appController.deleteApp.bind(appController),
  },

  {
    path: "/apps/:appId/deployments",
    method: "POST",
    middleware: [
      authMiddleware,
      validate(schemas.appIdParamsSchema, "params"),
      validate(schemas.createDeploymentSchema, "body"),
    ],
    handler: appController.createDeployment.bind(appController),
  },
  {
    path: "/apps/:appId/deployments",
    method: "GET",
    middleware: [authMiddleware, validate(schemas.appIdParamsSchema, "params")],
    handler: appController.listDeployments.bind(appController),
  },

  //code push

  {
    path: "/updateCheck",
    method: "GET",
    handler: codePushController.updateCheck.bind(codePushController),
  },
  {
    path: "/reportStatus/deploy",
    method: "POST",
    handler: codePushController.reportStatus.bind(codePushController),
  },
];

export { routesList };
