-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientUniqueId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releaseId" TEXT NOT NULL,
    CONSTRAINT "Deployment_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Release" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "targetBinaryVersion" TEXT NOT NULL,
    "bundleUrl" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Release_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Release" ("appId", "bundleUrl", "channel", "createdAt", "hash", "id", "isActive", "isMandatory", "rolloutPercentage", "targetBinaryVersion") SELECT "appId", "bundleUrl", "channel", "createdAt", "hash", "id", "isActive", "isMandatory", "rolloutPercentage", "targetBinaryVersion" FROM "Release";
DROP TABLE "Release";
ALTER TABLE "new_Release" RENAME TO "Release";
CREATE UNIQUE INDEX "Release_hash_key" ON "Release"("hash");
CREATE INDEX "Release_appId_channel_isActive_createdAt_idx" ON "Release"("appId", "channel", "isActive", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Deployment_releaseId_idx" ON "Deployment"("releaseId");
