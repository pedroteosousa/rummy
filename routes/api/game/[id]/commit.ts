import { Handlers } from "$fresh/server.ts";
import { isValidTable } from "../../../../lib/helper.ts";
import { supabase } from "../../../../lib/supabaseAdmin.ts"
import { Tile } from "../../../../lib/types.ts";

interface CommitArgs {
  gameId: string
  hand: Tile[]
  table: Tile[]
}

export const handler: Handlers = {
  async POST(req) {
    const body = await req.json() as CommitArgs;

    if (!isValidTable(body.table)) {
      return new Response("", {
          headers: { "Content-Type": "application/json" },
          status: 400,
      });
    }

    const { data, error } = await supabase.from("game_history").insert({
      game_id: body.gameId,
      table: JSON.stringify(body.table),
    })

    return new Response("", {
        headers: { "Content-Type": "application/json" },
        status: 200,
    });
  },
};