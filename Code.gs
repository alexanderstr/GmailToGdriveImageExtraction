//The script(Google Apps Script) below extracts images from Gmail and saves them to a Google Drive.
//Setup:
//  1) Navigate to https://script.google.com/home/
//  2) Create a new project and copy/past the code below
//  3) Execute downloadImagesToDrive function (select in the dropdown above)
//
//Configuration
//1) A gmail query for retrieving email threads is stored in the
//   var query = 'filename:(jpg OR jpeg OR png) ';
//
//2) Extracted images are stored in the
//   getOrCreateFolder("!PhotoDump"); folder
//
//Good to know
//1) Because google drive API does not allow to set file created or file modified dates, the script 
//     saves images in year subfolders with file names having a date of original email + size + original attachment name
//2) The script execution is pretty slow, it took me about 24 hours to process 17 years of emails

function downloadImagesToDrive() {
    var scriptProperties = PropertiesService.getScriptProperties();
    var query = 'filename:(jpg OR jpeg OR png) ';
    var start = scriptProperties.getProperty('start') || 0;
    var maxThreads = 10; // Adjust based on your average attachments size and processing time

    var threads = GmailApp.search(query, parseInt(start), maxThreads);
    var mainFolder = getOrCreateFolder("!PhotoDump");

    var i = 0;
    threads.forEach(function(thread, index) {
        var messages = thread.getMessages();

        messages.forEach(function(message) {
            var attachments = message.getAttachments();

            attachments.forEach(function(attachment) {
                // Check if the attachment is an image
                if (attachment.getContentType().indexOf("image/") === 0) {
                    var date = message.getDate(); // Get the date of the email
                    var year = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy");
                    var yearFolder = getOrCreateSubFolder(year, mainFolder); // Get the specific year folder

                    var fileSize = attachment.getSize();
                    var fileName = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd") + " - " + fileSize + "- " + attachment.getName();

                    var existingFiles = yearFolder.getFilesByName(fileName);

                    // Check if the file already exists
                    if (!existingFiles.hasNext() && fileSize > 10000) {
                        yearFolder.createFile(attachment.copyBlob().setName(fileName));
                        Logger.log((i++) + " " + fileName);
                    } else {
                        Logger.log("DUPLICATE" + (i++) + " " + fileName);
                    }
                }
            });
        });
    });

    // Save the continuation token and manage triggers
    manageTriggers(threads, maxThreads, start, scriptProperties);
}

function manageTriggers(threads, maxThreads, start, scriptProperties) {
    if (threads.length === maxThreads) {
        scriptProperties.setProperty('start', parseInt(start) + maxThreads);
        deleteExistingTriggers();
        ScriptApp.newTrigger('downloadImagesToDrive')
            .timeBased()
            .after(5 * 60 * 1000) // Set trigger for 5 minutes later
            .create();
    } else {
        scriptProperties.deleteProperty('start');
    }
}

function getOrCreateFolder(folderName) {
    var folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
        return folders.next();
    } else {
        return DriveApp.createFolder(folderName);
    }
}

function getOrCreateSubFolder(folderName, parentFolder) {
    var folders = parentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
        return folders.next();
    } else {
        return parentFolder.createFolder(folderName);
    }
}

function deleteExistingTriggers() {
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
        if (triggers[i].getHandlerFunction() === 'downloadImagesToDrive') {
            ScriptApp.deleteTrigger(triggers[i]);
        }
    }
}

function resetDownloadImagesToDrive() {
    var scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.deleteProperty('start');
}





