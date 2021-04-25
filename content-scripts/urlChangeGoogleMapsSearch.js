// Google reuses the panel elements when the user pages through the list, which
// results in the icon element persisting across pages. Remove these elements.
var previouslyMarked = document.body.querySelectorAll("[data-marked='true']");
previouslyMarked.forEach(function(marked) {
    marked.removeAttribute("data-marked");
    var icon = marked.nextElementSibling;
    icon.remove();
});

var addSeenIcons = function() {
    chrome.storage.local.get([globalThis.GET_ACTIVE_CASE_KEY], function(data) {
        var caseKey = globalThis.CASE_PREFIX_KEY + data[globalThis.GET_ACTIVE_CASE_KEY];
        chrome.storage.local.get({[caseKey]: []}, function(data) {
            var places = data[caseKey];
            var placesOnPage = document.body.querySelectorAll("div.section-place-result-container-summary");

            placesOnPage.forEach(function(placeElement) {
                var nameElement = placeElement.querySelector("span");
                if (!nameElement.getAttribute("data-marked")) {
                    var name = nameElement.innerText;
                    var imageElement = placeElement.parentNode.querySelector(".section-place-result-container-image").querySelector("img");
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
                            var eyeElement = globalThis.createIconElement(" " + globalThis.EYEBALL_UNICODE, globalThis.SEEN_TOOLTIP);
                            nameElement.parentNode.insertBefore(eyeElement, nameElement.nextSibling);
                            nameElement.setAttribute("data-marked", "true");
                        } else {
                            var quesElement = globalThis.createIconElement("  " + globalThis.QUESTION_UNICODE, globalThis.QUESTION_TOOLTIP);
                            nameElement.parentNode.insertBefore(quesElement, nameElement.nextSibling);
                            nameElement.setAttribute("data-marked", "true");
                        }
                    }
                }
            });
        });
    });
}

if (waitOnGlobals) {
    clearInterval(waitOnGlobals);
}

var waitOnGlobals = setInterval(function() {
    if (globalThis.GLOBALS_LOADED) {
        clearInterval(waitOnGlobals);

        addSeenIcons();

        // Whenever the scrollbox section is modified, we need to go through
        // all of the places on the page and insert an icon for those places
        // that were newly added. This is particularly necessary when the
        // user scrolls down in the panel and Google loads more places.
        var nodeToObserve = document.body.querySelector(".section-layout .section-scrollbox");
        if (nodeToObserve) {
            var observerConfig = { attributes: true, childList: true, subtree: true }
            var observer = new MutationObserver(addSeenIcons);
            observer.observe(nodeToObserve, observerConfig);
        }
    }
}, 100);
