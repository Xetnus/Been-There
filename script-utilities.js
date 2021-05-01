// Storage constants
globalThis.LIST_CASES_KEY = "cases";
globalThis.GET_ACTIVE_CASE_KEY = "active-case";
globalThis.CASE_PREFIX_KEY = "case-";
globalThis.DEFAULT_CASE_NAME = "Default";

globalThis.ICON_TYPES = Object.freeze({"seen":1, "unseen":2, "uncertain":3});
globalThis.SEEN_UNICODE = "\ud83d\udc41";
globalThis.QUESTION_UNICODE = "\u2754";
globalThis.UNSEEN_TOOLTIP = "This is your first visit to this place.";
globalThis.SEEN_TOOLTIP = "You've seen this place before.";
globalThis.QUESTION_TOOLTIP = "Based on its name, you may have seen this place before.";
globalThis.MAX_WAIT_ITERATIONS = 40;

globalThis.DATA_ATTRIBUTE_URL_REG = /(?:.(?!\/))+$/;

globalThis.createIconElement = function(type, size = null) {
    var unicode;
    var tooltip;
    var color = "black";

    switch (type) {
        case globalThis.ICON_TYPES.seen:
            unicode = globalThis.SEEN_UNICODE;
            tooltip = globalThis.SEEN_TOOLTIP;
            break;
        case globalThis.ICON_TYPES.unseen:
            unicode = globalThis.SEEN_UNICODE;
            tooltip = globalThis.UNSEEN_TOOLTIP;
            color = "lightgreen";
            break;
        case globalThis.ICON_TYPES.uncertain:
            unicode = globalThis.QUESTION_UNICODE;
            tooltip = globalThis.QUESTION_TOOLTIP;
            break;
    }

    var element = document.createElement("span");
    element.innerText = unicode;
    element.classList.add("seen-icon");
    var sizeCSS = size ? "font-size: " + size + "em; " : "";
    element.style = "user-select: none; padding-left: 2px; " + sizeCSS + "color: " + color;
    element.title = tooltip;
    return element;
}

globalThis.extractImageIDFromURL = function(url) {
    var usercontent_reg = /^(?:http:|https:|)\/\/\w{1,4}\.googleusercontent\.com\/(?:proxy|p)\/(.*)=[\w.-]*$/;
    var streetview_reg = /^(?:http:|https:|)\/\/streetviewpixels-pa\.googleapis\.com\/v\d\/thumbnail\?panoid=(.*)&cb_client=.*$/;
    var id = "";
    var usercontent_results = usercontent_reg.exec(url);
    var streetview_results = streetview_reg.exec(url);
    if (usercontent_results && usercontent_results.length > 1) {
        id = usercontent_results[1];
    } else if (streetview_results && streetview_results.length > 1) {
        id = streetview_results[1];
    } else {
        if (url !== '//maps.gstatic.com/tactile/pane/result-no-thumbnail-1x.png')
            console.log("UNRECOGNIZED IMAGE URL " + url);
    }
    return id;
}

globalThis.GLOBALS_LOADED = true;
