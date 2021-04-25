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
    if (type === "question") {
        var quesElement = globalThis.createIconElement("  " + globalThis.QUESTION_UNICODE, globalThis.QUESTION_TOOLTIP);
        nameElement.appendChild(quesElement);
    } else if (type === "seen") {
        var eyeElement = globalThis.createIconElement(" " + globalThis.EYEBALL_UNICODE, globalThis.SEEN_TOOLTIP);
        nameElement.appendChild(eyeElement);
    }
}

var handleHovercard = function(mutationList, observer) {
    chrome.storage.local.get([globalThis.GET_ACTIVE_CASE_KEY], function(data) {
        var caseKey = globalThis.CASE_PREFIX_KEY + data[globalThis.GET_ACTIVE_CASE_KEY];
        chrome.storage.local.get({[caseKey]: []}, function(data) {
            var places = data[caseKey];
            var hovercardElement = document.body.querySelector("#interactive-hovercard");
            var placeElement = hovercardElement.querySelector(".hovercard-info-place-actions-container");

            if (placeElement) {
                var wait_image_iter = globalThis.MAX_WAIT_ITERATIONS / 2;
                var checkImageExists = setInterval(function() {
                    wait_image_iter--;
                    var nameElement = placeElement.parentElement.querySelector('.gm2-subtitle-alt-1');
                    if (nameElement.getAttribute("data-marked")) {
                        clearInterval(checkImageExists);
                        return;
                    }
                    observer.disconnect();
                    var name = nameElement.innerText;
                    var imageContainer = hovercardElement.querySelector(".section-carousel-item-container");
                    if (imageContainer) {
                        var imageElements = imageContainer.querySelectorAll("img");
                        if (imageElements && imageElements.length > 0) {
                            var imageID = globalThis.extractImageIDFromURL(imageElements[0].getAttribute('src'));
                            clearInterval(checkImageExists);
                            if (places.some(place => place.name === name)) {
                                if (places.some(place => place.name === name && place.image === imageID)) {
                                    addIcon(nameElement, "seen");
                                } else {
                                    addIcon(nameElement, "question");
                                }
                            }
                            beginMonitoring();
                        } else if (wait_image_iter <= 0) {
                            clearInterval(checkImageExists);
                            if (places.some(place => place.name === name)) {
                                addIcon(nameElement, "question");
                            }
                            beginMonitoring();
                        }
                    } else if (wait_image_iter <= 0) {
                        clearInterval(checkImageExists);
                        if (places.some(place => place.name === name)) {
                            addIcon(nameElement, "question");
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
