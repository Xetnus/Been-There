var observer;

var beginMonitoring = function() {
    if (observer) {
        observer.disconnect();
    }
    var nodeToObserve = document.body.querySelector("#interactive-hovercard").querySelector('.widget-pane-content-holder');
    if (nodeToObserve) {
        observer = new MutationObserver(handleHovercard);
        var observerConfig = { attributes: true, childList: true, subtree: true };
        observer.observe(nodeToObserve, observerConfig);
    }
}

var addIcon = function(nameElement, type) {
    var element = globalThis.createIconElement(type);
    nameElement.appendChild(element);
}

var handleHovercard = function(mutationList, observer) {
    chrome.storage.local.get([globalThis.GET_ACTIVE_CASE_KEY], function(data) {
        var caseKey = globalThis.CASE_PREFIX_KEY + data[globalThis.GET_ACTIVE_CASE_KEY];
        chrome.storage.local.get({[caseKey]: []}, function(data) {
            var places = data[caseKey];
            var hovercardElement = document.body.querySelector("#interactive-hovercard");
            var placeElement = hovercardElement.querySelector(".widget-pane-content-holder > .section-layout");

            if (placeElement) {
                var waitImageIter = globalThis.MAX_WAIT_ITERATIONS / 2;
                var checkImageExists = setInterval(function() {
                    waitImageIter--;
                    var nameElement = placeElement.querySelector('.gm2-subtitle-alt-1');
                    if (nameElement && nameElement.getAttribute("data-marked")) {
                        clearInterval(checkImageExists);
                        return;
                    }
                    observer.disconnect();
                    var name = nameElement.innerText;
                    var imageContainer = hovercardElement.querySelector(".image-container");
                    if (imageContainer) {
                        var imageElement = imageContainer.querySelector("img");
                        if (imageElement) {
                            var imageID = globalThis.extractImageIDFromURL(imageElement.getAttribute('src'));
                            clearInterval(checkImageExists);
                            if (places.some(place => place.name === name)) {
                                if (places.some(place => place.name === name && place.image === imageID)) {
                                    addIcon(nameElement, globalThis.ICON_TYPES.seen);
                                } else {
                                    addIcon(nameElement, globalThis.ICON_TYPES.uncertain);
                                }
                            }
                            beginMonitoring();
                        } else if (waitImageIter <= 0) {
                            clearInterval(checkImageExists);
                            if (places.some(place => place.name === name)) {
                                addIcon(nameElement, globalThis.ICON_TYPES.uncertain);
                            }
                            beginMonitoring();
                        }
                    } else if (waitImageIter <= 0) {
                        clearInterval(checkImageExists);
                        if (places.some(place => place.name === name)) {
                            addIcon(nameElement, globalThis.ICON_TYPES.uncertain);
                        }
                        beginMonitoring();
                    }
                }, 100);
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
        beginMonitoring();
    }
}, 100);
