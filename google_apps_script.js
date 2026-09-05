/**
 * Google Apps Script (GAS) Web App for Direct Image Uploads to Google Drive Folder
 * Folder ID: 1SIg96z1Ej0LgyC1WsOjT97x7gE_6W-hm (Gallery_Images)
 * 
 * Instructions:
 * 1. Open https://script.google.com and create a new project.
 * 2. Paste this code into Code.gs.
 * 3. Click "Deploy" > "New deployment" > Select type: "Web app".
 * 4. Execute as: "Me" (your Google account).
 * 5. Who has access: "Anyone" (allows direct CORS upload from phone/browser).
 * 6. Copy the Web App URL (e.g. https://script.google.com/macros/s/.../exec).
 */

const FOLDER_ID = '1SIg96z1Ej0LgyC1WsOjT97x7gE_6W-hm';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const folder = DriveApp.getFolderById(FOLDER_ID);
    
    let base64 = data.data;
    let contentType = 'image/jpeg';
    
    if (base64.indexOf(';base64,') > -1) {
      const parts = base64.split(';base64,');
      contentType = parts[0].replace('data:', '');
      base64 = parts[1];
    }
    
    const decoded = Utilities.base64Decode(base64);
    const filename = (data.filename || ('art_' + new Date().getTime() + '.jpg'));
    const blob = Utilities.newBlob(decoded, contentType, filename);
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileId = file.getId();
    const directUrl = 'https://lh3.googleusercontent.com/d/' + fileId;
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: fileId,
      url: directUrl,
      name: filename
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    folderId: FOLDER_ID
  })).setMimeType(ContentService.MimeType.JSON);
}
