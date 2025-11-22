import { SupabaseClient } from "npm:@supabase/supabase-js@2.77.0";
import { Database } from "./database.types.ts";
import { GameOptions, Lobby, Tile } from "../types.ts";

export async function getLobbies(supabase: SupabaseClient<Database>): Promise<Lobby[]> {
    const { data, error } = await supabase.from('lobbies').select('id, active, active_game_id, game_options, users: lobby_users(id: user_id, is_host, info: users(username))')
    if (error) throw error
    return data.map((lobby): Lobby => (
        {
            id: lobby.id,
            active: lobby.active ?? false,
            activeGameId: lobby.active_game_id ?? null,
            options: lobby.game_options as unknown as GameOptions,
            players: lobby.users.map((userData) => (
                {
                    id: userData.id,
                    username: userData.info.username ?? "",
                    isHost: userData.is_host ?? false,
                }
            ))
        }
    ))
}

export async function getLobby(supabase: SupabaseClient<Database>, id: string): Promise<Lobby> {
    const { data, error } = await supabase.from('lobbies').select('id, active, active_game_id, game_options, users: lobby_users(id: user_id, is_host, info: users(username))').eq('id', id).single()
    if (error) throw error
    return {
        id: data.id,
        active: data.active ?? false,
        activeGameId: data.active_game_id ?? null,
        options: data.game_options as unknown as GameOptions,
        players: data.users.map((userData) => (
            {
                id: userData.id,
                username: userData.info.username ?? "",
                isHost: userData.is_host ?? false,
            }
        ))
    }
}

export async function joinLobby(supabase: SupabaseClient<Database>, id: string) {
    const user_id = (await supabase.auth.getUser()).data.user?.id
    const { data: _, error } = await supabase.from('lobby_users').insert({
        user_id,
        lobby_id: id,
        is_host: false,
    })
    if (error) throw error
}

export async function createLobby(supabase: SupabaseClient<Database>) {
    const user_id = (await supabase.auth.getUser()).data.user?.id
    if (!user_id) throw new Error("anon key cannot create lobbies")
    const { data, error } = await supabase.rpc("create_lobby_with_host", {
        host_user_id: user_id,
    })
    if (error) throw error
    return data
}

export async function startGame(supabase: SupabaseClient<Database>, lobbyId: string) {
    const { data, error } = await supabase.rpc("start_game", {
        lobby_id_input: lobbyId,
    })
    if (error) throw error
    return data
}

export async function getHand(supabase: SupabaseClient<Database>, gameId: string): Promise<string[]> {
    const user_id = (await supabase.auth.getUser()).data.user?.id
    if (!user_id) throw new Error("anon key doesn't have a game hand")
    const { data, error } = await supabase.from('game_users').select('*').eq('game_id', gameId).eq('user_id', user_id).single()
    if (error) throw error;
    const table = await getCurrentTable(supabase, gameId)
    const tablePieceIds = table.map(tile => tile.id)
    return (data.hand as string[]).filter(tileId => !tablePieceIds.includes(tileId))
}
export async function getCurrentTurn(supabase: SupabaseClient<Database>, gameId: string) {
    const { data, error } = await supabase
        .from('game_history')
        .select("turn, ongoing")
        .eq("game_id", gameId)
        .order("turn", { ascending: false })
        .limit(1)
        .maybeSingle()
    if (error) throw error;
    return data?.ongoing ? data.turn : (data?.turn ?? -1) + 1
}

export async function getCurrentTable(supabase: SupabaseClient<Database>, gameId: string) {
    const { data, error } = await supabase
        .from('game_history')
        .select("table")
        .eq("game_id", gameId)
        .order("turn", { ascending: false })
        .limit(1)
        .maybeSingle()
    if (error) throw error;
    return data?.table as unknown as Tile[] ?? []
}

export function subscribeToGameTable(supabase: SupabaseClient<Database>, gameId: string, updateTable: (table: Tile[], updateId: string) => void) {
    supabase
        .channel(`game_history:${gameId}`)
        .on<{ table: Tile[], update_id: string }>(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "game_history",
              filter: `game_id=eq.${gameId}`,
            },
            (payload) => {
                updateTable(payload.new.table, payload.new.update_id)
            }
          )
          .subscribe();
}

export async function isPlayersTurn(supabase: SupabaseClient<Database>, gameId: string, userId: string, turn: number) {
    const { data, error } = await supabase.from('game_users').select('user_id, index').eq('game_id', gameId)
    if (error) throw error;
    if (!data) throw new Error("could not find game information")
    return userId == data.find(playerData => playerData.index == (turn % data.length))?.user_id
}