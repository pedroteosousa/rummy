export interface Props {
    text: string
    onClick: () => void
}

export default function Button({ text, onClick }: Props) {
    return (
        <button onClick={(_e) => onClick()}>
            {text}
        </button>
    )
}