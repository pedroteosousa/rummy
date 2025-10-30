import { Lobby } from "../../utils/types.ts";

export interface Props {
    lobby: Lobby
    onClick: () => void
}

export default function LobbyCard({ lobby, onClick }: Props) {
    return (
        <div onClick={(_e) => onClick()}>
            {lobby.id}
        </div>
    )
}