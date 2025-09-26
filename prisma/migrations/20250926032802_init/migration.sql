-- CreateTable
CREATE TABLE "Release" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "targetBinaryVersion" TEXT NOT NULL,
    "bundleUrl" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Release_hash_key" ON "Release"("hash");

-- CreateIndex
CREATE INDEX "Release_appId_channel_isActive_createdAt_idx" ON "Release"("appId", "channel", "isActive", "createdAt");
