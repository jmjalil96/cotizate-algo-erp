/*
  Warnings:

  - You are about to drop the column `password_changed_at` on the `login_security` table. All the data in the column will be lost.
  - You are about to drop the column `last_used_at` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `reuse_detected` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `used` on the `refresh_tokens` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."email_verification_tokens" ALTER COLUMN "expires_at" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours');

-- AlterTable
ALTER TABLE "public"."login_security" DROP COLUMN "password_changed_at";

-- AlterTable
ALTER TABLE "public"."refresh_tokens" DROP COLUMN "last_used_at",
DROP COLUMN "reuse_detected",
DROP COLUMN "used",
ADD COLUMN     "revoked_reason" TEXT,
ADD COLUMN     "used_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."password_security" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reset_otp_hash" TEXT,
    "reset_otp_expires_at" TIMESTAMP(3),
    "reset_otp_sent_at" TIMESTAMP(3),
    "reset_attempt_count" INTEGER NOT NULL DEFAULT 0,
    "password_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_reset_at" TIMESTAMP(3),
    "last_reset_ip" TEXT,
    "reset_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_security_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_security_user_id_key" ON "public"."password_security"("user_id");

-- CreateIndex
CREATE INDEX "password_security_user_id_idx" ON "public"."password_security"("user_id");

-- AddForeignKey
ALTER TABLE "public"."password_security" ADD CONSTRAINT "password_security_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
