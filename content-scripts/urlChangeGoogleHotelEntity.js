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
    chrome.storage.local.get([globalThis.GET_ACTIVE_CASE_KEY], function(data) {
        var caseKey = globalThis.CASE_PREFIX_KEY + data[globalThis.GET_ACTIVE_CASE_KEY];
        chrome.storage.local.get({[caseKey]: []}, function(data) {
            var places = data[caseKey];

            var overviewNameElement = document.querySelector("#overview[role='tabpanel']").querySelector("h1");
            var phoneElement = overviewNameElement.parentElement.parentElement.querySelector(":scope > div:nth-child(3) > div > span:nth-child(3)");
            var phone = "";
            if (phoneElement) { phone = phoneElement.innerText; }

            if (places.some(place => place.name === overviewNameElement.innerText && place.phone === phone)) {
                var eyeElement = globalThis.createIconElement(globalThis.ICON_TYPES.seen);
                overviewNameElement.appendChild(eyeElement);

                // Sponsored hotels get a special "Sponsored" tab
                var sponsoredTabElement = document.querySelector("#featured[role='tabpanel']");
                if (sponsoredTabElement) {
                    var sponsoredNameElement = sponsoredTabElement.querySelector("header");
                    var contactElement = sponsoredNameElement.querySelector("div");
                    sponsoredNameElement.insertBefore(eyeElement.cloneNode(true), contactElement);
                }
            }
        });
    });
}
