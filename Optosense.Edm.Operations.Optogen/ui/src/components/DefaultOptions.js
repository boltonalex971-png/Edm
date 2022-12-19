

export const defaultOptions = {
    panels: {
        profile: { color: 'aqua' },
        mainParams: { color: 'bisque' },
        envParams: { color: 'rgb(232, 215, 242)' },
        otherParams: { color: 'cornsilk' },
    },
    params: [
        { name: 'pressure-in-chamber', prefix: 'P =', title: 'Давление в камере', units: 'мм.рт.ст.', panel: 'mainParams' },
        { name: 'wafer-temp-in-carusel', prefix: 't =', title: 'Температура подложек\nв карусели', units: '°C', panel: 'mainParams' },
        { name: 'warm-up-time', prefix: 't =', title: 'Время прогрева\n(по достижению уставки)', units: 'с', panel: 'mainParams' },
        { name: 'room-temperature', prefix: 't =', title: 'Температура\n в помещении', units: '°C', panel: 'envParams' },
        { name: 'room-humidity', prefix: 'Rh =', title: 'Относительная влажность\n в помещении', units: '%', panel: 'envParams' },
        { name: 'hinge-weight', prefix: 'm =', title: 'Масса навески:', units: 'гр', panel: 'envParams' },
        { name: 'pressure-under-cap', prefix: 'P =', title: 'Давление в подколпачном\n пространстве', units: 'мм.рт.ст.', panel: 'otherParams' },
        { name: 'carusel-temperature', prefix: 't =', title: 'Температура карусели', units: '°C', panel: 'otherParams' },
        { name: 'evaporator-temperature', prefix: 't =', title: 'Температура испарителя:', units: '°C', panel: 'otherParams' },
        { name: 'param-4', prefix: '', title: 'ПАРАМЕТР №4', units: '', panel: 'otherParams' },
        { name: 'param-5', prefix: '', title: 'ПАРАМЕТР №5', units: '', panel: 'otherParams' },
        { name: 'param-6', prefix: '', title: 'ПАРАМЕТР №6', units: '', panel: 'otherParams' },
    ]
}
