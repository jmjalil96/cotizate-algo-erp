/*
  Warnings:

  - You are about to drop the column `failed_login_count` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_login_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_login_ip` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `mfa_secret` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password_changed_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `requires_otp` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."email_verification_tokens" ALTER COLUMN "expires_at" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours');

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "failed_login_count",
DROP COLUMN "last_login_at",
DROP COLUMN "last_login_ip",
DROP COLUMN "mfa_secret",
DROP COLUMN "password_changed_at",
DROP COLUMN "requires_otp";

-- CreateTable
CREATE TABLE "public"."login_security" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mfa_secret" TEXT,
    "password_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requires_otp" BOOLEAN NOT NULL DEFAULT false,
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" TEXT,
    "login_otp_hash" TEXT,
    "login_otp_expires_at" TIMESTAMP(3),
    "login_otp_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_security_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "login_security_user_id_key" ON "public"."login_security"("user_id");

-- CreateIndex
CREATE INDEX "login_security_user_id_idx" ON "public"."login_security"("user_id");

-- AddForeignKey
ALTER TABLE "public"."login_security" ADD CONSTRAINT "login_security_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
