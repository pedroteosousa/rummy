import Board from "./Board.tsx";

interface Props {
    id: string
}

export default function GamePage({ id }: Props) {
    return (
        <Board gameId={id} />
    )
}