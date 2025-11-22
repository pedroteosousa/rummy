import { User as SupabaseUser } from "npm:@supabase/supabase-js@2.77.0";
import { FreshContext } from "$fresh/server.ts"

export interface User {
    id: string
    username: string
    isOnline?: boolean
}

export interface Lobby {
    id: string
    active: boolean
    activeGameId: string | null
    options: GameOptions
    players: {
        id: string
        username: string
        isHost: boolean
    }[]
}

export enum Color {
    Yellow,
    Black,
    Blue,
    Red,
}

export interface Player {
    username: string
    hand: Tile[]
}

export interface Tile {
    id: string
    position: Position
    value?: number
    color?: Color
    isJoker?: boolean
}

export interface Position {
    x: number
    y: number
}

export interface Move {
    table: Tile[]
}

export interface Draw {
    tile: Tile
}

type ActionType = 'move' | 'draw'

export type Action = Draw | Move

export interface Turn {
    player: Player
    action: Action[]
}

export interface Game {
    id: string
    players: Player[]
    currentTurn: number
    turns: Turn[]
    table: Tile[]
    tilesRemaining: number
    options: GameOptions
}

export interface GameOptions {
    timerOptions?: TurnTimerOptions
    initialPointRequirement?: number
    initialMeldCanIncludeTableTiles?: boolean
}

export interface TurnTimerOptions {
    // represents time per turn, unless if increment is defined, then it represents initial time
    time: number
    increment?: number
}

export type Context = {
    state: {
        user?: SupabaseUser
    }
} & FreshContext