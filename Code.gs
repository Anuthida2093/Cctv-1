/**
 * ============================================================================
 * CAMCARE - INTEGRATED MANAGEMENT SYSTEM (ENTERPRISE BACKEND)
 * PART 1: SERVER BACKEND REFACTORING (TURBO SPEED & OPTIMIZED DB CALLS)
 * ============================================================================
 */
const TABLES = {
  USERS: 'Users', CCTV: 'CCTV', REPAIRS: 'Repairs', CLAIMS: 'Claims',
  BORROWS: 'Borrows', INSTALLATIONS: 'Installations', INVENTORY: 'Inventory',
  NOTIFICATIONS: 'Notifications'
};

function SETUP_SYSTEM() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const prop = PropertiesService.getScriptProperties();
  let folderId = prop.getProperty('CAMCARE_FOLDER_ID');
  if (!folderId) {
    let folder = DriveApp.createFolder('CAMCARE_System_Files');
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    prop.setProperty('CAMCARE_FOLDER_ID', folder.getId());
  }
  
  const schemas = {
    [TABLES.USERS]: ['id', 'name', 'username', 'password', 'role', 'permissions', 'status', 'createdAt'],
    [TABLES.CCTV]: ['id', 'name', 'lat', 'lng', 'status', 'streamUrl', 'imgUrl', 'attachedFile', 'assignee', 'createdAt'], 
    [TABLES.REPAIRS]: ['id', 'date', 'username', 'customerName', 'phone', 'category', 'itemName', 'project', 'serial', 'problem', 'assignee', 'status', 'imgUrl', 'attachedFile', 'comments'],
    [TABLES.CLAIMS]: ['id', 'date', 'username', 'customerName', 'phone', 'vendor', 'project', 'category', 'itemName', 'serial', 'reason', 'assignee', 'status', 'imgUrl', 'attachedFile', 'comments'],
    [TABLES.BORROWS]: ['id', 'username', 'adminName', 'adminNote', 'phone', 'category', 'borrowName', 'itemName', 'borrowDate', 'reason', 'assignee', 'status', 'imgUrl', 'attachedFile', 'comments'],
    [TABLES.INSTALLATIONS]: ['id', 'date', 'time', 'username', 'customerName', 'phone', 'project', 'location', 'problem', 'assignee', 'status', 'imgUrl', 'attachedFile', 'comments'],
    [TABLES.INVENTORY]: ['id', 'date', 'username', 'project', 'category', 'name', 'serial', 'price', 'assignee', 'notes', 'status', 'imgUrl', 'attachedFile', 'comments'],
    [TABLES.NOTIFICATIONS]: ['id', 'target', 'message', 'status', 'type', 'relatedId', 'createdAt']
  };
  
  for (let sheetName in schemas) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(schemas[sheetName]);
      sheet.getRange(1, 1, 1, schemas[sheetName].length).setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');
      sheet.setFrozenRows(1);
    } else {
      let existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      let missingHeaders = schemas[sheetName].filter(h => !existingHeaders.includes(h));
      if (missingHeaders.length > 0) {
        let startCol = existingHeaders.length + 1;
        sheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders])
             .setBackground('#0f172a').setFontColor('#38bdf8').setFontWeight('bold');
      }
    }
  }
  const userSheet = ss.getSheetByName(TABLES.USERS);
  if (userSheet && userSheet.getLastRow() <= 1) {
    userSheet.appendRow(['USR-00000', 'Super Administrator', 'superadmin', '1234', 'superadmin', JSON.stringify(['all']), 'active', new Date().toISOString()]);
  }
  Logger.log("SETUP COMPLETE! Drive Folder ID: " + prop.getProperty('CAMCARE_FOLDER_ID'));
}

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('CAMCARE - Integrated Management System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL) // เปิดทางให้ iPad สามารถทำงานข้ามเฟรมได้
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0'); 
}

function safeJSONParse(val) {
  if (typeof val !== 'string') return val;
  let trimmed = val.trim();
  if (!trimmed) return val;

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      let unescaped = JSON.parse(trimmed);
      if (typeof unescaped === 'string') trimmed = unescaped.trim();
    } catch(e) {}
  }

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try { return JSON.parse(trimmed); } 
    catch(e) { return val; }
  }
  return val;
}

