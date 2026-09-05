/**
 * Google Apps Script (GAS) Web App for Direct Image Uploads to Google Drive Folder
 * Target Folder: Gallery_Images (ID: 1SIg96z1Ej0LgyC1WsOjT97x7gE_6W-hm)
 * 
 * ══ خطوة تفعيل صلاحيات DriveApp المهمة جداً: ══
 * 1. في المحرر بالأعلى اختر الدالة authorize واضغط على زر "تشغيل" (Run ▶).
 * 2. ستظهر نافذة "يلزم الحصول على إذن" (Authorization Required) -> اضغط "مراجعة الأذونات" (Review permissions).
 * 3. اختر حسابك -> اضغط "إعدادات متقدمة" (Advanced) -> اضغط "الانتقال إلى ... (غير آمن)" -> اضغط "سماح" (Allow).
 * 4. اضغط زر "نشر" (Deploy) > "إدارة عمليات النشر" (Manage deployments) > اضغط القلم ✏️ > اختر "إصدار جديد" (New version) واضغط Deploy!
 */

const FOLDER_ID = '1SIg96z1Ej0LgyC1WsOjT97x7gE_6W-hm';

/**
 * دالة لتفعيل ومراجعة صلاحيات Google Drive في محرر Apps Script
 * اضغط "تشغيل" (Run) لهذه الدالة للموافقة على الصلاحيات
 */
function authorize() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  Logger.log('تم تفعيل وتأكيد الصلاحيات بنجاح لمجلد: ' + folder.getName());
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'No post data received'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);

    // 1. Action: Delete file from Google Drive
    if (data.action === 'delete') {
      if (data.fileId) {
        try {
          const file = DriveApp.getFileById(data.fileId);
          file.setTrashed(true);
          return ContentService.createTextOutput(JSON.stringify({
            success: true,
            action: 'delete',
            fileId: data.fileId
          })).setMimeType(ContentService.MimeType.JSON);
        } catch (delErr) {
          return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: 'Drive delete error: ' + delErr.toString()
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Missing fileId for delete action'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Action: Upload file to Google Drive folder
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
    // Grant public view access to anyone with link for fast global CDN delivery
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
    folderId: FOLDER_ID,
    folderName: 'Gallery_Images',
    service: 'AJ Gallery Drive Publisher Bridge'
  })).setMimeType(ContentService.MimeType.JSON);
}
