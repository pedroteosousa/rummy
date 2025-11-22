import { useEffect, useState, useRef } from "preact/hooks";
import { Tile } from "../lib/types.ts";
import { getCurrentTable, getHand, subscribeToGameTable } from "../lib/supabase/supabase.ts"
import { supabase } from "../lib/supabase/supabaseClient.ts";
import { tileFromId } from "../lib/helper.ts";

type AreaType = 'hand' | 'table'

interface PendingUpdate {
    id: string
    table: Tile[]
}

export default function useGame(id: string) {
    const [tiles, setTiles] = useState<Record<AreaType, Tile[]>>({
        'hand': [],
        'table': [],
    })
    const pendingUpdates = useRef<PendingUpdate[]>([])
    const addPendingUpdate = (update: PendingUpdate) => {
        pendingUpdates.current = [...pendingUpdates.current, update];
    };

    useEffect(() => {
        getHand(supabase, id).then(data => setTiles((tiles) => ({
            ...tiles,
            'hand': data.map((id, index) => {
                const tile = tileFromId(id)
                tile.position.x = index % 10
                tile.position.y = Math.floor(index / 10)
                return tile
            }),
        })))
        getCurrentTable(supabase, id).then(table => setTiles((tiles) => ({
            ...tiles,
            table,
        })))
        subscribeToGameTable(supabase, id, (table: Tile[], updateId: string) => {
            const isExpectedUpdateId = pendingUpdates.current.find(update => update.id == updateId)
            if (isExpectedUpdateId) return
            setTiles((tiles) => ({
                ...tiles,
                table,
            }))
        })
    }, [id])

    const updateHand = (hand: Tile[]) => {
        setTiles((tiles) => ({
            ...tiles,
            hand,
        }))
    }

    const updateTable = async (table: Tile[]) => {
        const updateId = crypto.randomUUID()
        addPendingUpdate({
            id: updateId,
            table,
        })
        setTiles((tiles) => ({
            ...tiles,
            table,
        }))
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        fetch(`/api/game/${id}/update_table`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                gameId: id,
                updateId,
                table,
            }),
        })
    }

    const commitTable = async (table: Tile[]) => {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        fetch(`/api/game/${id}/commit`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                gameId: id,
                table,
            }),
        })
    }

    const drawTile = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        fetch(`/api/game/${id}/draw`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                gameId: id,
            }),
        })
    }

    return {
        tiles,
        updateHand,
        updateTable,
        commitTable,
        drawTile,
    }
}