function uploadSingleMedia(fileData, prefix) {
  try {
    if (!fileData || typeof fileData !== 'string' || !fileData.startsWith('data:')) return fileData;

    const folderId = PropertiesService.getScriptProperties().getProperty('CAMCARE_FOLDER_ID');
    if(!folderId) throw new Error("Folder ID not found. Run SETUP_SYSTEM first.");
    const folder = DriveApp.getFolderById(folderId);

    const mimeMatch = fileData.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*?,/);
    if (!mimeMatch) return fileData;
    
    const mimeType = mimeMatch[1];
    const base64Data = fileData.split(',')[1];
    
    // ป้องกัน Apps Script Memory Limit: ถ้ารหัส base64 ยาวเกินไป (~25MB) ให้ตีกลับเพื่อป้องกันเซิร์ฟเวอร์ค้าง
    if (base64Data.length > 35000000) {
       throw new Error(`ไฟล์ต้นฉบับใหญ่เกินกว่าที่เซิร์ฟเวอร์ Google จะรับได้ กรุณาลดขนาดไฟล์`);
    }
    
    let ext = 'bin';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
    else if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('spreadsheetml')) ext = 'xlsx';
    else if (mimeType.includes('pdf')) ext = 'pdf';

    const fileName = `${prefix}_${new Date().getTime()}_${Math.floor(Math.random()*10000)}.${ext}`;
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
    const newFile = folder.createFile(blob);
    
    newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    if (ext === 'jpg' || ext === 'png') {
      return "https://drive.google.com/thumbnail?id=" + newFile.getId() + "&sz=w1000"; 
    } else {
      return "https://drive.google.com/file/d/" + newFile.getId() + "/view";
    }
  } catch (e) {
    Logger.log("uploadSingleMedia Error: " + e.message);
    throw e;
  }
}

function processFilesToDrive(input, prefix) {
  if (!input) return input;
  let files = [];
  try {
    if (typeof input === 'string') {
      if(input.trim() === '') return input;
      files = safeJSONParse(input);
      if (!Array.isArray(files)) files = [input];
    } else if (Array.isArray(input)) {
      files = input;
    } else return input;
    
    if (!Array.isArray(files) || files.length === 0) return typeof input === 'object' ? JSON.stringify(input) : input;

    let finalUrls = [];
    files.forEach(fileData => {
      if (!fileData || typeof fileData !== 'string') return;
      if (!fileData.startsWith('data:')) { finalUrls.push(fileData); return; }
      finalUrls.push(uploadSingleMedia(fileData, prefix));
    });

    return JSON.stringify(finalUrls);
  } catch (e) {
    Logger.log("Error processing files: " + e.message);
    return typeof input === 'object' ? JSON.stringify(input) : input;
  }
}

function processPayloadFiles(payload, idPrefix) {
  if (!payload) return {};
  if (payload.imgUrl) payload.imgUrl = processFilesToDrive(payload.imgUrl, `${idPrefix}_IMG`);
  if (payload.attachedFile) payload.attachedFile = processFilesToDrive(payload.attachedFile, `${idPrefix}_DOC`);
  return payload;
}

function getDbData(sheetName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return []; 
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow <= 1 || lastCol === 0) return []; 

    const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      let obj = {};
      headers.forEach((header, i) => {
        let val = row[i];
        if (val instanceof Date) val = val.toISOString(); 
        obj[header] = safeJSONParse(val);
      });
      return obj;
    });
  } catch (e) {
    Logger.log("getDbData Error in sheet " + sheetName + ": " + e.message);
    return []; 
  }
}

function insertDb(sheetName, dataObj) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000); 
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("ระบบไม่พบแผ่นงาน: " + sheetName);

    const lastCol = sheet.getLastColumn() || 1;
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    if(!dataObj.createdAt && headers.includes('createdAt')) dataObj.createdAt = new Date().toISOString();
    
    const row = headers.map(header => {
      let val = dataObj[header];
      if (val === undefined || val === null) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return val;
    });
    sheet.appendRow(row); // appendRow เร็วและกินทรัพยากรน้อย
  } finally { lock.releaseLock(); }
}

