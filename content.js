document.addEventListener('mouseup', async (e) => {
    const word = window.getSelection().toString().trim();
    removePopup(); // remove any existing popup
    if (!word || word.includes(' ')) return; // single words only

    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!res.ok) return;
    const data = await res.json();
    const meaning = data[0].meanings[0];
    const definition = meaning.definitions[0].definition;
    const partOfSpeech = meaning.partOfSpeech;

    showPopup(word, partOfSpeech, definition, e.pageX, e.pageY);
});

function showPopup(word, pos, def, x, y) {
    const div = document.createElement('div');
    div.id = 'word-definer-popup';
    div.innerHTML = `<strong>${word}</strong> <em>${pos}</em><p>${def}</p>`;
    div.style.cssText = `position:absolute; left:${x}px; top:${y + 16}px; z-index:99999;`;
    document.body.appendChild(div);
}

function removePopup() {
    document.getElementById('word-definer-popup')?.remove();
}

document.addEventListener('mousedown', removePopup);