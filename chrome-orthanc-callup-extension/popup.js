
/* Main script registration */

document.addEventListener('DOMContentLoaded', async() => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // const url = tab.url.split('/').slice(0, 3).join('/');
    // chrome.storage.sync.set({ "orthancApiUrl": url });
    
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: findStudyUidInPage
    }, onFoundStudies);
});


/* Script to be run on main page */

function findStudyUidInPage() {
    let studyUids = new Array();
    list_els = document.querySelectorAll('div.ui-page-active p.ui-li-desc')
    for (let el of list_els) {
        if (el.innerHTML.startsWith("StudyInstanceUID")) {
            let studyUid = el.children[0].innerHTML;
            studyUids.push(studyUid);
        }
    }
    // push also current URL so we can retrieve optional study information later
    studyUids.push(window.location.href);

    return studyUids;
}

/* Helpers for popup */

function formatDateHyphen(dateString) {
    if (dateString.length == 8) {
        return dateString.slice(0, 4) + '-' + dateString.slice(4, 6) + '-' + dateString.slice(6, 8);
    }
    return dateString;
}

function getUidFromHash(h) {
    const params = h.split('?');
    if (params.length == 2 && params[1].startsWith('uuid=')) {
        console.log(params)
        return params[1].slice('uuid='.length);
    }
    return '';
}

function getInstanceInfo(origin, uid) {
    return fetch(origin + '/instances/' + uid).then(response => response.json()).then(jsonObj => getSeriesInfo(origin, jsonObj['ParentSeries']));
}

function getSeriesInfo(origin, uid) {
    return fetch(origin + '/series/' + uid).then(response => response.json()).then(jsonObj => getStudyInfo(origin, jsonObj['ParentStudy']));
}

function getStudyInfo(origin, uid) {
    return fetch(origin + '/studies/' + uid).then(response => response.json()).then(jsonObj => {
        return {
            'StudyDate': jsonObj['MainDicomTags']['StudyDate'],
            'StudyDescription': jsonObj['MainDicomTags']['StudyDescription'],
            'PatientName': jsonObj['PatientMainDicomTags']['PatientName'],
            'StudyInstanceUID': jsonObj['MainDicomTags']['StudyInstanceUID']
        };
    });
}

function emptyPromise(origin, uid) {
    return new Promise((resolve, reject) => {
        resolve({});
    });
}


/* Popup script */

function onFoundStudies(params) {
    chrome.storage.sync.get("orthancApiUrl", ({ orthancApiUrl }) => {
        
        let result = params[0]['result']

        // workaroudn to get url: is appended as last element
        let u = new URL(result.pop())

        let f = emptyPromise;
        let orthancUid = '';

        if (u.pathname.startsWith('/app/explorer') && u.hash.startsWith('#instance')) {
            orthancUid = getUidFromHash(u.hash);
            f = getInstanceInfo;
            
        } else if (u.pathname.startsWith('/app/explorer') && u.hash.startsWith('#series')) {
            orthancUid = getUidFromHash(u.hash);
            f = getSeriesInfo;
            
        } else if (u.pathname.startsWith('/app/explorer') && u.hash.startsWith('#study')) {
            orthancUid = getUidFromHash(u.hash);
            f = getStudyInfo;
        }

        f(orthancApiUrl, orthancUid).then(info => {
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
                    let uniqueUids = [...new Set(result)];
                    for (uid of uniqueUids) {
                        let url = orthancExternalCallupUrl.replace('{StudyInstanceUID}', uid);
                        
                        study_div = document.createElement("div");
                        study_div.setAttribute('class', 'study-div');
                        
                        uid_div = document.createElement("div");
                        uid_div.setAttribute('class', 'uid-div');
                        
                        link_div = document.createElement("div");
                        link_div.setAttribute('class', 'link-div');
                        
                        let showText = uid; //'...' + uid.substring(uid.length-14);
                        if ((info['PatientName']) && (uid === info['StudyInstanceUID'])) {
                            showText = info['PatientName'] + ', ' + info['StudyDescription'] + ', ' + formatDateHyphen(info['StudyDate']);
                        }
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
        })
    });
}

