// src/services/metadata/PrismaReleaseMetadataStore.ts

import { singleton } from "tsyringe";

import * as semver from "semver";
import { IReleaseMetadataStore } from "./IReleaseMetadataStore";
import { PrismaClient, Release, ReleaseDiff } from "@prisma/client";

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
      candidates.find((release: any) =>
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

  async findPreviousReleases(release: Release): Promise<Release[]> {
    // Lógica para encontrar hasta 5 releases anteriores en el mismo canal y con el mismo targetBinaryVersion
    return this.prisma.release.findMany({
      where: {
        appId: release.appId,
        channel: release.channel,
        targetBinaryVersion: release.targetBinaryVersion,
        createdAt: { lt: release.createdAt }, // lt = less than
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5, // Limita a generar diffs solo para las 5 versiones más recientes
    });
  }

  async findDiff(
    fromHash: string,
    toHash: string,
  ): Promise<ReleaseDiff | null> {
    return this.prisma.releaseDiff.findFirst({
      where: {
        fromRelease: { hash: fromHash },
        toRelease: { hash: toHash },
      },
    });
  }

  async createDiff(
    data: Omit<ReleaseDiff, "id" | "createdAt">,
  ): Promise<ReleaseDiff> {
    return this.prisma.releaseDiff.create({ data });
  }
}
