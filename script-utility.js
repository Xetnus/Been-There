// Storage constants
globalThis.LIST_CASES_KEY = "cases";
globalThis.GET_ACTIVE_CASE_KEY = "active-case";
globalThis.CASE_PREFIX_KEY = "case-"
globalThis.DEFAULT_CASE_NAME = "Default"

globalThis.EYEBALL_UNICODE = "\ud83d\udc41";
globalThis.QUESTION_UNICODE = "\u2754";
globalThis.UNSEEN_TOOLTIP = "You've never seen this place before."
globalThis.SEEN_TOOLTIP = "You've seen this place before."
globalThis.QUESTION_TOOLTIP = "You may have seen this place before."
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

globalThis.GLOBALS_LOADED = true;
