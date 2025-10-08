import { inject, injectable } from "tsyringe";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

import { IReleaseMetadataStore } from "../services/metadata/IReleaseMetadataStore";
import { IBundleStorage } from "../services/storge/IBundleStorage";
import { IDeploymentMetadataStore } from "../services/metadata/IDeploymentMetadataStore";
import {
  CheckForUpdateRequest,
  CheckForUpdateResponse,
  Release,
} from "../types";

@injectable()
export class ReleaseOrchestrator {
  constructor(
    @inject("IReleaseMetadataStore")
    private readonly releaseStore: IReleaseMetadataStore,
    @inject("IBundleStorage") private readonly bundleStorage: IBundleStorage,
    @inject("IDeploymentMetadataStore")
    private readonly deploymentStore: IDeploymentMetadataStore,
  ) {}

  async publishNewRelease(
    appId: string,
    filePath: string,
    channel: string,
    targetBinaryVersion: string,
    isMandatory: boolean = false,
    rolloutPercentage: number = 100,
  ): Promise<Release> {
    const hash = await this.calculateHash(filePath);
    const fileName = `${hash}.zip`;
    const destinationPath = `${appId}/${channel}/${fileName}`;

    const bundleUrl = await this.bundleStorage.upload(
      filePath,
      destinationPath,
    );

    const newRelease = await this.releaseStore.create({
      appId,
      channel,
      targetBinaryVersion,
      bundleUrl,
      hash,
      isMandatory,
      rolloutPercentage,
      isActive: true,
    });

    return newRelease;
  }

  async checkForUpdate(
    request: CheckForUpdateRequest & {
      currentReleaseHash?: string;
    },
  ): Promise<CheckForUpdateResponse> {
    const { appId, channel, clientBinaryVersion, currentReleaseHash } = request;
    const latestRelease = await this.releaseStore.findLatestActive(
      appId,
      channel,
      clientBinaryVersion,
    );

    if (!latestRelease || latestRelease.hash === currentReleaseHash) {
      return { updateAvailable: false };
    }

    const isInRollout = Math.random() * 100 < latestRelease.rolloutPercentage;
    if (!isInRollout) {
      return { updateAvailable: false };
    }

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

  private getAllFiles(
    dirPath: string,
    arrayOfFiles: string[] = [],
    rootDir: string = dirPath,
  ): string[] {
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        this.getAllFiles(fullPath, arrayOfFiles, rootDir);
      } else {
        arrayOfFiles.push(path.relative(rootDir, fullPath).replace(/\\/g, "/"));
      }
    });
    return arrayOfFiles;
  }

  async rollback(releaseId: string): Promise<void> {
    const updated = await this.releaseStore.update(releaseId, {
      isActive: false,
    });
    if (!updated) {
      throw new Error(
        `No se pudo hacer rollback: La versión con ID "${releaseId}" no fue encontrada.`,
      );
    }
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

    return this.releaseStore.create({
      ...originalRelease,
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
   * Calcula el hash SHA256 de un archivo.
   */
  private calculateHash(filePath: string): Promise<string> {
    const stream = fs.createReadStream(filePath);
    const hash = crypto.createHash("sha256");
    stream.on("data", (data) => hash.update(data));
    return new Promise((resolve, reject) => {
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", (err) => reject(err));
    });
  }

  /**
   * deactive release
   */
  async changetState(releaseId: string, state: boolean): Promise<void> {
    await this.releaseStore.update(releaseId, { isActive: state });
  }
}
