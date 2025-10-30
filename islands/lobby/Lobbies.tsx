import { useEffect, useState } from "preact/hooks";
import { getLobbies, createLobby, joinLobby } from '../../utils/supabaseClient.ts'
import { Lobby } from "../../utils/types.ts";
import LobbyCard from "./LobbyCard.tsx";
import Button from "../Button.tsx";

export default function Lobbies() {
    const [lobbies, setLobbies] = useState<Lobby[]>([])

    useEffect(() => {
        getLobbies().then(data => setLobbies(data)).catch(error => console.log(error))
    }, [])

    function createAndOpenLobby() {
        createLobby().then(id => globalThis.window.location.href = `/lobby/${id}`).catch(error => console.log(error))
    }

    return (
        <div>
            <h1>Lobbies</h1>
            { lobbies.map(lobby => (<LobbyCard lobby={lobby} onClick={() => joinLobby(lobby.id).finally(() => globalThis.window.location.href = `/lobby/${lobby.id}`)} />)) }
            <Button text="Create new lobby" onClick={createAndOpenLobby} />
        </div>
    )
}