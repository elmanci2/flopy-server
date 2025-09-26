// src/core/relase.ts

import { inject, injectable } from "tsyringe";
import * as fs from "fs";
import * as crypto from "crypto";

import { IReleaseMetadataStore } from "../services/metadata/IReleaseMetadataStore";
import { IBundleStorage } from "../services/storge/IBundleStorage"; // Corregida la ruta si es 'storage'
import { IDeploymentMetadataStore } from "../services/metadata/IDeploymentMetadataStore";
import {
  CheckForUpdateRequest,
  CheckForUpdateResponse,
  Release,
} from "../types";

@injectable()
export class ReleaseOrchestrator {
  /**
   * @param releaseStore El servicio para interactuar con los metadatos de Releases.
   * @param bundleStorage El servicio para subir los archivos de bundles.
   * @param deploymentStore El servicio para gestionar los reportes de despliegue.
   */
  constructor(
    // Renombrado para consistencia
    @inject("IReleaseMetadataStore")
    private readonly releaseStore: IReleaseMetadataStore,
    @inject("IBundleStorage") private readonly bundleStorage: IBundleStorage,
    @inject("IDeploymentMetadataStore")
    private readonly deploymentStore: IDeploymentMetadataStore,
  ) {}

  /**
   * Orquesta el flujo completo para publicar una nueva versión a partir de un archivo ya subido.
   * 1. Calcula el hash del archivo temporal.
   * 2. Sube el archivo al almacenamiento permanente.
   * 3. Registra los metadatos de la versión en la base de datos.
   */
  async publishNewRelease(
    appId: string,
    filePath: string, // La ruta al archivo temporal subido por multer
    channel: string,
    targetBinaryVersion: string,
    isMandatory: boolean = false,
    rolloutPercentage: number = 100,
  ): Promise<Release> {
    console.log(`[1/3] Procesando el archivo subido: ${filePath}`);

    console.log(`[2/3] Calculando hash (SHA256) del paquete...`);
    const hash = await this.calculateHash(filePath);
    console.log(` -> Hash: ${hash}`);

    console.log(`[3/3] Subiendo el paquete al almacenamiento final...`);
    // Usamos el hash en el nombre del archivo para evitar duplicados y colisiones
    const fileName = `${hash}.zip`;
    const destinationPath = `${appId}/${channel}/${fileName}`;
    const bundleUrl = await this.bundleStorage.upload(
      filePath,
      destinationPath,
    );
    console.log(` -> URL del Bundle: ${bundleUrl}`);

    console.log(`Registrando metadatos de la versión en la base de datos...`);
    const newRelease = await this.releaseStore.create({
      appId,
      channel,
      targetBinaryVersion,
      bundleUrl,
      hash,
      isMandatory,
      rolloutPercentage,
      isActive: true, // Toda nueva versión nace activa
    });

    console.log("✅ ¡Versión publicada con éxito!");
    return newRelease;
  }

  /**
   * Promueve una release existente a un nuevo canal.
   */
  async promoteRelease(releaseId: string, toChannel: string): Promise<Release> {
    console.log(`Promoviendo la versión ${releaseId} al canal ${toChannel}...`);
    const originalRelease = await this.releaseStore.findById(releaseId);
    if (!originalRelease) {
      throw new Error("Release original no encontrada para promover.");
    }

    // Reutiliza los datos clave para crear un nuevo registro
    return this.releaseStore.create({
      // Copia todos los campos del original...
      ...originalRelease,
      // ...y sobrescribe el canal.
      channel: toChannel,
    });
  }

  /**
   * Registra el estado de un despliegue reportado por un cliente.
   */
  async reportDeploymentStatus(data: {
    releaseId: string;
    clientUniqueId: string;
    status: "SUCCESS" | "FAILURE";
  }): Promise<void> {
    await this.deploymentStore.reportStatus(data);
  }

  /**
   * Obtiene el historial de todas las releases para una aplicación específica.
   */
  async getReleaseHistoryForApp(appId: string): Promise<Release[]> {
    return this.releaseStore.findByAppId(appId);
  }

  /**
   * Obtiene las métricas de éxito y fallo para una release específica.
   */
  async getMetricsForRelease(releaseId: string) {
    return this.deploymentStore.getMetricsForRelease(releaseId);
  }

  /**
   * Orquesta la verificación de una actualización para un cliente.
   */
  async checkForUpdate(
    request: CheckForUpdateRequest,
  ): Promise<CheckForUpdateResponse> {
    const { appId, channel, clientBinaryVersion } = request;
    const latestRelease = await this.releaseStore.findLatestActive(
      appId,
      channel,
      clientBinaryVersion,
    );

    if (!latestRelease) return { updateAvailable: false };

    const isInRollout = Math.random() * 100 < latestRelease.rolloutPercentage;
    if (!isInRollout) return { updateAvailable: false };

    return {
      updateAvailable: true,
      package: {
        releaseId: latestRelease.id,
        bundleUrl: latestRelease.bundleUrl,
        hash: latestRelease.hash,
        isMandatory: latestRelease.isMandatory,
      },
    };
  }

  /**
   * Orquesta un rollback marcando una versión como inactiva.
   */
  async rollback(releaseId: string): Promise<void> {
    const updated = await this.releaseStore.update(releaseId, {
      isActive: false,
    });
    if (!updated) {
      throw new Error(
        `No se pudo hacer rollback: La versión con ID "${releaseId}" no fue encontrada.`,
      );
    }
    console.log(
      `✅ Rollback exitoso. La versión "${releaseId}" ha sido desactivada.`,
    );
  }

  /**
   * Calcula el hash SHA256 de un archivo.
   */
  private calculateHash(filePath: string): Promise<string> {
    // ... (Este método estaba correcto, no necesita cambios) ...
    const stream = fs.createReadStream(filePath);
    const hash = crypto.createHash("sha256");
    stream.on("data", (data) => hash.update(data));
    return new Promise((resolve, reject) => {
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", (err) => reject(err));
    });
  }
}
