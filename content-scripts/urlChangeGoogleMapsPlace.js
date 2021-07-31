function checkIfSeen(placeName, plusCode, address, phoneNumber, imageID) {
    if (document.body.querySelectorAll(".seen-icon").length == 0) {
        chrome.storage.local.get([globalThis.GET_ACTIVE_CASE_KEY], function(data) {
            var caseKey = globalThis.CASE_PREFIX_KEY + data[globalThis.GET_ACTIVE_CASE_KEY];
            chrome.storage.local.get({[caseKey]: []}, function(data) {
                var places = data[caseKey];

                var match;
                if (plusCode !== "") {
                    match = places.find(place => place.code === plusCode && place.name === placeName);
                } else if (address !== "") {
                    match = places.find(place => place.address === address && place.name === placeName);
                } else if (phoneNumber !== "") {
                    match = places.find(place => place.phone === phoneNumber && place.name === placeName);
                }

                if (!match) {
                    console.log("NOT SEEN");
                    globalThis.logPlace(placeName, plusCode, address, phoneNumber, imageID);
                    var headerTitleElement = document.body.querySelector("h1[class*='header-title-title']");
                    if (headerTitleElement) {
                        var eyeElement = globalThis.createIconElement(globalThis.ICON_TYPES.unseen);
                        headerTitleElement.appendChild(eyeElement);
                    }
                } else {
                    console.log("SEEN");
                    var headerTitleElement = document.body.querySelector("h1[class*='header-title-title']");
                    if (headerTitleElement) {
                        var eyeElement = globalThis.createIconElement(globalThis.ICON_TYPES.seen);
                        headerTitleElement.appendChild(eyeElement);
                    }

                    if (match.image !== imageID) {
                        globalThis.updateValue(match, globalThis.UPDATE_TYPE.image, imageID);
                    }

                    if (match.phone !== phoneNumber) {
                        globalThis.updateValue(match, globalThis.UPDATE_TYPE.phone, phoneNumber);
                    }

                    if (match.address === "" && address.length > 0) {
                        globalThis.updateValue(match, globalThis.UPDATE_TYPE.address, address);
                    }
                }
            });
        });
    }
}

function operateOnPage() {
    var waitPanelIter = globalThis.MAX_WAIT_ITERATIONS;
    var checkPanelLoaded = setInterval(function() {
        waitPanelIter--;
        var mainPanelElement = document.body.querySelector("div[role='main']");
        if (mainPanelElement || waitPanelIter <= 0) {
            var name;
            var mainPanelNameElement = document.body.querySelector("h1[class*='header-title-title']");
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

                if (last_data_attribute === data_attr && waitPanelIter <= 0) {
                    // The wait period is up and the URL's data attribute hasn't changed - false alarm
                    clearInterval(checkPanelLoaded);
                } else if (last_data_attribute !== data_attr) {
                    // The data attribute changed, so clear the interval
                    clearInterval(checkPanelLoaded);

                    var phoneElement = document.body.querySelector("button[data-tooltip='Copy phone number'] > div > div:nth-child(2) > div");
                    var phone = phoneElement ? phoneElement.innerText : "";

                    var addressElement = document.body.querySelector("button[data-tooltip='Copy address'] > div > div:nth-child(2) > div");
                    var address = addressElement ? addressElement.innerText : "";

                    var waitImageIter = globalThis.MAX_WAIT_ITERATIONS;
                    var checkImageExists = setInterval(function() {
                        waitImageIter--;
                        var imageElement = document.body.querySelectorAll(".section-hero-header-image-hero-container > button > img")[0];
                        if (imageElement) {
                            clearInterval(checkImageExists);
                            var imageURL = imageElement.getAttribute('src');
                            var imageID = globalThis.extractImageIDFromURL(imageURL);
                            checkIfSeen(name || "", code || "", address || "", phone || "", imageID || "");
                        } else if (waitImageIter <= 0) {
                            clearInterval(checkImageExists);
                            checkIfSeen(name || "", code || "", address || "", phone || "", "");
                        }
                    }, 100);

                    window.sessionStorage.setItem('last_data_attribute', data_attr);
                } else {
                    // The wait period isn't up yet, so give the name time to change
                }
            }
        }
    }, 100);
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
