// const FINDPLACE = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?%INPUT%&%INPUT_TYPE%&%FIELDS%&%API_KEY%";
const STORAGE_KEY = "places";
const EYEBALL_UNICODE = "\ud83d\udc41";
const QUESTION_UNICODE = "\u2754";
const UNSEEN_TOOLTIP = "You've never seen this place before."
const SEEN_TOOLTIP = "You've seen this place before."
const QUESTION_TOOLTIP = "You may have seen this place before."
const MAX_WAIT_ITERATIONS = 50;

var last_place_name = "";
var last_plus_code = "";

function createIconElement(unicode, tooltip, color = "black") {
    var element = document.createElement("span");
    element.innerText = unicode;
    element.style = "user-select: none; color: " + color;
    element.title = tooltip;
    return element;
}

function logPlaceID(/*jsonResponse,*/placeName, plusCode, phoneNumber) {
    chrome.storage.local.get({[STORAGE_KEY]: [/* default value */]}, function(data) {
        var places = data[STORAGE_KEY];
        places.push({name: placeName, code: plusCode, phone: phoneNumber});

        chrome.storage.local.set({[STORAGE_KEY]: places}, function() {
            if (chrome.runtime.lastError) {
                console.error("Unspecified error while storing Place Data");
            }

            chrome.storage.local.getBytesInUse([STORAGE_KEY], function(num) {
                console.log(num + " bytes");
            });
        });
    });
}

// Return true if this plus code has been seen before
function checkIfSeen(placeName, plusCode, phoneNumber) {
    chrome.storage.local.get({[STORAGE_KEY]: [/* default value */]}, function(data) {
        var places = data[STORAGE_KEY];

        // The place must match by plus code and name
        var seen = false;
        if (plusCode !== "")
            seen = places.some(place => place.code === plusCode && place.name === placeName);
        else if (phoneNumber !== "") {
            seen = places.some(place => place.phone === phoneNumber && place.name === placeName);
        }

        if (!seen) {
            console.log("NOT SEEN");
            // var req_url = FINDPLACE;
            // req_url = req_url.replace("%INPUT%", "input=" + encodeURIComponent(plusCode));
            // req_url = req_url.replace("%INPUT_TYPE%", "inputtype=textquery");
            // req_url = req_url.replace("%FIELDS%", "fields=place_id");
            // req_url = req_url.replace("%API_KEY%", "key=" + API_KEY);
            // console.info("MAKING API CALL");

            // chrome.runtime.sendMessage(
             // { message: 'apiCall', url: req_url },
             // data => logPlaceID(data, plusCode, placeName)
            // );
            logPlaceID(placeName, plusCode, phoneNumber)
            var headerTitleElement = document.body.querySelector("h1.section-hero-header-title-title");
            if (headerTitleElement) {
                var eyeElement = createIconElement(" " + EYEBALL_UNICODE, UNSEEN_TOOLTIP, "lightgreen");
                headerTitleElement.appendChild(eyeElement);
            }
        } else {
            console.log("SEEN");
            var headerTitleElement = document.body.querySelector("h1.section-hero-header-title-title");
            if (headerTitleElement) {
                var eyeElement = createIconElement(" " + EYEBALL_UNICODE, SEEN_TOOLTIP);
                headerTitleElement.appendChild(eyeElement);
            }
        }
    });
}

