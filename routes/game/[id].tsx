import { PageProps } from "$fresh/server.ts";
import Board from "../../islands/Board.tsx";

export default function GameBoard(props: PageProps) {
    return (
        <div>
            <Board gameId={props.params.id} />
        </div>
    )
}