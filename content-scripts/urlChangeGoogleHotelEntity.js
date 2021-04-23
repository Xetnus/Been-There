if (waitOnGlobals) {
    clearInterval(waitOnGlobals);
}

var waitOnGlobals = setInterval(function() {
    if (globalThis.GLOBALS_LOADED) {
        clearInterval(waitOnGlobals);
        operateOnPage();
    }
}, 100);

var operateOnPage = function() {
    console.log("hotel entity");
    chrome.storage.local.get([globalThis.GET_ACTIVE_CASE_KEY], function(data) {
        var caseKey = globalThis.CASE_PREFIX_KEY + data[globalThis.GET_ACTIVE_CASE_KEY];
        chrome.storage.local.get({[caseKey]: []}, function(data) {
            var places = data[caseKey];

            var nameElement = document.body.querySelector("h1");
            var phoneElement = nameElement.parentElement.parentElement.querySelector(":scope > div:nth-child(3) > div > span:nth-child(3)");
            var phone = "";
            if (phoneElement) { phone = phoneElement.innerText; }

            if (places.some(place => place.name === nameElement.innerText && place.phone === phone)) {
                var eyeElement = globalThis.createIconElement(" " + globalThis.EYEBALL_UNICODE, globalThis.SEEN_TOOLTIP);
                nameElement.appendChild(eyeElement);
            }
        });
    });
}
