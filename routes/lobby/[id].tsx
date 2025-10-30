import { PageProps } from "$fresh/server.ts";
import LobbyPage from "../../islands/lobby/LobbyPage.tsx";

export default function Lobby(props: PageProps) {
    return (
        <div>
            <LobbyPage id={props.params.id} />
        </div>
    )
}