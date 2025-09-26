// src/services/metadata/PrismaReleaseMetadataStore.ts

import { singleton } from "tsyringe";
import { PrismaClient, Release } from "../../generated/prisma";
import * as semver from "semver";
import { IReleaseMetadataStore } from "./IReleaseMetadataStore";

@singleton()
export class PrismaReleaseMetadataStore implements IReleaseMetadataStore {
  private prisma = new PrismaClient();

  async create(data: Omit<Release, "id" | "createdAt">): Promise<Release> {
    return this.prisma.release.create({ data });
  }

  async update(
    id: string,
    data: Partial<Pick<Release, "isActive">>,
  ): Promise<Release | null> {
    try {
      return await this.prisma.release.update({ where: { id }, data });
    } catch (error) {
      return null;
    }
  }

  async findLatestActive(
    appId: string,
    channel: string,
    clientBinaryVersion: string,
  ): Promise<Release | null> {
    const candidates = await this.prisma.release.findMany({
      where: { appId, channel, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!candidates.length) return null;

    return (
      candidates.find((release) =>
        semver.satisfies(clientBinaryVersion, release.targetBinaryVersion),
      ) || null
    );
  }

  /**
   * Implementación de findById para satisfacer la interfaz.
   */
  async findById(id: string): Promise<Release | null> {
    return this.prisma.release.findUnique({ where: { id } });
  }

  /**
   * Implementación de findByAppId para satisfacer la interfaz.
   */
  async findByAppId(appId: string): Promise<Release[]> {
    return this.prisma.release.findMany({
      where: { appId },
      orderBy: { createdAt: "desc" },
    });
  }
}
