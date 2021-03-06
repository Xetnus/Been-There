const LIST_CASES_KEY = "cases";
const GET_ACTIVE_CASE_KEY = "active-case";
const CASE_PREFIX_KEY = "case-"
const DEFAULT_CASE_NAME = "Default"
const CURRENT_VERSION = 1;

const ACTIVE_ICON = "assets/map-pin-active.png";
const INACTIVE_ICON = "assets/map-pin-inactive.png";

const GOOGLE_REG = /(?:http|https):\/\/.*\.google\.com\/.+/;
const MAPS_REG = /(?:http|https):\/\/(?:www\.|)google\.com\/maps\/@\S*/;
const PLACE_REG = /(?:http|https):\/\/(?:www\.|)google\.com\/maps\/place\/\S*/;
const SEARCH_REG = /(?:http|https):\/\/(?:www\.|)google\.com\/maps\/search\/\S*/;
const HOTEL_ENTITY_REG = /(?:http|https):\/\/(?:www\.|)google\.com\/travel\/hotels\/.+\/entity\/.+?\S*/;
const HOTEL_LIST_REG = /(?:http|https):\/\/(?:www\.|)google\.com\/travel\/hotels\/\S*/;

// On URL change
chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
        if (changeInfo.url && changeInfo.url.match(GOOGLE_REG)) {
            var url = changeInfo.url;
            if (url.match(MAPS_REG)) {
                chrome.browserAction.setIcon({path: ACTIVE_ICON});
                chrome.tabs.executeScript(tabId,
                    { file: 'content-scripts/urlChangeGoogleMaps.js' }
                );
            } else if (url.match(PLACE_REG)) {
                chrome.browserAction.setIcon({path: ACTIVE_ICON});
                chrome.tabs.executeScript(tabId,
                    { file: 'content-scripts/urlChangeGoogleMapsPlace.js' }
                );
            } else if (url.match(SEARCH_REG)) {
                chrome.browserAction.setIcon({path: ACTIVE_ICON});
                chrome.tabs.executeScript(tabId,
                    { file: 'content-scripts/urlChangeGoogleMapsSearch.js' }
                );
            } else if (url.match(HOTEL_ENTITY_REG)) {
                console.log("hotel entity found");
                chrome.browserAction.setIcon({path: ACTIVE_ICON});
                chrome.tabs.executeScript(tabId,
                    { file: 'content-scripts/urlChangeGoogleHotelEntity.js' }
                );
            } else if (url.match(HOTEL_LIST_REG)) {
                chrome.browserAction.setIcon({path: ACTIVE_ICON});
                chrome.tabs.executeScript(tabId,
                    { file: 'content-scripts/urlChangeGoogleHotelList.js' }
                );
            } else {
                chrome.browserAction.setIcon({path: INACTIVE_ICON});
                chrome.tabs.executeScript(tabId,
                    { file: 'content-scripts/urlChangeOther.js' }
                );
            }
        }
    }
);

// Run once on install
chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === "install") {
        // Initializes the three default keys in storage
        chrome.storage.local.set({[LIST_CASES_KEY]: [DEFAULT_CASE_NAME]}, function() {
            if (chrome.runtime.lastError) {
                console.log("Something went wrong initializing storage (1)");
                console.log(chrome.runtime.lastError.message);
            } else {
                chrome.storage.local.set({[GET_ACTIVE_CASE_KEY]: DEFAULT_CASE_NAME}, function() {
                    if (chrome.runtime.lastError) {
                        console.log("Something went wrong initializing storage (2)");
                        console.log(chrome.runtime.lastError.message);
                    } else {
                        var defaultCaseKey = CASE_PREFIX_KEY + DEFAULT_CASE_NAME;
                        chrome.storage.local.set({[defaultCaseKey]: []}, function() {
                            if (chrome.runtime.lastError) {
                                console.log("Something went wrong initializing storage (3)");
                                console.log(chrome.runtime.lastError.message);
                            } else {
                                console.log("This plugin's storage has been successfully initialized.");
                            }
                        });
                    }
                });
            }
        });

        chrome.storage.local.set({version: CURRENT_VERSION}, function() {
        });
    } else if (details.reason === "update") {
        chrome.storage.local.get({version: 0}, function(verData) {
            if (verData.version === 0) {
                chrome.storage.local.get([LIST_CASES_KEY], function(data) {
                    var cases = data[LIST_CASES_KEY];
                    cases.forEach(function(caseName) {
                        var caseKey = CASE_PREFIX_KEY + caseName;
                        chrome.storage.local.get({[caseKey]: []}, function(data) {
                            var places = data[caseKey];

                            for (var i = 0; i < places.length; i++) {
                                places[i].address = "";
                            }

                            chrome.storage.local.set({[caseKey]: places}, function() {
                                if (chrome.runtime.lastError) {
                                    console.log(chrome.runtime.lastError.message);
                                    console.error("Unspecified error while storing Place Data");
                                }
                            });

                            chrome.storage.local.set({version: CURRENT_VERSION}, function() {
                                console.log("Plugin updated.")
                            });
                        });
                    });
                });
            }
        });
    }
});
