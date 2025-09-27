import { inject, injectable } from "tsyringe";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import archiver from "archiver";
import AdmZip from "adm-zip";
//@ts-ignore
import dirdiff from "dirdiff";

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

  /**
   * Orquesta la publicación de una nueva versión Y la generación de diffs en segundo plano.
   */
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

    console.log(`[1/3] Subiendo el paquete al almacenamiento final...`);
    const bundleUrl = await this.bundleStorage.upload(
      filePath,
      destinationPath,
    );
    console.log(` -> URL del Bundle: ${bundleUrl}`);

    console.log(
      `[2/3] Registrando metadatos de la versión en la base de datos...`,
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
    console.log(` -> Release creada con ID: ${newRelease.id}`);

    // --- ¡NUEVO! ---
    // 3. Inicia la generación de diffs en segundo plano (sin esperar a que termine).
    // Esto asegura que la respuesta de la API sea rápida.
    console.log(
      `[3/3] Iniciando la generación de parches diferenciales en segundo plano...`,
    );
    this.generateDiffsInBackground(newRelease).catch((err) => {
      console.error(
        `[ERROR][Diff] Falló la generación de parches para la release ${newRelease.id}:`,
        err,
      );
    });

    console.log("✅ ¡Versión publicada con éxito!");
    return newRelease;
  }

  /**
   * Orquesta la verificación de una actualización, ahora con soporte para diffs.
   */
  async checkForUpdate(
    request: CheckForUpdateRequest & { currentReleaseHash?: string },
  ): Promise<CheckForUpdateResponse> {
    const { appId, channel, clientBinaryVersion, currentReleaseHash } = request;
    const latestRelease = await this.releaseStore.findLatestActive(
      appId,
      channel,
      clientBinaryVersion,
    );

    if (!latestRelease) return { updateAvailable: false };
    if (latestRelease.hash === currentReleaseHash)
      return { updateAvailable: false };

    const isInRollout = Math.random() * 100 < latestRelease.rolloutPercentage;
    if (!isInRollout) return { updateAvailable: false };

    const responsePackage = {
      releaseId: latestRelease.id,
      bundleUrl: latestRelease.bundleUrl,
      hash: latestRelease.hash,
      isMandatory: latestRelease.isMandatory,
    };

    // --- ¡NUEVO! ---
    // Si el cliente envió el hash de su versión actual, intentamos encontrar un parche.
    if (currentReleaseHash) {
      const diff = await this.releaseStore.findDiff(
        currentReleaseHash,
        latestRelease.hash,
      );
      if (diff) {
        console.log(
          `[Diff] Parche encontrado desde ${currentReleaseHash} hacia ${latestRelease.hash}`,
        );
        return {
          updateAvailable: true,
          package: responsePackage,
          patch: {
            url: diff.patchUrl,
            hash: diff.hash,
          },
        };
      }
    }

    // Si no hay parche, se devuelve solo el paquete completo.
    return {
      updateAvailable: true,
      package: responsePackage,
    };
  }

  // --- MÉTODOS PRIVADOS PARA LA GENERACIÓN DE DIFFS ---

  /**
   * Proceso principal para generar los parches. Se ejecuta en segundo plano.
   */
  private async generateDiffsInBackground(toRelease: Release): Promise<void> {
    const tempDir = path.join("/tmp", `flopy-diff-${toRelease.id}`);
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      // 1. Descarga y descomprime el nuevo bundle (la versión de destino)
      const toReleaseZipPath = path.join(tempDir, `${toRelease.hash}_to.zip`);
      const toReleaseUnzippedPath = path.join(tempDir, "to_unzipped");
      await this.downloadAndUnzip(
        toRelease.bundleUrl,
        toReleaseZipPath,
        toReleaseUnzippedPath,
      );

      // 2. Encuentra las releases anteriores compatibles
      const previousReleases =
        await this.releaseStore.findPreviousReleases(toRelease);
      console.log(
        `[Diff] Se encontraron ${previousReleases.length} releases anteriores para generar parches.`,
      );

      // 3. Itera y crea un parche para cada una
      for (const fromRelease of previousReleases) {
        console.log(
          `[Diff] Generando parche desde ${fromRelease.hash} -> ${toRelease.hash}`,
        );
        const fromReleaseZipPath = path.join(
          tempDir,
          `${fromRelease.hash}_from.zip`,
        );
        const fromReleaseUnzippedPath = path.join(tempDir, "from_unzipped");

        // Descarga y descomprime el bundle antiguo
        await this.downloadAndUnzip(
          fromRelease.bundleUrl,
          fromReleaseZipPath,
          fromReleaseUnzippedPath,
        );

        // Genera el parche
        const patchZipPath = path.join(tempDir, `patch.zip`);
        await this.createPatch(
          fromReleaseUnzippedPath,
          toReleaseUnzippedPath,
          patchZipPath,
        );

        // Sube el parche y regístralo
        const patchHash = await this.calculateHash(patchZipPath);
        const patchFileName = `${patchHash}.zip`;
        const patchDestination = `${toRelease.appId}/${toRelease.channel}/patches/${patchFileName}`;

        const patchUrl = await this.bundleStorage.upload(
          patchZipPath,
          patchDestination,
        );

        await this.releaseStore.createDiff({
          patchUrl: patchUrl,
          hash: patchHash,
          fromReleaseId: fromRelease.id,
          toReleaseId: toRelease.id,
        });

        console.log(`[Diff] Parche guardado y registrado con éxito.`);
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  /**
   * Lógica para crear un paquete de parche.
   */
  private async createPatch(
    fromDir: string,
    toDir: string,
    outputPath: string,
  ): Promise<void> {
    const patchContentDir = path.join(
      path.dirname(outputPath),
      "patch_content",
    );
    if (fs.existsSync(patchContentDir))
      fs.rmSync(patchContentDir, { recursive: true, force: true });
    fs.mkdirSync(patchContentDir, { recursive: true });

    const diff = await dirdiff(fromDir, toDir, { computeHashes: true });

    const manifest = {
      deletedFiles: diff
        .filter((d: any) => d.state === "deleted")
        .map((d: any) => path.join(d.path, d.name).replace(/^\//, "")),
    };

    fs.writeFileSync(
      path.join(patchContentDir, "manifest.json"),
      JSON.stringify(manifest),
    );

    for (const d of diff) {
      if (d.state === "added" || d.state === "modified") {
        const sourcePath = path.join(toDir, d.path, d.name);
        const destPath = path.join(patchContentDir, d.path, d.name);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(sourcePath, destPath);
      }
    }

    await this.zipDirectory(patchContentDir, outputPath);
  }

  private async downloadAndUnzip(
    bundleUrl: string,
    zipPath: string,
    unzippedPath: string,
  ): Promise<void> {
    if (fs.existsSync(unzippedPath))
      fs.rmSync(unzippedPath, { recursive: true, force: true });
    const s3Key = new URL(bundleUrl).pathname.substring(1);
    await this.bundleStorage.download(s3Key, zipPath);
    new AdmZip(zipPath).extractAllTo(unzippedPath, true);
  }

  private zipDirectory(sourceDir: string, outPath: string): Promise<void> {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = fs.createWriteStream(outPath);

    return new Promise((resolve, reject) => {
      archive
        .directory(sourceDir, false)
        .on("error", (err) => reject(err))
        .pipe(stream);

      stream.on("close", () => resolve());
      archive.finalize();
    });
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
    console.log(
      `✅ Rollback exitoso. La versión "${releaseId}" ha sido desactivada.`,
    );
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
}
