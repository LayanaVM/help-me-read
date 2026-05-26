document.addEventListener('mouseup', (e) => {
    const rawSelection = window.getSelection().toString();
    console.log("Raw selection:", rawSelection);

    const word = rawSelection.trim();
    
    // Check if the click target is within the popup, if so, don't trigger lookup/removal on mouseup
    const existingPopup = document.getElementById('word-definer-popup');
    if (existingPopup && existingPopup.contains(e.target)) {
        console.log("Click was inside existing popup, ignoring lookup.");
        return;
    }

    removePopup(); // remove any existing popup
    if (!word) return;

    // Clean the word: remove leading/trailing non-alphanumeric characters
    const cleanWord = word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
    console.log("Cleaned word for API query:", cleanWord);

    if (!cleanWord || cleanWord.includes(' ')) {
        console.log("Selection is empty or contains multiple words, skipping lookup.");
        return;
    }

    console.log("Sending query to background service worker...");
    try {
        chrome.runtime.sendMessage({ action: 'getDefinition', word: cleanWord }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error contacting background script:", chrome.runtime.lastError);
                console.warn("Hint: Make sure to refresh the page after reloading/re-installing the extension.");
                return;
            }

            console.log("Background response received:", response);

            if (!response || !response.success || !response.data) {
                console.log("Definition search failed.");
                showErrorPopup(cleanWord, e.pageX, e.pageY);
                return;
            }

            const data = response.data;
            const meaning = data[0]?.meanings?.[0];
            if (!meaning) {
                showErrorPopup(cleanWord, e.pageX, e.pageY);
                return;
            }

            const definition = meaning.definitions[0]?.definition;
            const partOfSpeech = meaning.partOfSpeech;

            if (definition) {
                showPopup(cleanWord, partOfSpeech, definition, e.pageX, e.pageY);
            } else {
                showErrorPopup(cleanWord, e.pageX, e.pageY);
            }
        });
    } catch (err) {
        console.warn("Word Definer Extension: Could not communicate with background service worker. (Context might have been invalidated after reloading the extension).");
        console.warn("Please refresh this tab to reactivate the extension. Error details:", err.message);
    }
});

function showPopup(word, pos, def, x, y) {
    const div = document.createElement('div');
    div.id = 'word-definer-popup';
    div.innerHTML = `
        <div class="word-definer-header">
            <span class="word-definer-word">${word}</span>
            <span class="word-definer-pos">${pos}</span>
        </div>
        <p class="word-definer-definition">${def}</p>
    `;
    div.style.cssText = `position:absolute; left:${x}px; top:${y + 16}px; z-index:2147483647;`;
    document.body.appendChild(div);
}

function showErrorPopup(word, x, y) {
    const div = document.createElement('div');
    div.id = 'word-definer-popup';
    div.innerHTML = `
        <div class="word-definer-header">
            <span class="word-definer-word">${word}</span>
            <span class="word-definer-error-badge">Not Found</span>
        </div>
        <p class="word-definer-definition">Sorry, no definition was found for this word.</p>
    `;
    div.style.cssText = `position:absolute; left:${x}px; top:${y + 16}px; z-index:2147483647;`;
    document.body.appendChild(div);
}

function removePopup() {
    document.getElementById('word-definer-popup')?.remove();
}

document.addEventListener('mousedown', (e) => {
    const popup = document.getElementById('word-definer-popup');
    if (popup && !popup.contains(e.target)) {
        console.log("Clicked outside popup, removing it.");
        removePopup();
    }
});