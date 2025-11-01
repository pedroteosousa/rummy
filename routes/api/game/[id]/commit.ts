import { Handlers } from "$fresh/server.ts";
import { supabase } from "../../../../lib/supabaseAdmin.ts"

export const handler: Handlers = {
  async POST(req) {
    const body = await req.json();

    console.log(body)

    return new Response("", {
        headers: { "Content-Type": "application/json" },
        status: 200,
    });
  },
};