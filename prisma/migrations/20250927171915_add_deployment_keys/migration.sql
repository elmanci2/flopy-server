-- CreateTable
CREATE TABLE "DeploymentKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appId" TEXT NOT NULL,
    CONSTRAINT "DeploymentKey_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DeploymentKey_key_key" ON "DeploymentKey"("key");

-- CreateIndex
CREATE UNIQUE INDEX "DeploymentKey_appId_channel_key" ON "DeploymentKey"("appId", "channel");
