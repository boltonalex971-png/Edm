

export const defaultOptions = {
    panels: {
        profile: { color: 'aqua' },
        mainParams: { color: 'bisque' },
        envParams: { color: 'rgb(232, 215, 242)' },
        otherParams: { color: 'cornsilk' },
    },
    params: [
        { name: 'pressure-in-chamber', title: 'Давление в камере', format: 'P = # мм.рт.ст.', panel: 'mainParams' },
        { name: 'wafer-temp-in-carusel', title: 'Температура подложек\nв карусели', format: 't = # °C', panel: 'mainParams' },
        { name: 'warm-up-time', title: 'Время прогрева\n(по достижению уставки)', format: 't = # с', panel: 'mainParams' },
        { name: 'room-temperature', title: 'Температура\n в помещении', format: 't = # °C', panel: 'envParams' },
        { name: 'room-humidity', title: 'Относительная влажность\n в помещении', format: 'Rh = # %', panel: 'envParams' },
        { name: 'hinge-weight', title: 'Масса навески:', format: 'm = # гр', panel: 'envParams' },
        { name: 'pressure-under-cap', title: 'Давление в подколпачном\n пространстве', format: 'P = # мм.рт.ст.', panel: 'otherParams' },
        { name: 'carusel-temperature', title: 'Температура карусели', format: 't = # °C', panel: 'otherParams' },
        { name: 'evaporator-temperature', title: 'Температура испарителя:', format: 't = # °C', panel: 'otherParams' },
        { name: 'param-4', title: 'ПАРАМЕТР №4', panel: 'otherParams' },
        { name: 'param-5', title: 'ПАРАМЕТР №5', panel: 'otherParams' },
        { name: 'param-6', title: 'ПАРАМЕТР №6', panel: 'otherParams' },
    ]
}
