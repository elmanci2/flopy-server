-- CreateTable
CREATE TABLE "App" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    CONSTRAINT "Release_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Release" ("appId", "bundleUrl", "channel", "createdAt", "hash", "id", "isActive", "isMandatory", "rolloutPercentage", "targetBinaryVersion") SELECT "appId", "bundleUrl", "channel", "createdAt", "hash", "id", "isActive", "isMandatory", "rolloutPercentage", "targetBinaryVersion" FROM "Release";
DROP TABLE "Release";
ALTER TABLE "new_Release" RENAME TO "Release";
CREATE UNIQUE INDEX "Release_hash_key" ON "Release"("hash");
CREATE INDEX "Release_appId_channel_isActive_createdAt_idx" ON "Release"("appId", "channel", "isActive", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "App_name_key" ON "App"("name");

-- CreateIndex
CREATE UNIQUE INDEX "App_apiKey_key" ON "App"("apiKey");
