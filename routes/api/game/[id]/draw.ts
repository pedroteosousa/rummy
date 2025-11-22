import { Handlers } from "$fresh/server.ts";
import { isValidTable } from "../../../../lib/helper.ts";
import { supabase } from "../../../../lib/supabase/supabaseAdmin.ts"
import { Tile, Context } from "../../../../lib/types.ts";
import { Json } from "../../../../lib/supabase/database.types.ts";
import { getCurrentTurn, isPlayersTurn } from "../../../../lib/supabase/supabase.ts";
import { forbidden, internalError, ok, unauthorized } from "../../../../lib/http.ts";

interface DrawArgs {
  gameId: string
}

export const handler: Handlers = {
  async POST(req, ctx: Context) {
    if (!ctx.state.user) return unauthorized()

    const body = await req.json() as DrawArgs

    const turn = await getCurrentTurn(supabase, body.gameId)
    if (!isPlayersTurn(supabase, body.gameId, ctx.state.user.id, turn)) unauthorized()

    const { data, error: fetchError } = await supabase.from("game_history").select("game_id, turn, table").eq("turn", turn - 1).eq("game_id", body.gameId).maybeSingle()
    if (fetchError) return internalError()

    const { data: _, error } = await supabase.from("game_history").upsert({
      game_id: body.gameId,
      turn,
      table: data?.table ?? [],
      ongoing: false,
    })
    
    if (error) return internalError()

    const { data: deckData, error: deckError } = await supabase.from("game_deck").select("game_id, deck, remaining").eq("game_id", body.gameId).single()
    if (deckError) return internalError()

    const deck = deckData!.deck as string[]
    const remaining = deckData!.remaining!
    const nextTile = deck[deck.length - deckData!.remaining!]

    const { data: __, error: updateDeckError } = await supabase.from("game_deck").update({
      remaining: remaining - 1,
    }).eq("game_id", body.gameId)
    if (updateDeckError) return internalError()

    const { data: handData, error: handError } = await supabase.from("game_users").select("user_id, game_id, hand").eq("user_id", ctx.state.user.id).eq("game_id", body.gameId).single()
    if (handError) return internalError()

    const hand = handData?.hand as string[]
    hand.push(nextTile)

    const { data: ___, error: updateHandError } = await supabase.from("game_users").update({
      hand,
    }).eq("user_id", ctx.state.user.id).eq("game_id", body.gameId)
    if (updateHandError) return internalError()
    
    return ok()
  },
};