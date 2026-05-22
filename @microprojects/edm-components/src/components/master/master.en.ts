export default {
    action: {
        delete: 'Delete',
        deleteFor: 'Delete {{type}}',
        viewMode: 'View mode',
        editMode: 'Edit mode',
        outdatedEdit: 'Outdated — open the current version to edit',
        copy: 'Copy',
        close: 'Close',
        cancel: 'Cancel',
        saveChanges: 'Save Changes',
        lockedBy: 'Locked by {{name}}',
    },
    badge: {
        lockedBy: '🔒 Locked by {{name}}',
        outdated: 'outdated',
        outdatedTooltip: 'A newer version exists. This record is preserved for historical references and cannot be edited.',
    },
    dialog: {
        delete: {
            confirmPrompt: 'Permanently delete <0>{{name}}</0>? This action cannot be undone.',
        },
    },
    toast: {
        fallbackName: 'Item',
        deleted: '{{name}} deleted',
        copied: 'Copied',
        copyFailed: 'Copy failed',
        saved: 'Saved',
        savedAsNewVersion: 'Saved as a new version',
        created: 'Created',
    },
    editor: {
        forkDefaultDetail: 'This change will create a new version.',
        forkConfirm: '{{detail}}\n\nProceed and create a new version?',
        forkTitle: 'Create new version?',
        forkAction: 'Create version',
    },
    title: {
        newItem: 'New Item',
    },
    error: {
        saveFailed: 'Save failed',
        deleteFailed: 'Delete failed',
    },
    entityPlural: {
        item: 'Items',
        order: 'Orders',
        supply: 'Supplies',
        folder: 'Folders',
        tare: 'Tares',
        taretype: 'Tare types',
        nomenclature: 'Nomenclatures',
        process: 'Processes',
        workplace: 'Workplaces',
        host: 'Hosts',
        device: 'Devices',
    },
} as const
