CREATE TABLE "UserPasswordCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordSalt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPasswordCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserPasswordCredential_userId_key" ON "UserPasswordCredential"("userId");

ALTER TABLE "UserPasswordCredential"
ADD CONSTRAINT "UserPasswordCredential_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
