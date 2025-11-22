import { createClient } from "npm:@supabase/supabase-js@2.77.0";
import { Database } from "./database.types.ts"

export const supabase = createClient<Database, 'public'>(
    "https://wjcnjnbthpztvleparzu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqY25qbmJ0aHB6dHZsZXBhcnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTEwNjgsImV4cCI6MjA3NTUyNzA2OH0.tVOBEVnoVTDRouvBdUmNsQylMz8ahIVc90e08wknU6o",
);