const LIST_CASES_KEY = "cases";
const GET_ACTIVE_CASE_KEY = "active-case";
const CASE_PREFIX_KEY = "case-"
const DEFAULT_CASE_NAME = "Default"

// Add an option to the case selector
function addCaseOption(name, selected = false) {
    var selectElement = document.getElementById("case-select");
    var newCaseElement = document.createElement("option");
    newCaseElement.text = name;
    var value = String(selectElement.children.length);
    newCaseElement.value = value;
    selectElement.appendChild(newCaseElement);
    if (selected) {
        selectElement.value = value;
    }
}

// Display number of places in storage
function displayNumPlaces(activeCaseName, format = "%NUM% places") {
    var caseKey = CASE_PREFIX_KEY + activeCaseName;
    chrome.storage.local.get({[caseKey]: []}, function(data) {
        var places = data[caseKey];
        document.getElementById('num_places').innerText = format.replace("%NUM%", places.length);
    });
}

// Display the size this case takes up in memory
function displayCaseSize(activeCaseName, format = "%BYTES%") {
    var caseKey = CASE_PREFIX_KEY + activeCaseName;
    chrome.storage.local.getBytesInUse([caseKey], function(bytes) {
        var byteString = "";

        if (bytes <= 0) {
            byteString = '0 bytes';
        } else {
            const k = 1024;
            const decimals = 2;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));

            byteString = parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }

        document.getElementById('bytes').innerText = format.replace("%BYTES%", byteString);
    });
}
