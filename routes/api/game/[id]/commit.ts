import { Handlers } from "$fresh/server.ts";
import { isValidTable, difference } from "../../../../lib/helper.ts";
import { supabase } from "../../../../lib/supabase/supabaseAdmin.ts"
import { Tile, Context } from "../../../../lib/types.ts";
import { Json } from "../../../../lib/supabase/database.types.ts";
import { getCurrentTurn, isPlayersTurn } from "../../../../lib/supabase/supabase.ts";
import { forbidden, internalError, ok, unauthorized } from "../../../../lib/http.ts";

interface CommitArgs {
  gameId: string
  table: Tile[]
}

export const handler: Handlers = {
  async POST(req, ctx: Context) {
    if (!ctx.state.user) return unauthorized()

    const body = await req.json() as CommitArgs

    if (!isValidTable(body.table)) return forbidden()

    const turn = await getCurrentTurn(supabase, body.gameId)
    if (!isPlayersTurn(supabase, body.gameId, ctx.state.user.id, turn)) return unauthorized()

    const { data: handData, error: handError } = await supabase.from("game_users").select("user_id, game_id, hand").eq("user_id", ctx.state.user.id).eq("game_id", body.gameId).single()
    if (handError) return internalError()

    const hand = handData?.hand as string[]

    const { data: oldTableData, error: oldTableError } = await supabase.from("game_history").select("game_id, turn, table").eq("game_id", body.gameId).eq("turn", turn - 1).maybeSingle()
    if (oldTableError) return internalError()

    const oldTable = ((oldTableData?.table as unknown as Tile[]) ?? []).map(tile => tile.id)
    const newTable = body.table.map(tile => tile.id)

    const { BmA: TmoT } = difference(oldTable, newTable)
    const { AmB: HmT, BmA: TmH } = difference(hand, TmoT)

    // tile was added to the table which was not in players hand
    if (TmH.length !== 0) return forbidden()

    const { data: _, error } = await supabase.from("game_history").upsert({
      game_id: body.gameId,
      turn,
      table: body.table as unknown as Json[],
      ongoing: false,
    })
    
    if (error) return internalError()

    return ok()
  },
};