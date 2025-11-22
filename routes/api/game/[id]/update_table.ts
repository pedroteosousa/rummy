import { Handlers } from "$fresh/server.ts";
import { supabase } from "../../../../lib/supabase/supabaseAdmin.ts"
import { Tile, Context } from "../../../../lib/types.ts";
import { Json } from "../../../../lib/supabase/database.types.ts";
import { getCurrentTurn, isPlayersTurn } from "../../../../lib/supabase/supabase.ts";
import { internalError, ok, unauthorized } from "../../../../lib/http.ts";

interface UpdateTableArgs {
  gameId: string
  updateId: string
  table: Tile[]
}

export const handler: Handlers = {
  async POST(req, ctx: Context) {
    if (!ctx.state.user) return unauthorized()
    const body = await req.json() as UpdateTableArgs;

    const turn = await getCurrentTurn(supabase, body.gameId)
    if (!await isPlayersTurn(supabase, body.gameId, ctx.state.user.id, turn)) return unauthorized()

    const { data: _, error } = await supabase.from('game_history').upsert({
      game_id: body.gameId,
      turn,
      table: body.table as unknown as Json[],
      update_id: body.updateId,
    })
    
    if (error) return internalError() 

    return ok()
  },
};