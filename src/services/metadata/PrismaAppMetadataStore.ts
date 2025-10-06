// src/services/metadata/PrismaAppMetadataStore.ts
import { singleton } from "tsyringe";

import { IAppMetadataStore } from "./IAppMetadataStore";
import { App, DeploymentKey, PrismaClient } from "@prisma/client";

@singleton()
export class PrismaAppMetadataStore implements IAppMetadataStore {
  private prisma = new PrismaClient();

  async create(name: string, ownerId: string): Promise<App> {
    return this.prisma.app.create({
      data: {
        name,
        users: {
          create: [
            {
              userId: ownerId,
            },
          ],
        },
      },
    });
  }

  async listAll(): Promise<App[]> {
    return this.prisma.app.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<App | null> {
    return this.prisma.app.findUnique({
      where: { id },
    });
  }

  async deleteById(id: string): Promise<App | null> {
    try {
      return await this.prisma.app.delete({
        where: { id },
      });
    } catch (error) {
      return null;
    }
  }

  async findByDeploymentKey(
    key: string,
  ): Promise<{ app: App; channel: string } | null> {
    const deploymentKey = await this.prisma.deploymentKey.findUnique({
      where: { key },
      include: { app: true },
    });

    if (!deploymentKey) {
      return null;
    }

    return { app: deploymentKey.app, channel: deploymentKey.channel };
  }

  async createDeploymentKey(
    appId: string,
    channel: string,
  ): Promise<DeploymentKey> {
    return this.prisma.deploymentKey.create({
      data: {
        appId,
        channel,
      },
    });
  }

  async listDeploymentKeysForApp(appId: string): Promise<DeploymentKey[]> {
    return this.prisma.deploymentKey.findMany({
      where: { appId },
      orderBy: { channel: "asc" },
    });
  }
}
