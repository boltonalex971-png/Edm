export default {
    deleteDialog: {
        title: 'Delete record?',
        messageNamed: 'Permanently delete "{{name}}". This action cannot be undone.',
        messageAnonymous: 'Permanently delete this record. This action cannot be undone.',
        action: 'Delete',
    },
    deleteResult: {
        success: 'Record deleted',
        failure: 'Failed to delete',
    },
} as const
