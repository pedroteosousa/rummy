import { Tile, Color } from "./types.ts";

export function tileFromId(id: string): Tile {
    if (id[0] == 'J') {
        return {
            id,
            isJoker: true,
            position: {
                x: 0, y: 0,
            }
        }
    }
    const colorMap: Record<string, Color> = {
        'Y': Color.Yellow,
        'R': Color.Red,
        'B': Color.Blue,
        'K': Color.Black,
    }
    const color = colorMap[id[0]]
    const value = parseInt(id.slice(1, id.indexOf('-')))
    return {
        id,
        color,
        value,
        position: {
            x: 0, y: 0,
        }
    }
}