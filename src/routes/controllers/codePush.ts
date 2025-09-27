// src/routes/controllers/codePush.ts

import { Request, Response } from "express";
import { container } from "tsyringe";
import { ReleaseOrchestrator } from "../../core/relase";
import { IAppMetadataStore } from "../../services/metadata/IAppMetadataStore";

class CodePushController {
  constructor(
    private readonly orchestrator: ReleaseOrchestrator,
    private readonly appStore: IAppMetadataStore,
  ) {}

  async updateCheck(req: Request, res: Response): Promise<void> {
    const { deploymentKey, appVersion, packageHash } = req.query as {
      [key: string]: string;
    };

    if (!deploymentKey || !appVersion || !packageHash) {
      res.status(400).json({ error: "Missing required parameters." });
      return;
    }

    const appInfo = await this.appStore.findByDeploymentKey(deploymentKey);
    if (!appInfo) {
      res.status(404).json({ error: "Deployment key not found." });
      return;
    }

    const flopyResponse = await this.orchestrator.checkForUpdate({
      appId: appInfo.app.id,
      channel: appInfo.channel,
      clientBinaryVersion: appVersion,
      currentReleaseHash: packageHash,
    });

    // 4. Traduce nuestra respuesta al formato que CodePush espera
    if (!flopyResponse.updateAvailable || !flopyResponse.package) {
      res.status(200).json({ updateInfo: { isAvailable: false } });
      return;
    }

    const codePushResponse = {
      updateInfo: {
        downloadURL: flopyResponse.package.bundleUrl,
        packageHash: flopyResponse.package.hash,
        appVersion: appVersion,
        isMandatory: flopyResponse.package.isMandatory,
        label: `v${flopyResponse.package.releaseId.substring(0, 6)}`,
        description: "",
        packageSize: 0,
      },
    };

    res.status(200).json(codePushResponse);
  }

  async reportStatus(_: Request, res: Response): Promise<void> {
    res.status(200).send();
  }
}

const releaseOrchestrator = container.resolve(ReleaseOrchestrator);
const appMetadataStore =
  container.resolve<IAppMetadataStore>("IAppMetadataStore");
const codePushController = new CodePushController(
  releaseOrchestrator,
  appMetadataStore,
);

export { codePushController };
