interface Indicator {
    order: number
    indicator: string
    parameter: string
    title: string
}

interface Sensor extends Record<string, number | string | {value: string, valid: boolean}> {
}
