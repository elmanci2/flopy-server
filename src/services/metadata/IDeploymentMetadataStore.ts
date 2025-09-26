// src/services/metadata/IDeploymentMetadataStore.ts
export interface DeploymentMetrics {
  success: number;
  failure: number;
  total: number;
}

export interface IDeploymentMetadataStore {
  reportStatus(data: {
    releaseId: string;
    clientUniqueId: string;
    status: "SUCCESS" | "FAILURE";
  }): Promise<void>;
  getMetricsForRelease(releaseId: string): Promise<DeploymentMetrics>;
}
