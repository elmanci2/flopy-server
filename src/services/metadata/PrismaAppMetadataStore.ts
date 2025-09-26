// src/services/metadata/PrismaAppMetadataStore.ts
import { singleton } from "tsyringe";
import { PrismaClient } from "../../generated/prisma";
import { IAppMetadataStore } from "./IAppMetadataStore";
import { App } from "../../generated/prisma";

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
}
