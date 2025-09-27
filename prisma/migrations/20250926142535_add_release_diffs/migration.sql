-- CreateTable
CREATE TABLE "ReleaseDiff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patchUrl" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromReleaseId" TEXT NOT NULL,
    "toReleaseId" TEXT NOT NULL,
    "releaseId" TEXT,
    CONSTRAINT "ReleaseDiff_fromReleaseId_fkey" FOREIGN KEY ("fromReleaseId") REFERENCES "Release" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReleaseDiff_toReleaseId_fkey" FOREIGN KEY ("toReleaseId") REFERENCES "Release" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReleaseDiff_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseDiff_fromReleaseId_toReleaseId_key" ON "ReleaseDiff"("fromReleaseId", "toReleaseId");
