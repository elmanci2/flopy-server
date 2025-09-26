// src/container/index.ts

// ¡Esta importación es crucial y debe ser la primera!
import "reflect-metadata";

import { container } from "tsyringe";

import { IAppMetadataStore } from "../services/metadata/IAppMetadataStore";
import { IBundleStorage } from "../services/storge/IBundleStorage";
import { IDeploymentMetadataStore } from "../services/metadata/IDeploymentMetadataStore";
import { IReleaseMetadataStore } from "../services/metadata/IReleaseMetadataStore";

import { PrismaAppMetadataStore } from "../services/metadata/PrismaAppMetadataStore";
import { S3BundleStorage } from "../services/storge/S3BundleStorage";
import { PrismaDeploymentMetadataStore } from "../services/metadata/PrismaDeploymentMetadataStore";
import { PrismaReleaseMetadataStore } from "../services/metadata/PrismaMetadataStore";

// App
container.register<IAppMetadataStore>("IAppMetadataStore", {
  useClass: PrismaAppMetadataStore,
});

// Storage
container.register<IBundleStorage>("IBundleStorage", {
  useClass: S3BundleStorage,
});

// Deployment
container.register<IDeploymentMetadataStore>("IDeploymentMetadataStore", {
  useClass: PrismaDeploymentMetadataStore,
});

// Release
container.register<IReleaseMetadataStore>("IReleaseMetadataStore", {
  useClass: PrismaReleaseMetadataStore,
});
