const STORAGE_KEY = "places";

document.addEventListener('DOMContentLoaded', function() {
    var deleteButton = document.getElementById('delete-btn');
    deleteButton.addEventListener('click', function() {
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
                chrome.storage.local.get({[STORAGE_KEY]: [/* default value */]}, function(data) {
                    var places = data[STORAGE_KEY];
                    var content = readerEvent.target.result;
                    var lines = content.split("\r\n");
                    for (var i = 1; i < lines.length; i++) {
                        var split = lines[i].split("\",\"")
                        if (split.length == 3) {
                            split[0] = split[0].substring(1, split[0].length);
                            split[2] = split[2].substring(0, split[2].length - 1);
                            var name = split[0];
                            var code = split[1];
                            var phone = split[2];
                            var exists = places.some(place => place.name === name
                                && place.code === code && place.phone === phone);
                            if (!exists) {
                                console.log(name + " ---- " + code + " ---- " + phone);
                                places.push({name: name, code: code, phone: phone});
                            }
                        } else {
                            alert("Something went wrong with the import, check that it's formatted properly. Data not imported.");

                        }
                    }
                    chrome.storage.local.set({[STORAGE_KEY]: places}, function() {
                        if (chrome.runtime.lastError) {
                            console.error("Unspecified error while storing Place Data");
                        }
                        location.reload();
                    });
                });
            }
        }

        input.click();
    });

    // Export data
    var exportButton = document.getElementById('export-btn');
    exportButton.addEventListener('click', function() {
        chrome.storage.local.get({[STORAGE_KEY]: [/* default value */]}, function(data) {
            var csvContent = "Place Name,Plus Code,Phone Number\r\n";
            data[STORAGE_KEY].forEach(function(place) {
                // Per CSV standards, replace double quotes with two double quotes
                var name = place.name.replace(/"/g, '""');
                csvContent += "\"" + name + "\",\"" + place.code + "\",\"" + place.phone + "\"\r\n";
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

    // Delete case
    var deleteButton = document.getElementById('delete-btn');
    deleteButton.addEventListener('click', function() {
        var selectElement = document.getElementById("case-select");
        var selectedCaseName = selectElement.options[selectElement.selectedIndex].text;
        if(confirm("Data for case \"" + selectedCaseName + "\" will be deleted. Consider exporting the data beforehand. Continue?")) {
            chrome.storage.local.remove(STORAGE_KEY, function() {
                if (chrome.runtime.lastError) {
                    console.error("An unspecified error occurred while clearing your storage.");
                }
                var caseValue = selectElement.value;
                if (caseValue === "0") {
                    alert("The data for the default case has been erased, but the default case cannot be erased completely.");
                } else {
                    for (var i = 0; i < selectElement.length; i++) {
                        if (selectElement.options[i].value == caseValue) {
                            selectElement.remove(i);
                        }
                    }
                }
                location.reload();
            });
        }
    });

    // Add case
    var exportButton = document.getElementById('add-btn');
    exportButton.addEventListener('click', function() {
        var name = document.getElementById("case-name").value;
        if (name.length > 0) {
            var newCaseElement = document.createElement("option");
            newCaseElement.text = name;
            newCaseElement.value = name;
            document.getElementById("case-select").appendChild(newCaseElement);
            document.getElementById("case-select").value = name;
            document.getElementById("case-name").value = "";
        }
    });

    // Display number of places in storage
    chrome.storage.local.get({[STORAGE_KEY]: [/* default value */]}, function(data) {
        var places = data[STORAGE_KEY];
        document.getElementById('num_places').innerText = "You've seen " + places.length + " places."
    });

    // Display storage size
    chrome.storage.local.getBytesInUse([STORAGE_KEY], function(bytes) {
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

        document.getElementById('bytes').innerText = "This case uses " + byteString + " of storage.";
    });
}, false);
