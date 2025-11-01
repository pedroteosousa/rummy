import { useEffect, useRef, useState } from "preact/hooks";
import { Position, Tile, Color } from "../lib/types.ts";
import { getHand } from "../lib/supabaseClient.ts";
import { tileFromId } from "../lib/helper.ts";

interface GridShape {
    rows: number
    columns: number
}

type AreaType = 'hand' | 'table'

interface Area {
    type: AreaType
    size: {
        width: number
        height: number
    }
    location: Position
    grid: GridShape
}

interface GridPosition {
    position: Position
    areaType: AreaType
}

export interface Props {
    gameId: string
}

export default function Board({ gameId }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [tiles, setTiles] = useState<Record<AreaType, Tile[]>>({
        'hand': [],
        'table': [],
    })
    const [dragging, setDragging] = useState<Tile>()
    const [draggingPosition, setDraggingPosition] = useState<Position>()

    useEffect(() => {
        getHand(gameId).then(data => setTiles((tiles) => ({
            ...tiles,
            'hand': data.map((id, index) => {
                const tile = tileFromId(id)
                tile.position!.x = index % 10
                tile.position!.y = Math.floor(index / 10)
                return tile
            }),
        })))
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current!;

        const areas = getAreas(canvas, tiles)

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };

        const onMouseDown = (e: MouseEvent) => {
            const gridPosition = getGridPosition(e.clientX, e.clientY, areas)
            if (!gridPosition) return
            const targetTile = getTileFromGridPosition(gridPosition, tiles)
            if (!targetTile) return
            setDragging(targetTile)
            setTiles((tiles) => ({
                'hand': tiles.hand.filter(tile => tile.id != targetTile.id),
                'table': tiles.table.filter(tile => tile.id != targetTile.id)
            }))
            setDraggingPosition({
                x: e.clientX,
                y: e.clientY,
            })
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!dragging) return;
            setDraggingPosition({
                x: e.clientX,
                y: e.clientY,
            })
        };

        const onMouseUp = (e: MouseEvent) => {
            if (!dragging) return;
            const gridPosition = getGridPosition(e.clientX, e.clientY, areas)
            if (!gridPosition) return
            setTiles((tiles) => ({
                ...tiles,
                [gridPosition.areaType]: [...tiles[gridPosition.areaType], {
                    ...dragging,
                    position: gridPosition.position,
                }]
            }))
            setDragging(undefined)
        };

        window.addEventListener("resize", resize);
        canvas.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);

        resize();

        return () => {
            window.removeEventListener("resize", resize);
            canvas.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, [tiles, dragging]);

    useEffect(() => {
        fetch(`/api/game/${gameId}/commit`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tiles),
        })
    }, [tiles, gameId])

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        const areas = getAreas(canvas, tiles)

        function drawHand() {
            const cellSize = getCellSize(areas.hand)
            ctx.fillStyle = '#222'
            ctx.fillRect(areas.hand.location.x, areas.hand.location.y, areas.hand.size.width, areas.hand.size.height)
            for (const tile of tiles.hand) {
                const x = tile.position!.x * cellSize + areas.hand.location.x;
                const y = tile.position!.y * cellSize + areas.hand.location.y;
                drawTile(ctx, tile, x, y, cellSize)
            }
        }

        function drawTable() {
            const cellSize = getCellSize(areas.table)
            for (const tile of tiles.table) {
                const x = tile.position!.x;
                const y = tile.position!.y;
                drawTile(ctx, tile, x * cellSize, y * cellSize, cellSize)
            }
        }

        function drawDragging() {
            if (!dragging || !draggingPosition) return
            const area = [areas.hand, areas.table].find((area) => isInArea(draggingPosition.x, draggingPosition.y, area))
            if (!area) return
            const cellSize = getCellSize(area)
            drawTile(ctx, dragging, draggingPosition.x - cellSize / 2, draggingPosition.y - cellSize / 2, cellSize)
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawHand()
        drawTable()
        drawDragging()
    }, [tiles, dragging, draggingPosition, canvasRef.current])

    return (
        <canvas
            ref={canvasRef}
            style={{ border: "1px solid #ccc", width: "100vw", height: "100vh", backgroundColor: "#0B6623" }}
        />
    )
}

