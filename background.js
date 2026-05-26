chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: "defineWord",
            title: "Define '%s'",
            contexts: ["selection"]
        });
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    try {
        console.log("Context menu item clicked:", info);
        if (info.menuItemId === "defineWord" && info.selectionText) {
            const word = info.selectionText.trim();
            const cleanWord = word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
            console.log("Context menu lookup for:", cleanWord);
            if (!cleanWord || cleanWord.includes(' ')) {
                return;
            }
            fetchAndNotify(cleanWord);
        }
    } catch (err) {
        console.error("Error in contextMenus.onClicked handler:", err);
    }
});

function fetchAndNotify(word) {
    try {
        console.log("fetchAndNotify starting for word:", word);
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
        fetch(url)
            .then(response => {
                console.log("API response status:", response.status);
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
                    console.log("Creating success notification. Type of chrome.notifications:", typeof chrome.notifications);
                    chrome.notifications.create("", {
                        type: 'basic',
                        iconUrl: 'icon.png',
                        title: `${word} (${pos})`,
                        message: definition,
                        priority: 2
                    }, (id) => {
                        if (chrome.runtime.lastError) {
                            console.error("Success notification error:", chrome.runtime.lastError);
                        } else {
                            console.log("Notification created. ID:", id);
                        }
                    });
                } else {
                    showErrorNotification(word);
                }
            })
            .catch(error => {
                console.error("Context menu fetch error:", error);
                showErrorNotification(word);
            });
    } catch (err) {
        console.error("Error in fetchAndNotify execution:", err);
    }
}

function showErrorNotification(word) {
    try {
        console.log("Creating error notification for:", word);
        chrome.notifications.create("", {
            type: 'basic',
            iconUrl: 'icon.png',
            title: `Word Not Found`,
            message: `Could not find definition for "${word}".`,
            priority: 1
        }, (id) => {
            if (chrome.runtime.lastError) {
                console.error("Error notification error:", chrome.runtime.lastError);
            } else {
                console.log("Error notification created. ID:", id);
            }
        });
    } catch (err) {
        console.error("Error in showErrorNotification execution:", err);
    }
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
