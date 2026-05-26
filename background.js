chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "defineWord",
        title: "Define '%s'",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "defineWord" && info.selectionText) {
        const word = info.selectionText.trim();
        const cleanWord = word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
        console.log("Context menu lookup for:", cleanWord);
        if (!cleanWord || cleanWord.includes(' ')) {
            return;
        }
        fetchAndNotify(cleanWord);
    }
});

function fetchAndNotify(word) {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Word not found (Status: ${response.status})`);
            }
            return response.json();
        })
        .then(data => {
            const meaning = data[0]?.meanings?.[0];
            const definition = meaning?.definitions[0]?.definition;
            const pos = meaning?.partOfSpeech;
            
            if (definition) {
                chrome.notifications.create("", {
                    type: 'basic',
                    iconUrl: 'icon.png',
                    title: `${word} (${pos})`,
                    message: definition,
                    priority: 2
                });
            } else {
                showErrorNotification(word);
            }
        })
        .catch(error => {
            console.error("Context menu fetch error:", error);
            showErrorNotification(word);
        });
}

function showErrorNotification(word) {
    chrome.notifications.create("", {
        type: 'basic',
        iconUrl: 'icon.png',
        title: `Word Not Found`,
        message: `Could not find definition for "${word}".`,
        priority: 1
    });
}

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
