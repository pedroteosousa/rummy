import { useEffect, useRef, useState } from "preact/hooks";
import { Position, Tile, Game, Color } from "../utils/types.ts";
import { getHand } from "../utils/supabaseClient.ts";
import { tileFromId } from "../utils/helper.ts";

interface GridSize {
    rows: number
    columns: number
    offset: Position
}

interface Area {
    size: {
        width: number
        height: number
    }
    location: Position
}

function calculateGridSize(tiles: Tile[]): GridSize {
    if (tiles.length == 0) return { rows: 3, columns: 3, offset: { x: 0, y: 0 } }
    let minX = tiles[0].position!.x, maxX = tiles[0].position!.x, minY = tiles[0].position!.y, maxY = tiles[0].position!.y;
    tiles.forEach((tile) => {
        minX = Math.min(tile.position!.x, minX) 
        maxX = Math.max(tile.position!.x, maxX) 
        minY = Math.min(tile.position!.y, minY) 
        maxY = Math.max(tile.position!.y, maxY) 
    })
    return {
        rows: maxY - minY + 3,
        columns: maxX - minX + 3,
        offset: {
            x: minX - 1,
            y: minY - 1,
        }
    }
}

export interface Props {
    gameId: string
}

export default function Board({ gameId }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isTileMoving, setIsTileMoving] = useState<Map<string, boolean>>(new Map())
    const [tiles, setTiles] = useState<Tile[]>([])
    const [gridSize, setGridSize] = useState<GridSize>({ rows: 0, columns: 0, offset: { x: 0, y: 0 }})
    const [cellSize, setCellSize] = useState<number>(0)
    const [hand, setHand] = useState<Tile[]>([])
    const [handArea, setHandArea] = useState<Area>({ size: { width: 0, height: 0 }, location: { x: 0, y: 0 }})
    const [handCellSize, setHandCellSize] = useState<number>(0)

    useEffect(() => {
        getHand(gameId).then(data => setHand(data.map((id, index) => {
            const tile = tileFromId(id)
            tile.position!.x = index % 10
            tile.position!.y = Math.floor(index / 10)
            return tile
        })))
    }, [])

    useEffect(() => {
        setGridSize(calculateGridSize(tiles))
    }, [tiles])

    useEffect(() => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        setHandArea({
            size: {
                width: canvas.width,
                height: 2 * handCellSize,
            },
            location: {
                x: 0,
                y: canvas.height - 2 * handCellSize,
            }
        })
    }, [handCellSize])


    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        let dragging: Tile | null = null;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            setCellSize(Math.min(canvas.width / (gridSize?.columns ?? 1), canvas.height / (gridSize?.rows ?? 1)))
            setHandCellSize(Math.min(canvas.width / 10, canvas.height / 2))
            draw();
        };

        function reposition(tiles: Tile[], newTile: Tile) {
            const blockingTile = tiles.find((tile) => {
                return tile.position!.x == newTile.position!.x && tile.position!.y == newTile.position!.y && !isTileMoving.get(tile.id)
            }) ?? null
            isTileMoving.set(newTile.id, false);
            setIsTileMoving(isTileMoving)
            if (blockingTile) {
                blockingTile.position!.x += 1;
                isTileMoving.set(blockingTile.id, true);
                setIsTileMoving(isTileMoving)
                reposition(tiles, blockingTile)
            }
            setTiles([...tiles])
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

        function drawHand() {
            ctx.fillStyle = '#222'
            ctx.fillRect(handArea.location.x, handArea.location.y, handArea.size.width, handArea.size.height)
            for (const tile of hand) {
                const x = tile.position!.x * handCellSize + handArea.location.x;
                const y = tile.position!.y * handCellSize + handArea.location.y;
                drawTile(ctx, tile, x, y, handCellSize)
            }
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

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawHand()
            for (const tile of tiles) {
                const x = tile.position!.x - gridSize.offset.x;
                const y = tile.position!.y - gridSize.offset.y;
                drawTile(ctx, tile, x * cellSize, y * cellSize, cellSize)
            }
        };

        const onMouseDown = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / cellSize) + gridSize.offset.x;
            const y = Math.floor((e.clientY - rect.top) / cellSize) + gridSize.offset.y;
            dragging = tiles.find(
                (t) => x == t.position!.x && y == t.position!.y
            ) ?? null;
            if (dragging) {
                isTileMoving.set(dragging.id, true);
                setIsTileMoving(isTileMoving)
            }
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!dragging) return;
            const rect = canvas.getBoundingClientRect();
            dragging.position!.x = ((e.clientX - rect.left) / cellSize) - 0.5 + gridSize.offset.x;
            dragging.position!.y = ((e.clientY - rect.top) / cellSize) - 0.5 + gridSize.offset.y;
            draw();
        };

        const onMouseUp = (e: MouseEvent) => {
            if (!dragging) return;
            const rect = canvas.getBoundingClientRect();
            dragging.position!.x = Math.floor((e.clientX - rect.left) / cellSize) + gridSize.offset.x;
            dragging.position!.y = Math.floor((e.clientY - rect.top) / cellSize) + gridSize.offset.y;
            reposition(tiles, dragging);
            dragging = null;
            draw();
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
    }, [hand, tiles, gridSize, cellSize]);

    return (
        <canvas
            ref={canvasRef}
            style={{ border: "1px solid #ccc", width: "100vw", height: "100vh", backgroundColor: "#0B6623" }}
        />
    )
}