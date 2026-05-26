chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getDefinition') {
        fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${message.word}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Word not found');
                }
                return response.json();
            })
            .then(data => {
                sendResponse({ success: true, data });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep the message channel open for asynchronous response
    }
});