// Invoked from backend
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.message === 'urlChangeGooglePlace') {
            var wait_iter = MAX_WAIT_ITERATIONS;
            var checkExist = setInterval(function() {
                wait_iter--;
                var mainPanelElement = document.body.querySelector("div[role='main']");
                if (mainPanelElement || wait_iter == 0) {
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

                        if (name === last_place_name && code === last_plus_code && wait_iter == 0) {
                            // The wait period is up and the name or plus code hasn't changed - false alarm
                            return;
                        } else if (name !== last_place_name || code !== last_plus_code) {
                            // Either the name or code changed, so clear the interval
                            clearInterval(checkExist);

                            var phoneElement = document.body.querySelector("button[data-tooltip='Copy phone number'] > div > div:nth-child(2) > div");
                            var phone;
                            if (phoneElement) { phone = phoneElement.innerText; }

                            checkIfSeen(name || "", code || "", phone || "");

                            last_plus_code = code;
                            last_place_name = name;
                        } else {
                            // The wait period isn't up yet, so give the name time to change
                        }
                    }
                }
            }, 100);
        } else if (request.message === 'urlChangeGoogleSearch') {
            // Google reuses the panel elements when the user pages through the list.
            // This results in the icon element persisting across pages. Remove these.
            var previouslyMarked = document.body.querySelectorAll("[data-marked='true']");
            previouslyMarked.forEach(function(marked) {
                marked.removeAttribute("data-marked");
                var icon = marked.nextElementSibling;
                icon.remove();
            });

            var addQuestionIcons = function() {
                chrome.storage.local.get({[STORAGE_KEY]: [/* default value */]}, function(data) {
                    var places = data[STORAGE_KEY];
                    var placesOnPage = document.body.querySelectorAll("div.section-place-result-container-summary");
                    console.log(placesOnPage);

                    placesOnPage.forEach(function(placeElement) {
                        var nameElement = placeElement.querySelector("span");
                        if (!nameElement.getAttribute("data-marked")) {
                            // Because this page doesn't show plus codes, we can only match by name
                            if (places.some(place => place.name === nameElement.innerText)) {
                                console.log("seen " + nameElement.innerText);
                                // Inserts question mark after the ratings/reviews line
                                var quesElement = createIconElement(" " + QUESTION_UNICODE, QUESTION_TOOLTIP);
                                nameElement.parentNode.insertBefore(quesElement, nameElement.nextSibling);
                                nameElement.setAttribute("data-marked", "true");
                            }
                        }
                    });
                });
            }

            addQuestionIcons();

            // Whenever the scrollbox section is modified, we need to go through
            // all of the places on the page and insert an icon for those places
            // that were newly added. This is particularly necessary when the
            // user scrolls down in the panel and Google loads more places.
            var nodeToObserve = document.body.querySelector(".section-layout .section-scrollbox");
            var observerConfig = { attributes: true, childList: true, subtree: true }
            var observer = new MutationObserver(addQuestionIcons);
            observer.disconnect();
            observer.observe(nodeToObserve, observerConfig);
        } else if (request.message === 'urlChangeGoogleHotelEntity') {
            console.log("hotel entity");
            chrome.storage.local.get({[STORAGE_KEY]: [/* default value */]}, function(data) {
                var places = data[STORAGE_KEY];

                var nameElement = document.body.querySelector("h1");
                var phoneElement = nameElement.parentElement.parentElement.querySelector(":scope > div:nth-child(3) > div > span:nth-child(3)");
                var phone = ""
                if (phoneElement) { phone = phoneElement.innerText; }

                if (places.some(place => place.name === nameElement.innerText && place.phone === phone)) {
                    var eyeElement = createIconElement(" " + EYEBALL_UNICODE, SEEN_TOOLTIP);
                    nameElement.appendChild(eyeElement);
                }
            });
        } else if (request.message === 'urlChangeGoogleHotelList') {
            chrome.storage.local.get({[STORAGE_KEY]: [/* default value */]}, function(data) {
                var places = data[STORAGE_KEY];

                var wait_iter = MAX_WAIT_ITERATIONS;
                var checkExist = setInterval(function() {
                    var namesOnPage = document.body.querySelectorAll("h2");
                    var numMarked = document.body.querySelectorAll("[data-marked='true']").length;
                    wait_iter--;

                    // We need to wait for the panel elements to load. The number of names
                    // on the page needs to be > 0 and the number of marked names should be
                    // 0, since the panel doesn't carry over DOM elements on new pages.
                    if (namesOnPage.length > 0 && numMarked == 0) {
                        clearInterval(checkExist);
                        namesOnPage.forEach(function(nameElement) {
                            if (!nameElement.getAttribute("data-marked")) {
                                // Because this page doesn't show plus codes, we can only match by name
                                if (places.some(place => place.name === nameElement.innerText)) {
                                    console.log("found " + nameElement.innerText);
                                    // Inserts question mark after the ratings/reviews line
                                    var quesElement = createIconElement(" " + QUESTION_UNICODE, QUESTION_TOOLTIP);
                                    nameElement.parentNode.querySelector(":scope > div").appendChild(quesElement);
                                    nameElement.setAttribute("data-marked", "true");
                                }
                            }
                        });
                    } else if (wait_iter == 0) {
                        clearInterval(checkExist);
                    }
                }, 100);
            });
        } else if (request.message === 'urlChangeOther') {
            last_place_name = "";
            last_plus_code = "";
        }
    }
);
