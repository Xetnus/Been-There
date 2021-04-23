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

            var wait_iter = globalThis.MAX_WAIT_ITERATIONS;
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
                                var quesElement = globalThis.createIconElement("  " + globalThis.QUESTION_UNICODE, globalThis.QUESTION_TOOLTIP);
                                nameElement.parentNode.parentNode.querySelector(":scope > div > a").appendChild(quesElement);
                                nameElement.setAttribute("data-marked", "true");
                            }
                        }
                    });
                } else if (wait_iter == 0) {
                    clearInterval(checkExist);
                }
            }, 100);
        });
    });
}
