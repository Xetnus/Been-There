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

            var waitIter = globalThis.MAX_WAIT_ITERATIONS;
            var checkPanelLoaded = setInterval(function() {
                var namesOnPage = document.body.querySelectorAll("h2");
                var numMarked = document.body.querySelectorAll("[data-marked='true']").length;
                waitIter--;

                // We need to wait for the panel elements to load. The number of names
                // on the page needs to be > 0 and the number of marked names should be
                // 0, since the panel doesn't carry over DOM elements on new pages.
                if (namesOnPage.length > 0 && numMarked == 0) {
                    clearInterval(checkPanelLoaded);
                    namesOnPage.forEach(function(nameElement) {
                        if (!nameElement.getAttribute("data-marked")) {
                            var name = nameElement.innerText;
                            var imageElement = nameElement.closest("c-wiz").querySelector("div[aria-label='Photos'] > div > img");
                            var imageID = "";
                            if (imageElement) {
                                imageID = globalThis.extractImageIDFromURL(imageElement.getAttribute('src'));
                            }

                            if (places.some(place => place.name === name)) {
                                // If a place matches by name only, then it's still
                                // possible that the user has seen the place (i.e.,
                                // the place's image was updated). However, if both
                                // the name and image match, then we posit that
                                // it's guaranteed the user has seen it.
                                if (places.some(place => place.name === name && place.image === imageID)) {
                                    console.log("found " + nameElement.innerText);
                                    // Inserts seen icon after the ratings/reviews line
                                    var eyeElement = globalThis.createIconElement(globalThis.ICON_TYPES.seen, "1.3");
                                    nameElement.parentNode.parentNode.querySelector(":scope > div > a").appendChild(eyeElement);
                                    nameElement.setAttribute("data-marked", "true");
                                } else {
                                    console.log("possibly found " + nameElement.innerText);
                                    // Inserts seen icon after the ratings/reviews line
                                    var quesElement = globalThis.createIconElement(globalThis.ICON_TYPES.uncertain, "1.3");
                                    nameElement.parentNode.parentNode.querySelector(":scope > div > a").appendChild(quesElement);
                                    nameElement.setAttribute("data-marked", "true");
                                }
                            }
                        }
                    });
                } else if (waitIter == 0) {
                    clearInterval(checkPanelLoaded);
                }
            }, 100);
        });
    });
}
