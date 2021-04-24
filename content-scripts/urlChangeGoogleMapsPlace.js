function logPlaceID(placeName, plusCode, phoneNumber) {
    chrome.storage.local.get([globalThis.GET_ACTIVE_CASE_KEY], function(data) {
        var caseKey = globalThis.CASE_PREFIX_KEY + data[globalThis.GET_ACTIVE_CASE_KEY];
        chrome.storage.local.get({[caseKey]: []}, function(data) {
            var places = data[caseKey];
            places.push({name: placeName, code: plusCode, phone: phoneNumber});

            chrome.storage.local.set({[caseKey]: places}, function() {
                if (chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError.message);
                    console.error("Unspecified error while storing Place Data");
                }
            });
        });
    });
}

// Return true if this plus code has been seen before
function checkIfSeen(placeName, plusCode, phoneNumber) {
    chrome.storage.local.get([globalThis.GET_ACTIVE_CASE_KEY], function(data) {
        var caseKey = globalThis.CASE_PREFIX_KEY + data[globalThis.GET_ACTIVE_CASE_KEY];
        chrome.storage.local.get({[caseKey]: []}, function(data) {
            var places = data[caseKey];

            var seen = false;
            if (plusCode !== "")
                seen = places.some(place => place.code === plusCode && place.name === placeName);
            else if (phoneNumber !== "") {
                seen = places.some(place => place.phone === phoneNumber && place.name === placeName);
            }

            if (!seen) {
                console.log("NOT SEEN");
                logPlaceID(placeName, plusCode, phoneNumber)
                var headerTitleElement = document.body.querySelector("h1.section-hero-header-title-title");
                if (headerTitleElement) {
                    var eyeElement = globalThis.createIconElement(" " + globalThis.EYEBALL_UNICODE, globalThis.UNSEEN_TOOLTIP, "lightgreen");
                    headerTitleElement.appendChild(eyeElement);
                }
            } else {
                console.log("SEEN");
                var headerTitleElement = document.body.querySelector("h1.section-hero-header-title-title");
                if (headerTitleElement) {
                    var eyeElement = globalThis.createIconElement(" " + globalThis.EYEBALL_UNICODE, globalThis.SEEN_TOOLTIP);
                    headerTitleElement.appendChild(eyeElement);
                }
            }
        });
    });
}

// If this content script has been executed on this page before,
// it's possible that there is currently an Interval running.
// This makes sure that no pre-existing Interval is running.
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
    var wait_iter = globalThis.MAX_WAIT_ITERATIONS;
    var checkExist = setInterval(function() {
        wait_iter--;
        var mainPanelElement = document.body.querySelector("div[role='main']");
        if (mainPanelElement || wait_iter <= 0) {
            var name;
            var mainPanelNameElement = document.body.querySelector("h1.section-hero-header-title-title");
            if (mainPanelNameElement) {
                // We're on the main panel
                name = mainPanelNameElement.getElementsByTagName('span')[0].innerText;
            } else {
                // Otherwise, we're not interested
                return;
            }

            var codeElement = document.body.querySelector("button[data-tooltip='Copy plus code']");
            // Sometimes a place won't have a Plus Code - skip those
            if (codeElement) {
                var code = codeElement.getAttribute("aria-label").split(": ")[1];
                var data_attr = globalThis.DATA_ATTRIBUTE_URL_REG.exec(window.location.href)[0];
                var last_data_attribute = window.sessionStorage.getItem('last_data_attribute');

                if (last_data_attribute === data_attr && wait_iter <= 0) {
                    // The wait period is up and the URL's data attribute hasn't changed - false alarm
                    clearInterval(checkExist);
                } else if (last_data_attribute !== data_attr) {
                    // The data attribute changed, so clear the interval
                    clearInterval(checkExist);

                    if (document.body.querySelectorAll(".seen-icon").length == 0) {
                        var phoneElement = document.body.querySelector("button[data-tooltip='Copy phone number'] > div > div:nth-child(2) > div");
                        var phone;
                        if (phoneElement) { phone = phoneElement.innerText; }

                        checkIfSeen(name || "", code || "", phone || "");

                        window.sessionStorage.setItem('last_data_attribute', data_attr);
                    }
                } else {
                    // The wait period isn't up yet, so give the name time to change
                }
            }
        }
    }, 100);
}
