import { PageProps } from "$fresh/server.ts";
import GamePage from "../../islands/GamePage.tsx";

export default function GameBoard(props: PageProps) {
    return (
        <GamePage id={props.params.id} />
    )
}