const STORAGE_KEY = "places";
const ACTIVE_ICON = "map-pin-active.png";
const INACTIVE_ICON = "map-pin-inactive.png";

const PLACE_REG = /(?:http|https):\/\/(?:www\.|)google\.com\/maps\/place\/\S*/;
const SEARCH_REG = /(?:http|https):\/\/(?:www\.|)google\.com\/maps\/search\/\S*/;
const HOTEL_ENTITY_REG = /(?:http|https):\/\/(?:www\.|)google\.com\/travel\/hotels\/.+\/entity\/.+?\S*/;
const HOTEL_LIST_REG = /(?:http|https):\/\/(?:www\.|)google\.com\/travel\/hotels\/\S*/;

// On URL change
chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
        if (changeInfo.url) {
            if (changeInfo.url.match(PLACE_REG)) {
                chrome.browserAction.setIcon({path: ACTIVE_ICON});
                chrome.tabs.sendMessage(tabId, {
                    message: 'urlChangeGooglePlace',
                    url: changeInfo.url
                });
            } else if (changeInfo.url.match(SEARCH_REG)) {
                chrome.browserAction.setIcon({path: ACTIVE_ICON});
                chrome.tabs.sendMessage(tabId, {
                    message: 'urlChangeGoogleSearch',
                    url: changeInfo.url
                });
            } else if (changeInfo.url.match(HOTEL_ENTITY_REG)) {
                console.log("hotel entity found");
                chrome.browserAction.setIcon({path: ACTIVE_ICON});
                // var port = chrome.runtime.connect({name: "hotelentity"});
                chrome.tabs.sendMessage(tabId, {
                    message: 'urlChangeGoogleHotelEntity',
                    url: changeInfo.url
                });
            } else if (changeInfo.url.match(HOTEL_LIST_REG)) {
                chrome.browserAction.setIcon({path: ACTIVE_ICON});
                chrome.tabs.sendMessage(tabId, {
                    message: 'urlChangeGoogleHotelList',
                    url: changeInfo.url
                });
            } else {
                chrome.browserAction.setIcon({path: INACTIVE_ICON});
                chrome.tabs.sendMessage(tabId, {
                    message: 'urlChangeOther',
                    url: changeInfo.url
                });
            }
        } else if (changeInfo.status) {
            console.log(changeInfo.status)
            if (changeInfo.status === "complete") {
                console.log("complete");
            }
        }
    }
);

// Run once on install
chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === "install") {
        chrome.storage.local.set({[STORAGE_KEY]: []}, function() {
            console.log("Set initial storage.");
        });
    } else if (details.reason === "update") {
        chrome.storage.local.get({version: 0}, function(verData) {
            if (verData.version === 1) {
                chrome.storage.local.set({[STORAGE_KEY]: []}, function() {
                    console.log("Data format updated.");
                });
                // chrome.storage.local.get({[STORAGE_KEY]: []}, function(data) {
                //     var newPlaces = [];
                //     for (let place of data[STORAGE_KEY]) {
                //         if (!place.id || !place.plusCode || !place.placeName) {
                //             continue;
                //         }
                //         let newPlace = {}
                //         newPlace.id = place.id;
                //         newPlace.code = place.plusCode;
                //         newPlace.name = place.placeName;
                //         newPlaces.push(newPlace);
                //     }
                //     chrome.storage.local.set({[STORAGE_KEY]: newPlaces}, function() {
                //         console.log("Data format updated.");
                //     });
                //
                // });
            }
        });

        chrome.storage.local.set({version: 2}, function() {
            console.log("Plugin updated.")
        });
    }
});

// Listens for Google Maps API Request
// chrome.runtime.onMessage.addListener(
//     function(request, sender, onSuccess) {
//         if (request.message === "apiCall") {
//             fetch(request.url)
//                 .then(response => response.text())
//                 .then(responseText => onSuccess(responseText))
//         }
//     }
// );
