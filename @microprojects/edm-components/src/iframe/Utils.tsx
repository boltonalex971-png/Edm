import React, {ReactNode} from 'react'

export function Loading() {
    return (
        <div style={{ width: '100%', textAlign: 'center' }} className='small'>
            Loading...
        </div>
    )
}

interface ILoadingContainerProps {
    loading: boolean
    children: ReactNode
}

export function LoadingContainer({ loading, children }: ILoadingContainerProps) {
    return (
        <div style={{ position: 'relative' }}>
            {children}
            {loading && (
                <div
                    className='small'
                    style={{
                        width: '100%',
                        textAlign: 'center',
                        opacity: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0
                    }}
                >
                    Loading...
                </div>
            )}
        </div>
    )
}

interface IDetailStubProps {
    message: string
}

export function DetailStub({ message }: IDetailStubProps) {
    return <div style={{ width: '100%', textAlign: 'center' }}>{message}</div>
}

export function dateToSpan(dateToConvert: Date) {
    const dividerToSeconds = 1000
    const now = new Date()
    const date = new Date(dateToConvert)
    const span = Math.abs(+now - +date)
    var days = Math.floor(span / dividerToSeconds / 60 / 60 / 24)
    var hours = Math.floor((span / dividerToSeconds / 60 / 60) % 24)
    var minutes = Math.floor((span / dividerToSeconds / 60) % 60)
    var seconds = Math.floor((span / dividerToSeconds) % 60)
    var sDays = days ? days + 'd ' : ''
    var sHours = hours || (days && (minutes || seconds)) ? hours + 'h ' : ''
    var sMinutes = minutes || ((days || hours) && seconds) ? minutes + 'm ' : ''
    var sSeconds = seconds ? seconds + 's' : ''

    return sDays + sHours + sMinutes + sSeconds
}

export function dateToHumanSpan(dateToConvert: Date) {
    const dividerToSeconds = 1000
    const now = new Date()
    const date = new Date(dateToConvert)
    const span = Math.abs(+now - +date)
    const days = Math.floor(span / dividerToSeconds / 60 / 60 / 24)
    const hours = Math.floor((span / dividerToSeconds / 60 / 60) % 24)
    const minutes = Math.floor((span / dividerToSeconds / 60) % 60)
    const seconds = Math.floor((span / dividerToSeconds) % 60)
    const result =
        (days && (days === 1 ? 'yesterday' : `${days} days`)) ||
        (hours && (hours === 1 ? 'an hour' : `${hours} hours`)) ||
        (minutes && (minutes === 1 ? 'a minute' : `${minutes} minutes`)) ||
        (seconds && (seconds === 1 ? 'a second' : `${seconds} seconds`))

    return result
}
