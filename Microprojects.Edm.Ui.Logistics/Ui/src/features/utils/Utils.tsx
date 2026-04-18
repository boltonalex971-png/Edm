import { Loader } from '@progress/kendo-react-indicators'
import type React from 'react'

export function Loading() {
    return (
        <div style={{ width: '100%', textAlign: 'center' }} className="small">
            <Loader type="converging-spinner" />
        </div>
    )
}

type LoadingContainerProps = {
    loading: boolean
    children: React.ReactElement
}

export function LoadingContainer({ loading, children }: LoadingContainerProps) {
    return (
        <div style={{ position: 'relative' }}>
            {children}
            {loading && (
                <div
                    className="small"
                    style={{
                        width: '100%',
                        textAlign: 'center',
                        opacity: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                    }}
                >
                    <Loader type="converging-spinner" />
                </div>
            )}
        </div>
    )
}

type DetailStubProps = {
    message: string
}

export function DetailStub({ message }: DetailStubProps) {
    return <div style={{ width: '100%', textAlign: 'center' }}>{message}</div>
}

export function dateToSpan(dateToConvert: any) {
    const dividerToSeconds = 1000
    const now = new Date()
    const date = new Date(dateToConvert)
    const span = Math.abs(now.getMilliseconds() - date.getMilliseconds())
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

export function dateToHumanSpan(dateToConvert: any) {
    const dividerToSeconds = 1000
    const now = new Date()
    const date = new Date(dateToConvert)
    const span = Math.abs(now.getMilliseconds() - date.getMilliseconds())
    const days = Math.floor(span / dividerToSeconds / 60 / 60 / 24)
    const hours = Math.floor((span / dividerToSeconds / 60 / 60) % 24)
    const minutes = Math.floor((span / dividerToSeconds / 60) % 60)
    const seconds = Math.floor((span / dividerToSeconds) % 60)
    const result =
        (days && (days == 1 ? 'yesterday' : `${days} days`)) ||
        (hours && (hours == 1 ? 'an hour' : `${hours} hours`)) ||
        (minutes && (minutes == 1 ? 'a minute' : `${minutes} minutes`)) ||
        (seconds && (seconds == 1 ? 'a second' : `${seconds} seconds`)) ||
        'just now'

    return result
}
