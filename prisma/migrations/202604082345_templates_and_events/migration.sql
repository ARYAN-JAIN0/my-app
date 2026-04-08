-- CreateTable
CREATE TABLE "public"."EmailTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'outbound',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailTemplate_userId_category_idx" ON "public"."EmailTemplate"("userId", "category");

-- CreateIndex
CREATE INDEX "EmailTemplate_userId_active_idx" ON "public"."EmailTemplate"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_userId_name_key" ON "public"."EmailTemplate"("userId", "name");

-- AddForeignKey
ALTER TABLE "public"."EmailTemplate" ADD CONSTRAINT "EmailTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;