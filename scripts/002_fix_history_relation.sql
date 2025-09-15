-- Fix the buyer_history relation to point to buyers table instead of users table
ALTER TABLE "buyer_history" DROP CONSTRAINT "buyer_history_buyerId_fkey";

ALTER TABLE "buyer_history" ADD CONSTRAINT "buyer_history_buyerId_fkey" 
FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
