export default {
    deleteDialog: {
        title: 'Удалить запись?',
        messageNamed: 'Безвозвратно удалить «{{name}}». Это действие нельзя отменить.',
        messageAnonymous: 'Безвозвратно удалить эту запись. Это действие нельзя отменить.',
        action: 'Удалить',
    },
    deleteResult: {
        success: 'Запись удалена',
        failure: 'Не удалось удалить',
    },
} as const
