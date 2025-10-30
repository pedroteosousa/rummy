import { useEffect, useState } from "preact/hooks"
import { getLobby, startGame } from "../../utils/supabaseClient.ts";
import { Lobby } from "../../utils/types.ts";
import Button from "../Button.tsx";

export interface Props {
    id: string
}

export default function LobbyPage({ id }: Props) {
    const [lobby, setLobby] = useState<Lobby | null>(null)
    useEffect(() => {
        getLobby(id).then(data => setLobby(data)).catch(error => console.log(error))
    }, [id])

    useEffect(() => {
        if (lobby?.activeGameId) globalThis.window.location.href = `/game/${lobby.activeGameId}`
    }, [lobby])

    return (
        <div>
            <div>
                { lobby?.players.map(player => (<PlayerCard id={player.id} username={player.username} isHost={player.isHost} />)) }
            </div>
            <Button text="Start Game" onClick={() => startGame(id).then((gameId) => globalThis.window.location.href = `/game/${gameId}`)}/>
        </div>
    )
}

interface PlayerCardProps {
    id: string
    username: string
    isHost: boolean
}

function PlayerCard({ id, username, isHost }: PlayerCardProps) {
    return (
        <div>
            { id }
            { username }
            { isHost }
        </div>
    )
}