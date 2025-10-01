// src/main.ts

import "reflect-metadata";
import "./container";

import express from "express";
import router from "./routes/routes";
import { Signale } from "signale";

class Main {
  private app: express.Application;
  private logger: Signale;

  constructor() {
    this.app = express();
    this.logger = new Signale({ scope: "server" });
  }

  private setup() {
    this.logger.pending("Configurando servidor...");

    this.app.use(express.json());

    // 🔹 Middleware de logging
    this.app.use((req, res, next) => {
      // log entrada
      this.logger.info(`${req.method} ${req.url}`);

      // log salida cuando termina
      res.on("finish", () => {
        this.logger.success(`${res.statusCode} ${req.method} ${req.url}`);
      });

      next();
    });

    // Rutas
    this.app.use(router);

    // Ejemplo de GET /
    this.app.get("/", (_, res) => {
      res.send("Hello API 🚀");
    });

    this.logger.success("Servidor configurado.");
  }

  public start() {
    this.setup();

    const PORT = process.env.PORT || 3100;

    this.app.listen(PORT, () => {
      this.logger.start(`Servidor iniciado en el puerto ${PORT} 🚀`);
    });
  }
}

new Main().start();
