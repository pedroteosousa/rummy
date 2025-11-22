import { useEffect, useState } from "preact/hooks";
import { supabase } from '../../lib/supabase/supabaseClient.ts'
import { getLobbies, createLobby, joinLobby } from '../../lib/supabase/supabase.ts'
import { Lobby } from "../../lib/types.ts";
import LobbyCard from "./LobbyCard.tsx";
import Button from "../Button.tsx";

export default function Lobbies() {
    const [lobbies, setLobbies] = useState<Lobby[]>([])

    useEffect(() => {
        getLobbies(supabase).then(data => setLobbies(data)).catch(error => console.log(error))
    }, [])

    function createAndOpenLobby() {
        createLobby(supabase).then(id => globalThis.window.location.href = `/lobby/${id}`).catch(error => console.log(error))
    }

    return (
        <div>
            <h1>Lobbies</h1>
            { lobbies.map(lobby => (<LobbyCard lobby={lobby} onClick={() => joinLobby(supabase, lobby.id).finally(() => globalThis.window.location.href = `/lobby/${lobby.id}`)} />)) }
            <Button text="Create new lobby" onClick={createAndOpenLobby} />
        </div>
    )
}