function drawTile(ctx: CanvasRenderingContext2D, tile: Tile, x: number, y: number, size: number) {
    const borderWidth = size * 0.05;
    const borderRadius = size * 0.2;
    ctx.beginPath();
    roundedSquarePath(ctx, x, y, borderRadius, size);

    ctx.fillStyle = getColor(tile);
    ctx.fill();

    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = '#000';
    ctx.stroke();

    const fontSize = size * 0.6;
    ctx.font = `900 ${fontSize}px 'Inter', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cx = x + 0.5 * size;
    const cy = y + 0.5 * size + size * 0.05;

    ctx.lineWidth = Math.max(3, Math.floor(fontSize * 0.20));
    ctx.strokeStyle = '#000';
    ctx.strokeText(getText(tile), cx, cy);

    ctx.fillStyle = '#fff';
    ctx.fillText(getText(tile), cx, cy);
}

function roundedSquarePath(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, size: number) {
    const r = Math.min(radius, size / 2, size / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + size, y, x + size, y + size, r);
    ctx.arcTo(x + size, y + size, x, y + size, r);
    ctx.arcTo(x, y + size, x, y, r);
    ctx.arcTo(x, y, x + size, y, r);
    ctx.closePath();
}

function getColor(tile: Tile): string {
    if (tile.color === Color.Red) {
        return "#e53935";
    } else if (tile.color === Color.Black) {
        return "#363635";
    } else if (tile.color === Color.Yellow) {
        return "#fffd82";
    } else if (tile.color === Color.Blue) {
        return "#3c91e6";
    }
    return "#cccccc";
}

function getText(tile: Tile): string {
    if (tile.isJoker) {
        return "J"
    }
    return String(tile.value);
}

function calculateGridShape(tiles: Tile[], minShape: GridShape = { rows: 5, columns: 10 }): GridShape {
    if (tiles.length == 0) return minShape
    let minX = tiles[0].position!.x, maxX = tiles[0].position!.x, minY = tiles[0].position!.y, maxY = tiles[0].position!.y;
    tiles.forEach((tile) => {
        minX = Math.min(tile.position!.x, minX) 
        maxX = Math.max(tile.position!.x, maxX) 
        minY = Math.min(tile.position!.y, minY) 
        maxY = Math.max(tile.position!.y, maxY) 
    })
    return {
        rows: Math.max(maxY - minY + 1, minShape.rows),
        columns: Math.max(maxX - minX + 1, minShape.columns),
    }
}

function getCellSize(area: Area): number {
    return Math.min(Math.floor(area.size.width / area.grid.columns), Math.floor(area.size.height / area.grid.rows))
}

function getTileFromGridPosition(position: GridPosition, tiles: Record<AreaType, Tile[]>) {
    const tileSet = tiles[position.areaType]
    return tileSet.find(tile => tile.position!.x == position.position.x && tile.position!.y == position.position.y)
}

function getGridPosition(x: number, y: number, areas: Record<AreaType, Area>) {
    const area = Object.values(areas).find((area) => isInArea(x, y, area))
    if (area) return getGridPositionInArea(x, y, area)
}

function getGridPositionInArea(x: number, y: number, area: Area): GridPosition {
    const cellSize = getCellSize(area)
    return {
        position: {
            x: Math.floor((x - area.location.x) / cellSize),
            y: Math.floor((y - area.location.y) / cellSize),
        },
        areaType: area.type,
    }
}

function isInArea(x: number, y: number, area: Area) {
    return x >= area.location.x && x <= area.location.x + area.size.width && y >= area.location.y && y <= area.location.y + area.size.height
}

function getAreas(canvas: HTMLCanvasElement, tiles: Record<AreaType, Tile[]>): Record<AreaType, Area> {
    const handAreaHeight = Math.min(200, canvas.height * 0.2);
    return {
        'hand': {
            type: 'hand' as AreaType,
            size: {
                width: canvas.width,
                height: handAreaHeight,
            },
            location: {
                x: 0,
                y: canvas.height - handAreaHeight,
            },
            grid: calculateGridShape(tiles.hand, { rows: 2, columns: 10 }),
        },
        'table': {
            type: 'table' as AreaType,
            size: {
                width: canvas.width,
                height: canvas.height - handAreaHeight,
            },
            location: {
                x: 0,
                y: 0,
            },
            grid: calculateGridShape(tiles.table),
        }
    }
}