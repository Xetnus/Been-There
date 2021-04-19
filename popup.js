const STORAGE_KEY = "places";

document.addEventListener('DOMContentLoaded', function() {
    // Erase local storage
    var resetButton = document.getElementById('resetStorage');
    resetButton.addEventListener('click', function() {
        chrome.storage.local.remove(STORAGE_KEY, function() {
            if (chrome.runtime.lastError) {
                console.error("An unspecified error occurred while clearing your storage.");
            }
            window.close();
        });
    });

    // Export local storage
    var exportButton = document.getElementById('exportStorage');
    exportButton.addEventListener('click', function() {
        chrome.storage.local.get({[STORAGE_KEY]: [/* default value */]}, function(data) {
            var csvContent = "Place Name,Plus Code,Phone Number\r\n";
            data[STORAGE_KEY].forEach(function(place) {
                // Per CSV standards, replace double quotes with two double quotes
                var name = place.name.replace(/"/g, '""');
                csvContent += "\"" + place.name + "\",\"" + place.code + "\",\"" + place.phone + "\"\r\n";
            });

            var pom = document.createElement('a');
            var blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
            var url = URL.createObjectURL(blob);
            pom.href = url;
            pom.setAttribute('download', 'places.csv');
            pom.click();
            pom.remove();
        });
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

        document.getElementById('bytes').innerText = byteString;
    });

    // Display number of places in storage
    chrome.storage.local.get({[STORAGE_KEY]: [/* default value */]}, function(data) {
        var places = data[STORAGE_KEY];
        document.getElementById('num_places').innerText = places.length + " places seen"
    });
}, false);
