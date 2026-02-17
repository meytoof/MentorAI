-- AlterTable
ALTER TABLE "User" ADD COLUMN "signupIp" TEXT;

-- CreateTable
CREATE TABLE "SignupFromIp" (
    "ip" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastAt" DATETIME NOT NULL
);
