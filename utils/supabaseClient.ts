import { createClient } from "npm:@supabase/supabase-js@2.77.0";
import { Database } from "./supabase.ts"
import { GameOptions, Lobby } from "./types.ts";

export const supabase = createClient<Database, 'public'>(
    "https://wjcnjnbthpztvleparzu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqY25qbmJ0aHB6dHZsZXBhcnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTEwNjgsImV4cCI6MjA3NTUyNzA2OH0.tVOBEVnoVTDRouvBdUmNsQylMz8ahIVc90e08wknU6o",
);

export async function getLobbies(): Promise<Lobby[]> {
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

export async function getLobby(id: string): Promise<Lobby> {
    const { data, error } = await supabase.from('lobbies').select('id, active, active_game_id, game_options, users: lobby_users(id: user_id, is_host, info: users(username))').eq('id', id).single()
    console.log(data, error)
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

export async function joinLobby(id: string) {
    const user_id = (await supabase.auth.getUser()).data.user?.id
    const { data: _, error } = await supabase.from('lobby_users').insert({
        user_id,
        lobby_id: id,
        is_host: false,
    })
    if (error) throw error
}

export async function createLobby() {
    const user_id = (await supabase.auth.getUser()).data.user?.id
    if (!user_id) throw new Error("anon key cannot create lobbies")
    const { data, error } = await supabase.rpc("create_lobby_with_host", {
        host_user_id: user_id,
    })
    if (error) throw error
    return data
}

export async function startGame(lobbyId: string) {
    const { data, error } = await supabase.rpc("start_game", {
        lobby_id_input: lobbyId,
    })
    if (error) throw error
    return data
}

export async function getHand(gameId: string): Promise<string[]> {
    const user_id = (await supabase.auth.getUser()).data.user?.id
    if (!user_id) throw new Error("anon key doesn't have a game hand")
    const { data, error } = await supabase.from('game_users').select('*').eq('game_id', gameId).eq('user_id', user_id).single()
    if (error) throw error;
    return data.hand as string[]
}