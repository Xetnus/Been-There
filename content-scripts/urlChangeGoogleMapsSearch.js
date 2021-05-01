// Google reuses the panel elements when the user pages through the list, which
// results in the icon element persisting across pages. Remove all icons.
var previouslyMarked = document.body.querySelectorAll("[data-marked='true']");
previouslyMarked.forEach(function(marked) {
    marked.removeAttribute("data-marked");
});
document.body.querySelectorAll(".seen-icon").forEach(e => e.parentNode.removeChild(e));

var checkIfSeen = function(places, nameElement, imageID, spans) {
    if (nameElement.parentNode.querySelectorAll(".seen-icon").length == 0) {
        var name = nameElement.innerText;
        if (places.some(place => place.name === name)) {
            // If a place matches by name only, then it's possible the user has
            // seen the place. However, if either the address, image, or phone
            // number match, in addition to the place name, then we posit that
            // it's guaranteed the user has seen it.
            if (places.some(place => place.name === name && place.image === imageID)) {
                var eyeElement = globalThis.createIconElement(globalThis.ICON_TYPES.seen, "1.2");
                nameElement.parentNode.insertBefore(eyeElement, nameElement.nextSibling);
                nameElement.setAttribute("data-marked", "true");
            } else {
                var found = false;
                spans.forEach(function(span) {
                    var value = span.innerText;
                    console.log(value);
                    if (places.some(place => place.name === name &&
                            (place.address.includes(value) || place.phone === value))) {
                        var eyeElement = globalThis.createIconElement(globalThis.ICON_TYPES.seen, "1.2");
                        nameElement.parentNode.insertBefore(eyeElement, nameElement.nextSibling);
                        nameElement.setAttribute("data-marked", "true");
                        found = true;
                        return;
                    }
                });

                if (!found) {
                    var quesElement = globalThis.createIconElement(globalThis.ICON_TYPES.uncertain, "1");
                    nameElement.parentNode.insertBefore(quesElement, nameElement.nextSibling);
                    nameElement.setAttribute("data-marked", "true");
                }
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
                var spans = Array.from(placeElement.querySelector(".mapsConsumerUiSubviewSectionGm2Placesummary__info-line:last-child").querySelectorAll("span"));
                // Any span returned in this query could potentially contain the
                // phone number or address of the place. We can filter the spans
                // by their number of children (the address and phone number
                // spans don't have children) and the length of their inner text.
                // A length of three was arbitrarily chosen.
                spans = spans.filter(span => span.children.length == 0 && span.innerText.length > 3);

                var nameElement = placeElement.querySelector("span");
                if (!nameElement.getAttribute("data-marked")) {
                    // Sometimes the images need some time to load.
                    var waitImageIter = globalThis.MAX_WAIT_ITERATIONS / 2;
                    var checkImageExists = setInterval(function() {
                        waitImageIter--;
                        var imageElement = placeElement.parentNode.querySelector(".section-place-result-container-image").querySelector("img");
                        if (imageElement) {
                            clearInterval(checkImageExists);
                            var imageID = globalThis.extractImageIDFromURL(imageElement.getAttribute('src'));
                            checkIfSeen(places, nameElement, imageID, spans);
                        } else if (waitImageIter <= 0) {
                            clearInterval(checkImageExists);
                            checkIfSeen(places, nameElement, "", spans);
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