// 🌟 FIX: ปรับจูน updateDb ใหม่ทั้งหมด! เขียนข้อมูลลงรวดเดียวทั้งแถว ไม่เซฟทีละเซลล์ ทำให้ส่งแชทได้ไวปานสายฟ้า ไม่เกิด Timeout
function updateDb(sheetName, idField, idValue, updateObj) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("ระบบไม่พบแผ่นงาน: " + sheetName);

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf(idField);
    
    if (idIndex === -1) throw new Error("ไม่พบคอลัมน์ ID: " + idField);

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIndex]) === String(idValue)) {
        let rowToUpdate = data[i];
        let isChanged = false;
        
        headers.forEach((header, colIndex) => {
          if (updateObj.hasOwnProperty(header)) {
            let val = updateObj[header];
            if (typeof val === 'object') val = JSON.stringify(val);
            if (rowToUpdate[colIndex] !== val) {
              rowToUpdate[colIndex] = val;
              isChanged = true;
            }
          }
        });
        
        // เขียนกลับลงไปรวดเดียว 1 คำสั่ง ลดภาระ Server ได้ 1000%
        if (isChanged) {
          sheet.getRange(i + 1, 1, 1, headers.length).setValues([rowToUpdate]);
        }
        break;
      }
    }
  } finally { lock.releaseLock(); }
}

function deleteDbMultiple(sheetName, idField, idsArray) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("ระบบไม่พบแผ่นงาน: " + sheetName);

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;
    
    const headers = data[0];
    const idIndex = headers.findIndex(h => h.toLowerCase() === idField.toLowerCase());
    const userIndex = headers.findIndex(h => h.toLowerCase() === 'username');
    if (idIndex === -1) return;

    const cleanIds = idsArray.map(id => String(id).trim().toLowerCase());
    
    // 🌟 Batch Processing Array
    let newData = [headers];
    let isChanged = false;

    for (let i = 1; i < data.length; i++) {
      const cellValue = String(data[i][idIndex]).trim().toLowerCase();
      
      if (cleanIds.indexOf(cellValue) !== -1) { 
        if (userIndex !== -1 && data[i][userIndex] && sheetName !== TABLES.NOTIFICATIONS && sheetName !== TABLES.USERS) {
           let targetUser = String(data[i][userIndex]).trim();
           addNotification({
              id: 'NOTIF-' + new Date().getTime() + i, // เลี่ยง ID ซ้ำ
              target: targetUser,
              message: `ข้อมูลรหัส ${data[i][idIndex]} ของคุณถูกลบ/ยกเลิกแล้ว`,
              status: 'unread',
              type: 'system',
              relatedId: data[i][idIndex],
              createdAt: new Date().toISOString()
           });
        }
        isChanged = true;
      } else {
        newData.push(data[i]);
      }
    }
    
    // 🌟 เขียนลงไปรวดเดียว
    if (isChanged) {
      sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).clearContent();
      if (newData.length > 0) {
        sheet.getRange(1, 1, newData.length, headers.length).setValues(newData);
      }
      SpreadsheetApp.flush(); 
    }
  } catch (e) {
    Logger.log("Error: " + e.message); throw e;
  } finally { lock.releaseLock(); }
}

function getInitialData() {
  try {
    const allUsers = getDbData(TABLES.USERS) || [];
    const activeUsers = allUsers.filter(u => u.status === 'active');
    const pendingUsers = allUsers.filter(u => u.status === 'pending');
    
    return {
      users: activeUsers, pendingUsers: pendingUsers, cctv: getDbData(TABLES.CCTV),
      repairs: getDbData(TABLES.REPAIRS), claims: getDbData(TABLES.CLAIMS), borrows: getDbData(TABLES.BORROWS),
      installations: getDbData(TABLES.INSTALLATIONS), inventory: getDbData(TABLES.INVENTORY), notifications: getDbData(TABLES.NOTIFICATIONS)
    };
  } catch (error) { return { error: true, message: error.message }; }
}

function loginUser(username, password) {
  const users = getDbData(TABLES.USERS);
  const user = users.find(u => String(u.username) === String(username) && u.status === 'active');
  if (user) {
    if (String(user.password) === String(password)) return { success: true, user: user };
    else return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
  }
  return { success: false, message: 'ไม่พบผู้ใช้งาน หรือบัญชียังไม่ได้รับการอนุมัติ' };
}

