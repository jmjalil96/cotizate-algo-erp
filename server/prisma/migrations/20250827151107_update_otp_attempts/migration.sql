/*
  Warnings:

  - Added the required column `updated_at` to the `otp_attempts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."email_verification_tokens" ALTER COLUMN "expires_at" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours');

-- AlterTable
ALTER TABLE "public"."otp_attempts" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "attempt_count" SET DEFAULT 0;
