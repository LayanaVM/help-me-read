document.addEventListener('mouseup', (e) => {
    const word = window.getSelection().toString().trim();
    
    // Check if the click target is within the popup, if so, don't trigger lookup/removal on mouseup
    const existingPopup = document.getElementById('word-definer-popup');
    if (existingPopup && existingPopup.contains(e.target)) {
        return;
    }

    removePopup(); // remove any existing popup
    if (!word || word.includes(' ')) return; // single words only

    chrome.runtime.sendMessage({ action: 'getDefinition', word }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error contacting background script:", chrome.runtime.lastError);
            return;
        }

        if (!response || !response.success || !response.data) return;

        const data = response.data;
        const meaning = data[0]?.meanings?.[0];
        if (!meaning) return;

        const definition = meaning.definitions[0]?.definition;
        const partOfSpeech = meaning.partOfSpeech;

        if (definition) {
            showPopup(word, partOfSpeech, definition, e.pageX, e.pageY);
        }
    });
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

function removePopup() {
    document.getElementById('word-definer-popup')?.remove();
}

document.addEventListener('mousedown', (e) => {
    const popup = document.getElementById('word-definer-popup');
    if (popup && !popup.contains(e.target)) {
        removePopup();
    }
});