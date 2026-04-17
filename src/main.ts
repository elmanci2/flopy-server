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

    // Manual CORS middleware
    this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
      
      if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
      }
      next();
    });

    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.url}`);

      res.on("finish", () => {
        this.logger.success(`${res.statusCode} ${req.method} ${req.url}`);
      });

      next();
    });

    this.app.use(router);

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