function registerUser(formData) {
  const users = getDbData(TABLES.USERS);
  if (users.some(u => String(u.username) === String(formData.username))) throw new Error('Username นี้ถูกใช้งานแล้ว');
  formData.id = 'USR-' + new Date().getTime(); formData.status = 'pending';
  insertDb(TABLES.USERS, formData); return { success: true };
}

function registerAdminAddedUser(formData) {
  const users = getDbData(TABLES.USERS);
  if (users.some(u => String(u.username) === String(formData.username))) throw new Error('Username นี้ถูกใช้งานแล้ว');
  formData.status = 'active'; insertDb(TABLES.USERS, formData); return { success: true };
}

function updateUser(data) { 
  updateDb(TABLES.USERS, 'username', data.username, { status: data.status, role: data.role, permissions: data.permissions }); 
  return { success: true }; 
}

function addCamera(data) { const pd = processPayloadFiles(data, 'CAM'); insertDb(TABLES.CCTV, pd); return { success: true }; }
function addInventory(data) { const pd = processPayloadFiles(data, 'INV'); insertDb(TABLES.INVENTORY, pd); return { success: true }; }
function addRepair(data) { const pd = processPayloadFiles(data, 'REP'); insertDb(TABLES.REPAIRS, pd); return { success: true }; }
function addClaim(data) { const pd = processPayloadFiles(data, 'CLM'); insertDb(TABLES.CLAIMS, pd); return { success: true }; }
function addBorrow(data) { const pd = processPayloadFiles(data, 'BRW'); insertDb(TABLES.BORROWS, pd); return { success: true }; }
function addInstallation(data) { const pd = processPayloadFiles(data, 'INS'); insertDb(TABLES.INSTALLATIONS, pd); return { success: true }; }

function updateItemStatus(data) {
  if (!data || !data.type) throw new Error("ข้อมูลไม่ครบถ้วน (Missing type)");
  const typeMap = { 'repairs': TABLES.REPAIRS, 'claims': TABLES.CLAIMS, 'borrows': TABLES.BORROWS, 'installations': TABLES.INSTALLATIONS, 'inventory': TABLES.INVENTORY, 'cctv': TABLES.CCTV };
  const sheetName = typeMap[data.type]; 
  if (!sheetName) throw new Error("ไม่พบประเภทรายการ: " + data.type);
  const updatePayload = { ...data }; delete updatePayload.type;
  
  const processedData = processPayloadFiles(updatePayload, data.id.split('-')[0]);
  updateDb(sheetName, 'id', data.id, processedData); return { success: true };
}

function deleteItems(type, idsArray) {
  if (!type) throw new Error("ระบุประเภทที่ต้องการลบไม่ถูกต้อง");
  const typeMap = { 'repairs': TABLES.REPAIRS, 'claims': TABLES.CLAIMS, 'borrows': TABLES.BORROWS, 'installations': TABLES.INSTALLATIONS, 'inventory': TABLES.INVENTORY, 'cctv': TABLES.CCTV, 'notifications': TABLES.NOTIFICATIONS, 'pendingUsers': TABLES.USERS, 'users': TABLES.USERS };
  const sheetName = typeMap[type]; 
  if (!sheetName) throw new Error("ไม่พบประเภทตารางที่ต้องการลบ: " + type);
  if (type === 'pendingUsers' || type === 'users') deleteDbMultiple(sheetName, 'username', idsArray);
  else deleteDbMultiple(sheetName, 'id', idsArray); return { success: true };
}

function addNotification(data) { insertDb(TABLES.NOTIFICATIONS, data); return { success: true }; }

function markNotificationsRead(idsArray) {
  const lock = LockService.getScriptLock(); lock.waitLock(5000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(TABLES.NOTIFICATIONS);
    if (!sheet) return { success: false };
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true };
    
    const headers = data[0];
    const idIndex = headers.indexOf('id'); 
    const statusIndex = headers.indexOf('status'); 
    
    // 🌟 Batch Processing Array
    let isChanged = false;
    for (let i = 1; i < data.length; i++) {
      if (idsArray.includes(String(data[i][idIndex]))) { 
        data[i][statusIndex] = 'read'; 
        isChanged = true;
      }
    }
    
    if (isChanged) {
      sheet.getRange(1, 1, data.length, headers.length).setValues(data);
      SpreadsheetApp.flush();
    }
  } finally { lock.releaseLock(); } 
  return { success: true };
}
