export default {
    action: {
        delete: 'Удалить',
        deleteFor: 'Удалить {{type}}',
        viewMode: 'Режим просмотра',
        editMode: 'Режим редактирования',
        outdatedEdit: 'Устаревшая версия — откройте актуальную для редактирования',
        copy: 'Копировать',
        close: 'Закрыть',
        cancel: 'Отмена',
        saveChanges: 'Сохранить',
        lockedBy: 'Заблокировано: {{name}}',
    },
    badge: {
        lockedBy: '🔒 Заблокировано: {{name}}',
        outdated: 'устаревшая',
        outdatedTooltip: 'Существует более новая версия. Эта запись сохранена для исторических ссылок и не может быть отредактирована.',
    },
    dialog: {
        delete: {
            confirmPrompt: 'Удалить <0>{{name}}</0> навсегда? Это действие нельзя отменить.',
        },
    },
    toast: {
        fallbackName: 'Запись',
        deleted: '{{name}} удалено',
        copied: 'Скопировано',
        copyFailed: 'Ошибка копирования',
        saved: 'Сохранено',
        savedAsNewVersion: 'Сохранено как новая версия',
        created: 'Создано',
    },
    editor: {
        forkDefaultDetail: 'Это изменение создаст новую версию.',
        forkConfirm: '{{detail}}\n\nПродолжить и создать новую версию?',
    },
    title: {
        newItem: 'Новая запись',
    },
    error: {
        saveFailed: 'Ошибка сохранения',
        deleteFailed: 'Ошибка удаления',
    },
    entityPlural: {
        item: 'Продукция',
        order: 'Заказы',
        supply: 'Поставки',
        folder: 'Папки',
        tare: 'Тары',
        taretype: 'Типы тары',
        nomenclature: 'Номенклатуры',
        process: 'Процессы',
        workplace: 'Рабочие места',
        host: 'Хосты',
        device: 'Устройства',
    },
} as const
