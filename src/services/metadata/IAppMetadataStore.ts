// src/services/metadata/IAppMetadataStore.ts
import { DeploymentKey, type App } from "../../generated/prisma";

export interface IAppMetadataStore {
  create(name: string, ownerId: string): Promise<App>;
  listAll(): Promise<App[]>;
  findById(id: string): Promise<App | null>;
  deleteById(id: string): Promise<App | null>;
  findByDeploymentKey(
    key: string,
  ): Promise<{ app: App; channel: string } | null>;
  createDeploymentKey(appId: string, channel: string): Promise<DeploymentKey>;
  listDeploymentKeysForApp(appId: string): Promise<DeploymentKey[]>;
}
