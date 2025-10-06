// src/services/metadata/PrismaDeploymentMetadataStore.ts
import { singleton } from "tsyringe";

import {
  IDeploymentMetadataStore,
  DeploymentMetrics,
} from "./IDeploymentMetadataStore";
import { PrismaClient } from "@prisma/client";

@singleton()
export class PrismaDeploymentMetadataStore implements IDeploymentMetadataStore {
  private prisma = new PrismaClient();

  async reportStatus(data: {
    releaseId: string;
    clientUniqueId: string;
    status: "SUCCESS" | "FAILURE";
  }): Promise<void> {
    await this.prisma.deployment.create({ data });
  }

  async getMetricsForRelease(releaseId: string): Promise<DeploymentMetrics> {
    const counts = await this.prisma.deployment.groupBy({
      by: ["status"],
      where: { releaseId },
      _count: {
        status: true,
      },
    });
    const success =
      counts.find((c) => c.status === "SUCCESS")?._count.status || 0;
    const failure =
      counts.find((c) => c.status === "FAILURE")?._count.status || 0;
    return { success, failure, total: success + failure };
  }
}
