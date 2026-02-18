-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
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
    "childContext" TEXT,
    "mentoriaReason" TEXT,
    "difficultSubjects" TEXT,
    "learningObjective" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "childMascot" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastSessionAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("childAge", "childContext", "childMascot", "createdAt", "difficultSubjects", "email", "hasRedoublement", "id", "isAdmin", "isLifetime", "isTdah", "lastSessionAt", "learningObjective", "mentoriaReason", "name", "onboardingDone", "passwordHash", "schoolLevel", "signupIp", "streak", "stripeCurrentPeriodEnd", "stripeCustomerId", "stripePriceId", "stripeSubscriptionId", "trialEndsAt", "updatedAt", "xp") SELECT "childAge", "childContext", "childMascot", "createdAt", "difficultSubjects", "email", "hasRedoublement", "id", "isAdmin", "isLifetime", "isTdah", "lastSessionAt", "learningObjective", "mentoriaReason", "name", "onboardingDone", "passwordHash", "schoolLevel", "signupIp", "streak", "stripeCurrentPeriodEnd", "stripeCustomerId", "stripePriceId", "stripeSubscriptionId", "trialEndsAt", "updatedAt", "xp" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
