document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get([LIST_CASES_KEY], function(data) {
        var cases = data[LIST_CASES_KEY];
        chrome.storage.local.get({[GET_ACTIVE_CASE_KEY]: DEFAULT_CASE_NAME}, function(data) {
            var active_case = data[GET_ACTIVE_CASE_KEY];
            for (var i = 0; i < cases.length; i++) {
                addCaseOption(cases[i], cases[i] === active_case);
            }
        });
    });

    document.getElementById("case-select").addEventListener('change', function() {
        var selectElement = document.getElementById("case-select");
        var newActiveCase = selectElement.options[selectElement.value].innerText;
        chrome.storage.local.set({[GET_ACTIVE_CASE_KEY]: newActiveCase}, function() {
            displayNumPlaces(newActiveCase);
            displayCaseSize(newActiveCase);
        });
    });

    document.getElementById('settings-btn').addEventListener('click', function() {
        window.open("options.html", '_blank').focus();
    });

    chrome.storage.local.get([GET_ACTIVE_CASE_KEY], function(data) {
        displayNumPlaces(data[GET_ACTIVE_CASE_KEY]);
        displayCaseSize(data[GET_ACTIVE_CASE_KEY]);
    });
}, false);
