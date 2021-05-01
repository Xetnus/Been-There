const DISPLAY_NUM_PLACES_STR = "You've seen %NUM% places.";
const DISPLAY_CASE_SIZE_STR = "This case uses %BYTES% of storage.";

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
            displayNumPlaces(newActiveCase, DISPLAY_NUM_PLACES_STR);
            displayCaseSize(newActiveCase, DISPLAY_CASE_SIZE_STR);
        });
    });

    // Import data
    var importButton = document.getElementById('import-btn');
    importButton.addEventListener('click', function() {
        var input = document.createElement('input');
        input.type = 'file';

        input.onchange = e => {
            var file = e.target.files[0];
            var reader = new FileReader();
            reader.readAsText(file);

            // Once the file has been loaded...
            reader.onload = readerEvent => {
                chrome.storage.local.get([GET_ACTIVE_CASE_KEY], function(data) {
                    var caseKey = CASE_PREFIX_KEY + data[GET_ACTIVE_CASE_KEY];
                    chrome.storage.local.get({[caseKey]: []}, function(data) {
                        var places = data[caseKey];
                        var content = readerEvent.target.result;
                        var lines = content.split("\r\n");
                        for (var i = 1; i < lines.length; i++) {
                            var split = lines[i].split("\",\"");
                            if (split.length == 5) {
                                split[0] = split[0].substring(1, split[0].length);
                                split[4] = split[4].substring(0, split[4].length - 1);
                                var name = split[0];
                                var code = split[1];
                                var address = split[2];
                                var phone = split[3];
                                var image = split[4];
                                var exists = places.some(place => place.name === name
                                    && place.code === code && place.address === address
                                    && place.phone === phone && place.image === image);
                                if (!exists) {
                                    console.log(name + " ---- " + code + " ---- " + address + " ---- " + phone + " ---- " + image);
                                    places.push({name: name, code: code, address: address, phone: phone, image: image});
                                }
                            } else {
                                alert("Something went wrong with the import; check that it's formatted properly. Data not imported.");
                            }
                        }
                        chrome.storage.local.set({[caseKey]: places}, function() {
                            if (chrome.runtime.lastError) {
                                console.error("Unspecified error while storing place data.");
                                console.log(chrome.runtime.lastError.message);
                            }
                            location.reload();
                        });
                    });
                });
            }
        }

        input.click();
    });

    // Export data
    var exportButton = document.getElementById('export-btn');
    exportButton.addEventListener('click', function() {
        chrome.storage.local.get([GET_ACTIVE_CASE_KEY], function(data) {
            var caseKey = CASE_PREFIX_KEY + data[GET_ACTIVE_CASE_KEY];
            chrome.storage.local.get({[caseKey]: []}, function(data) {
                var csvContent = "Place Name,Plus Code,Address,Phone Number,Image ID\r\n";
                data[caseKey].forEach(function(place) {
                    // Per CSV standards, replace double quotes with two double quotes
                    var name = place.name.replace(/"/g, '""');
                    csvContent += "\"" + name + "\",\"" + place.code + "\",\"" + place.address +
                        "\",\"" + place.phone + "\",\"" + place.image + "\"\r\n";
                });
                // Remove last new line characters
                csvContent = csvContent.substring(0, csvContent.length - 2);

                var pom = document.createElement('a');
                var blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
                var url = URL.createObjectURL(blob);
                pom.href = url;
                pom.setAttribute('download', 'places.csv');
                pom.click();
                pom.remove();
            });
        });
    });

    // Delete case
    var deleteButton = document.getElementById('delete-btn');
    deleteButton.addEventListener('click', function() {
        var selectElement = document.getElementById("case-select");
        var selectedCaseName = selectElement.options[selectElement.selectedIndex].text;
        if(confirm("The case \"" + selectedCaseName + "\" will be deleted. You might want to export its data beforehand. Continue?")) {
            chrome.storage.local.get([GET_ACTIVE_CASE_KEY], function(data) {
                var caseName = data[GET_ACTIVE_CASE_KEY];
                var caseKey = CASE_PREFIX_KEY + caseName;
                // Erase the case data
                chrome.storage.local.remove([caseKey], function() {
                    if (chrome.runtime.lastError) {
                        console.error("An unspecified error occurred while clearing your storage. (1)");
                        console.log(chrome.runtime.lastError.message);
                    }
                    if (caseName === DEFAULT_CASE_NAME) {
                        alert("The data for the default case has been erased, but the default case cannot be erased entirely.");
                        displayNumPlaces(caseName, DISPLAY_NUM_PLACES_STR);
                        displayCaseSize(caseName, DISPLAY_CASE_SIZE_STR);
                    } else {
                        // Erase the case
                        chrome.storage.local.get([LIST_CASES_KEY], function(data) {
                            var cases = data[LIST_CASES_KEY];
                            var caseIndex = cases.indexOf(caseName);
                            if (caseIndex !== -1) {
                                // Delete case
                                cases.splice(caseIndex, 1);
                            }
                            chrome.storage.local.set({[LIST_CASES_KEY]: cases}, function() {
                                if (chrome.runtime.lastError) {
                                    console.error("An unspecified error occurred while clearing your storage. (2)");
                                    console.log(chrome.runtime.lastError.message);
                                }
                                chrome.storage.local.set({[GET_ACTIVE_CASE_KEY]: DEFAULT_CASE_NAME}, function() {
                                    if (chrome.runtime.lastError) {
                                        console.error("An unspecified error occurred while clearing your storage. (3)");
                                        console.log(chrome.runtime.lastError.message);
                                    }
                                    location.reload();
                                });
                            });
                        });
                    }
                });
            });
        }
    });

    // Add case
    document.getElementById('add-btn').addEventListener('click', function() {
        var name = document.getElementById("case-name").value;
        chrome.storage.local.get([LIST_CASES_KEY], function(data) {
            var cases = data[LIST_CASES_KEY];
            if (name.length > 0 && !cases.includes(name)) {
                var caseKey = CASE_PREFIX_KEY + name;
                chrome.storage.local.set({[caseKey]: []}, function() {
                    chrome.storage.local.set({[GET_ACTIVE_CASE_KEY]: name}, function() {
                        cases.push(name);
                        chrome.storage.local.set({[LIST_CASES_KEY]: cases}, function(data) {
                            document.getElementById("case-name").value = "";
                            addCaseOption(name, true);
                            displayNumPlaces(name, DISPLAY_NUM_PLACES_STR);
                            displayCaseSize(name, DISPLAY_CASE_SIZE_STR);
                        });
                    });
                });
            } else if (cases.includes(name)){
                alert("That case name already exists.");
            }
        });
    });

    chrome.storage.local.get([GET_ACTIVE_CASE_KEY], function(data) {
        displayNumPlaces(data[GET_ACTIVE_CASE_KEY], DISPLAY_NUM_PLACES_STR);
        displayCaseSize(data[GET_ACTIVE_CASE_KEY], DISPLAY_CASE_SIZE_STR);
    });
}, false);
