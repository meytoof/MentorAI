-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "trialEndsAt" DATETIME NOT NULL,
    "isTdah" BOOLEAN NOT NULL DEFAULT false,
    "signupIp" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeCurrentPeriodEnd" DATETIME,
    "isLifetime" BOOLEAN NOT NULL DEFAULT false,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "childAge" INTEGER,
    "schoolLevel" TEXT,
    "hasRedoublement" BOOLEAN,
    "mentoriaReason" TEXT,
    "difficultSubjects" TEXT,
    "learningObjective" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "isLifetime", "isTdah", "name", "passwordHash", "signupIp", "stripeCurrentPeriodEnd", "stripeCustomerId", "stripePriceId", "stripeSubscriptionId", "trialEndsAt", "updatedAt") SELECT "createdAt", "email", "id", "isLifetime", "isTdah", "name", "passwordHash", "signupIp", "stripeCurrentPeriodEnd", "stripeCustomerId", "stripePriceId", "stripeSubscriptionId", "trialEndsAt", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
