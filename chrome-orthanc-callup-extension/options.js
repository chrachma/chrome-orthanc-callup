let input = document.getElementById("target-url");

function getInputValue() {
    const val = document.querySelector('input').value;
    chrome.storage.sync.set({ "orthancExternalCallupUrl": val });
}

input.addEventListener("blur", getInputValue);

chrome.storage.sync.get("orthancExternalCallupUrl", ({ orthancExternalCallupUrl }) => {
    if (orthancExternalCallupUrl) {
        input.setAttribute("value", orthancExternalCallupUrl);
    } else {
        input.setAttribute("value", "");
    }
});