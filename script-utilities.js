// Storage constants
globalThis.LIST_CASES_KEY = "cases";
globalThis.GET_ACTIVE_CASE_KEY = "active-case";
globalThis.CASE_PREFIX_KEY = "case-";
globalThis.DEFAULT_CASE_NAME = "Default";

globalThis.EYEBALL_UNICODE = "\ud83d\udc41";
globalThis.QUESTION_UNICODE = "\u2754";
globalThis.UNSEEN_TOOLTIP = "This is your first visit to this place.";
globalThis.SEEN_TOOLTIP = "You've seen this place before.";
globalThis.QUESTION_TOOLTIP = "Based on its name, you may have seen this place before.";
globalThis.MAX_WAIT_ITERATIONS = 40;

globalThis.DATA_ATTRIBUTE_URL_REG = /(?:.(?!\/))+$/;

globalThis.createIconElement = function(unicode, tooltip, color = "black") {
    var element = document.createElement("span");
    element.innerText = unicode;
    element.classList.add("seen-icon");
    element.style = "user-select: none; color: " + color;
    element.title = tooltip;
    return element;
}

globalThis.extractImageIDFromURL = function(url) {
    var id_reg = /^(?:http:|https:|)\/\/\w{1,4}\.googleusercontent\.com\/(?:proxy|p)\/(.*)=[\w-]*$/;
    var id = "";
    var results = id_reg.exec(url);
    if (results && results.length > 0) {
        id = results[1];
    } else {
        console.log("BAD IMAGE URL " + url);
    }
    return id;
}

globalThis.GLOBALS_LOADED = true;
