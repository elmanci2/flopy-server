// src/services/metadata/IAppMetadataStore.ts
import { DeploymentKey, type App } from "@prisma/client";

export interface IAppMetadataStore {
  create(name: string, ownerId: string): Promise<App>;
  listAll(): Promise<App[]>;
  findById(id: string | any): Promise<App | null>;
  deleteById(id: string | any): Promise<App | null>;
  findByDeploymentKey(
    key: string,
  ): Promise<{ app: App; channel: string } | null>;
  createDeploymentKey(appId: string | any, channel: string): Promise<DeploymentKey>;
  listDeploymentKeysForApp(appId: string | any): Promise<DeploymentKey[]>;
}
