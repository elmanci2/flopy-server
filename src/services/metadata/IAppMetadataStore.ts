// src/services/metadata/IAppMetadataStore.ts
import { type App } from "../../generated/prisma";

export interface IAppMetadataStore {
  create(name: string, ownerId: string): Promise<App>;
  listAll(): Promise<App[]>;
  findById(id: string): Promise<App | null>;
  deleteById(id: string): Promise<App | null>;
}
