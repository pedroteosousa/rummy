import { compare } from "$std/semver/compare.ts";
import { Tile, Color, Position } from "./types.ts";

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

export function isValidTable(table: Tile[]): boolean {
    if (table.length == 0) return false
    const sorted = table.sort((a, b) => comparePosition(a.position, b.position))
    let valid = true
    let tiles: Tile[] = []
    sorted.forEach(tile => {
        if (tiles.length == 0) {
            tiles.push(tile)
            return
        }
        const lastTile = tiles[tiles.length - 1]
        if (lastTile.position.y == tile.position.y && lastTile.position.x + 1 == tile.position.x) {
            tiles.push(tile)
        } else {
            valid = valid && isValidMeld(tiles)
            tiles = [tile]
        }
    })
    valid = valid && isValidMeld(tiles)
    return valid
}

function isValidMeld(tiles: Tile[]): boolean {
    return isSameValueMeld(tiles) || isSameColorMeld(tiles)
}

function isSameValueMeld(tiles: Tile[]): boolean {
    if (tiles.length < 3 || tiles.length > 4) return false
    const nonJokers = tiles.filter(tile => !tile.isJoker)
    if (!nonJokers.every(tile => tile.value == nonJokers[0].value)) return false
    const uniqueColors = [...new Set(nonJokers.map(tile => tile.color))]
    if (uniqueColors.length != nonJokers.length) return false
    return true
}

function isSameColorMeld(tiles: Tile[]): boolean {
    if (tiles.length < 3) return false
    const nonJokers = tiles.filter(tile => !tile.isJoker)
    if (!nonJokers.every(tile => tile.color == nonJokers[0].color)) return false
    let valid = true, targetValue: number | undefined
    tiles.forEach(tile => {
        if (!targetValue) {
            if (!tile.isJoker) targetValue = tile.value! + 1
            return
        }
        if (tile.isJoker || tile.value == targetValue) {
            targetValue += 1
        } else {
            valid = false
        }
    })
    return valid
}

function comparePosition(position1: Position, position2: Position): number {
    if (position1.y != position2.y) return position1.y - position2.y
    return position1.x - position2.x
}