interface GreetingProps {
    userName: string
}

export function Greeting({ userName }: GreetingProps) {
    return (
        <p className="greeting">
            Welcome{userName ? `, ${userName}` : ''}.
        </p>
    )
}
