chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background received message:", message);
    if (message.action === 'getDefinition') {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${message.word}`;
        console.log("Fetching URL:", url);
        fetch(url)
            .then(response => {
                console.log("Response status:", response.status);
                if (!response.ok) {
                    throw new Error(`Word not found (Status: ${response.status})`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Fetch success, returning data.");
                sendResponse({ success: true, data });
            })
            .catch(error => {
                console.error("Fetch error:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep the message channel open for asynchronous response
    }
});
