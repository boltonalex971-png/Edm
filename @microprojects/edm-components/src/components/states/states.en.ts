export default {
    detailStub: {
        title: 'Select an item',
        help: 'Choose an item from the list on the left to view its details, or create a new item to get started.',
        action: 'Create new item',
    },
    errorState: {
        defaultTitle: 'Something went wrong',
        codePrefix: 'Error code:',
        tryAgain: 'Try again',
        goBack: 'Go back',
    },
    errorStub: {
        title: 'Failed to load data',
        message: "We couldn't load the requested information. This might be due to a network issue or the item may no longer exist.",
    },
} as const
