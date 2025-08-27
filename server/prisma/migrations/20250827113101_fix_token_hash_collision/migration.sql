-- Drop the old unique index on token_hash only (if it exists)
DROP INDEX IF EXISTS "email_verification_tokens_token_hash_key";

-- Drop existing compound constraint if it exists (from manual attempt)
ALTER TABLE "email_verification_tokens" 
DROP CONSTRAINT IF EXISTS "email_verification_tokens_user_id_token_hash_key";

-- Add compound unique constraint on (user_id, token_hash)
-- This prevents collision when different users get the same OTP
ALTER TABLE "email_verification_tokens" 
ADD CONSTRAINT "email_verification_tokens_user_id_token_hash_key" 
UNIQUE ("user_id", "token_hash");