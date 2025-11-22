import { createClient } from "npm:@supabase/supabase-js@2.77.0";
import { Database } from "./database.types.ts"

export const supabase = createClient<Database, 'public'>(
    "https://wjcnjnbthpztvleparzu.supabase.co",
    Deno.env.get("SUPABASE_SECRET")!,
);