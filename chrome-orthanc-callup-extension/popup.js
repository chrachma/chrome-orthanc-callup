
function onFoundStudies(result) {
    chrome.storage.sync.get("orthancExternalCallupUrl", ({ orthancExternalCallupUrl }) => {
        let buttons = document.getElementById('buttons');
        for (b of buttons.childNodes) {
            b.remove()
        }
        if (!orthancExternalCallupUrl) {
            console.log("No URL in Orthanc Study Callup extension settings set.");
            [el] = document.getElementsByClassName("no-url-hint");
            el.setAttribute("style", "display: block;")
        }
        if (orthancExternalCallupUrl && result) {
            let uniqueUids = [...new Set(result[0]['result'])];
            for (uid of uniqueUids) {
                let url = orthancExternalCallupUrl.replace('{StudyInstanceUID}', uid);
                
                study_div = document.createElement("div");
                study_div.setAttribute('class', 'study-div');
                uid_div = document.createElement("div");
                uid_div.setAttribute('class', 'uid-div');
                link_div = document.createElement("div");
                link_div.setAttribute('class', 'link-div');
                
                let showText = '...' + uid.substring(uid.length-10);
                uid_div.append(showText);
                
                link_div.append('OPEN STUDY');
                link_div.setAttribute("title", url);
                link_div.addEventListener('click', async () => {
                    window.open(url)
                });
                
                study_div.append(uid_div, link_div);
                buttons.append(study_div);
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', async() => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: findStudyUidInPage,
    }, onFoundStudies);
});

function findStudyUidInPage() {
    let studyUids = new Array();
    list_els = document.getElementsByClassName("ui-li-desc");
    for (let el of list_els) {
        if (el.innerHTML.startsWith("StudyInstanceUID")) {
            let studyUid = el.children[0].innerHTML;
            studyUids.push(studyUid);
        }
    }
    return studyUids;
}
