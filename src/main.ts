// src/main.ts

import "reflect-metadata";

import "./container";

import express from "express";
import router from "./routes/routes";

class Main {
  private app: express.Application;

  constructor() {
    this.app = express();
  }

  private setup() {
    console.log("[server] Configurando servidor...");
    this.app.use(express.json());
    this.app.use("/api", router);
    console.log("[server] Servidor configurado.");
  }

  public start() {
    this.setup();

    const PORT = process.env.PORT || 3100;

    this.app.listen(PORT, () => {
      console.log("[server] Servidor iniciado en el puerto", PORT);
    });
  }
}

new Main().start();
