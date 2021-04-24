var addSeenIcon = function() {
    chrome.storage.local.get([globalThis.GET_ACTIVE_CASE_KEY], function(data) {
        var caseKey = globalThis.CASE_PREFIX_KEY + data[globalThis.GET_ACTIVE_CASE_KEY];
        chrome.storage.local.get({[caseKey]: []}, function(data) {
            var places = data[caseKey];
            var placeElement = document.body.querySelector(".hovercard-info-place-actions-container")

            // TODO:
            // Wait until loading panel is hidden

            if (placeElement) {
                var nameElement = placeElement.parentElement.querySelector('.gm2-subtitle-alt-1');

                if (!nameElement.getAttribute("data-marked")) {
                    // Because this page doesn't show plus codes, we can only match by name
                    if (places.some(place => place.name === nameElement.innerText)) {
                        // Inserts question mark after the ratings/reviews line
                        var quesElement = globalThis.createIconElement(" " + globalThis.QUESTION_UNICODE, globalThis.QUESTION_TOOLTIP);
                        nameElement.appendChild(quesElement, nameElement.nextSibling);
                        nameElement.setAttribute("data-marked", "true");
                    }
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

        // Whenever the scrollbox section is modified, we need to go through
        // all of the places on the page and insert an icon for those places
        // that were newly added. This is particularly necessary when the
        // user scrolls down in the panel and Google loads more places.
        var nodeToObserve = document.body.querySelector("#interactive-hovercard").querySelector('.widget-pane-content-holder');
        if (nodeToObserve) {
            var observerConfig = { attributes: true, childList: true, subtree: true }
            var observer = new MutationObserver(addSeenIcon);
            observer.observe(nodeToObserve, observerConfig);
        }
    }
}, 100);
