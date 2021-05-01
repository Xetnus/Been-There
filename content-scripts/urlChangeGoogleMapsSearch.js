// Google reuses the panel elements when the user pages through the list, which
// results in the icon element persisting across pages. Remove all icons.
var previouslyMarked = document.body.querySelectorAll("[data-marked='true']");
previouslyMarked.forEach(function(marked) {
    marked.removeAttribute("data-marked");
});
document.body.querySelectorAll(".seen-icon").forEach(e => e.parentNode.removeChild(e));

var checkIfSeen = function(places, nameElement, imageID) {
    if (nameElement.parentNode.querySelectorAll(".seen-icon").length == 0) {
        var name = nameElement.innerText;
        if (places.some(place => place.name === name)) {
            // If a place matches by name only, then it's still
            // possible that the user has seen the place (i.e.,
            // the place's image was updated). However, if both
            // the name and image match, then we posit that
            // it's guaranteed the user has seen it.
            if (places.some(place => place.name === name && place.image === imageID)) {
                var eyeElement = globalThis.createIconElement(globalThis.ICON_TYPES.seen, "1.2");
                nameElement.parentNode.insertBefore(eyeElement, nameElement.nextSibling);
                nameElement.setAttribute("data-marked", "true");
            } else {
                var quesElement = globalThis.createIconElement(globalThis.ICON_TYPES.uncertain, "1.2");
                nameElement.parentNode.insertBefore(quesElement, nameElement.nextSibling);
                nameElement.setAttribute("data-marked", "true");
            }
        }
    }
}

// This function runs once when the global variables are loaded and then
// whenever the search panel is updated.
var addSeenIcons = function() {
    chrome.storage.local.get([globalThis.GET_ACTIVE_CASE_KEY], function(data) {
        var caseKey = globalThis.CASE_PREFIX_KEY + data[globalThis.GET_ACTIVE_CASE_KEY];
        chrome.storage.local.get({[caseKey]: []}, function(data) {
            var places = data[caseKey];
            var placesOnPage = document.body.querySelectorAll("div.section-place-result-container-summary");

            placesOnPage.forEach(function(placeElement) {
                var nameElement = placeElement.querySelector("span");
                if (!nameElement.getAttribute("data-marked")) {
                    // Sometimes the images need some time to load.
                    var wait_image_iter = globalThis.MAX_WAIT_ITERATIONS / 2;
                    var checkImageExists = setInterval(function() {
                        wait_image_iter--;
                        var imageElement = placeElement.parentNode.querySelector(".section-place-result-container-image").querySelector("img");
                        if (imageElement) {
                            clearInterval(checkImageExists);
                            var imageID = globalThis.extractImageIDFromURL(imageElement.getAttribute('src'));
                            checkIfSeen(places, nameElement, imageID);
                        } else if (wait_image_iter <= 0) {
                            clearInterval(checkImageExists);
                            checkIfSeen(places, nameElement, "");
                        }
                    }, 100);
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
