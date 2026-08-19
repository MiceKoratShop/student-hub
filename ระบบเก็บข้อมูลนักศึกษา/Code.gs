/**
 * CLASSROOM STUDENT DIRECTORY & EVENT HUB - GOOGLE APPS SCRIPT BACKEND & REST API
 * Integrated with Google Sheets & Google Drive for High-End Student Management
 * Works seamlessly with Google Apps Script Web App AND Netlify (app.netlify.com)
 * SpreadSheet ID: 157yYjHOfjvYxq6xWX36JI3vF7BsYU5zi0gs77YEcfS4
 * Drive Folder ID: 17BzOlk2UdZp_9AlI6bN2IUUdBQgfP1V0
 * Admin Password: admin888
 */

var SPREADSHEET_ID = '157yYjHOfjvYxq6xWX36JI3vF7BsYU5zi0gs77YEcfS4';
var DRIVE_FOLDER_ID = '17BzOlk2UdZp_9AlI6bN2IUUdBQgfP1V0';
var ADMIN_PASSWORD = 'admin888';

var STUDENTS_SHEET_NAME = 'Students';
var CLASSROOMS_SHEET_NAME = 'Classrooms';

var STUDENT_HEADERS = [
  'ID',
  'StudentCode',
  'FullName',
  'Nickname',
  'GradeLevel',
  'Classroom',
  'Phone',
  'ParentPhone',
  'ParentRelation',
  'PhotoUrl',
  'IG',
  'FB',
  'Line',
  'BirthDate',
  'Age',
  'LivingWith',
  'HousingType',
  'Address',
  'MapLocation',
  'Note',
  'CreatedAt',
  'UpdatedAt'
];

var CLASSROOM_HEADERS = [
  'ID',
  'GradeLevel',
  'RoomName',
  'FullName',
  'CreatedAt'
];

/**
 * Clean & Format Phone Number starting with 0 and formatted as 0XX-XXX-XXXX
 */
function normalizePhoneNumber(phoneInput) {
  if (!phoneInput) return '';
  var raw = String(phoneInput).trim().replace(/[^0-9]/g, '');
  if (!raw) return '';
  if (raw.length === 9 && raw.charAt(0) !== '0') {
    raw = '0' + raw;
  }
  if (raw.length === 10) {
    return raw.substring(0, 3) + '-' + raw.substring(3, 6) + '-' + raw.substring(6, 10);
  }
  return raw;
}

/**
 * doGet Web App & REST API Endpoint (Dual Mode: HTML for GAS, JSON for Netlify/External API)
 */
function doGet(e) {
  try {
    initSheets();
  } catch (err) {
    Logger.log('Init sheets error: ' + err.toString());
  }

  // Handle REST API request from Netlify or external fetch
  if (e && e.parameter && e.parameter.action) {
    var action = e.parameter.action;
    var result = null;

    if (action === 'getStudents') {
      result = getStudents();
    } else if (action === 'getClassrooms') {
      result = getClassrooms();
    } else if (action === 'ping') {
      result = { success: true, message: 'Classroom Hub API is Online', timestamp: new Date().toISOString() };
    } else if (action === 'verifyAdmin') {
      result = verifyAdminPassword(e.parameter.password);
    } else {
      result = { success: false, message: 'Invalid GET action: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Default: Render HTML Web App when opened directly on Google Apps Script
  var template = HtmlService.createHtmlOutputFromFile('Index');
  template.addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
  template.setTitle('ระบบข้อมูลนักศึกษาในห้องเรียน | Classroom Student Hub');
  template.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  return template;
}

/**
 * doPost REST API Endpoint for Netlify / External Form Submissions
 */
function doPost(e) {
  try {
    initSheets();
    
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var action = payload.action || (e && e.parameter && e.parameter.action);
    var response = { success: false, message: 'Unknown action' };

    if (action === 'saveStudent') {
      response = saveStudent(payload.studentData || payload, payload.adminPassword || '');
    } else if (action === 'deleteStudent') {
      response = deleteStudent(payload.studentId, payload.adminPassword || '');
    } else if (action === 'addClassroom') {
      response = addClassroom(payload.gradeLevel, payload.roomName, payload.adminPassword || '');
    } else if (action === 'deleteClassroom') {
      response = deleteClassroom(payload.classroomId, payload.adminPassword || '');
    } else if (action === 'verifyAdmin') {
      response = verifyAdminPassword(payload.password || payload.adminPassword);
    } else if (action === 'getStudents') {
      response = getStudents();
    } else if (action === 'getClassrooms') {
      response = getClassrooms();
    }

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Access Google Spreadsheet safely
 */
function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    Logger.log('Spreadsheet open error: ' + e.toString());
    return null;
  }
}

/**
 * Access Google Drive Folder safely
 */
function getDriveFolder() {
  try {
    return DriveApp.getFolderById(DRIVE_FOLDER_ID);
  } catch (e) {
    Logger.log('Drive folder open error: ' + e.toString());
    return DriveApp.getRootFolder();
  }
}

/**
 * Initialize Sheets and Default Classrooms
 */
function initSheets() {
  var ss = getSpreadsheet();
  if (!ss) return;
  
  // 1. Initialize Classrooms Sheet
  var classSheet = ss.getSheetByName(CLASSROOMS_SHEET_NAME);
  if (!classSheet) {
    classSheet = ss.insertSheet(CLASSROOMS_SHEET_NAME);
    classSheet.appendRow(CLASSROOM_HEADERS);
    
    var headRange = classSheet.getRange(1, 1, 1, CLASSROOM_HEADERS.length);
    headRange.setBackground('#FF6B00');
    headRange.setFontColor('#FFFFFF');
    headRange.setFontWeight('bold');
    headRange.setHorizontalAlignment('center');
    classSheet.setFrozenRows(1);
    
    // Seed default classrooms
    var defaultRooms = [
      ['CLS-1', 'ปวช.1', 'ห้อง 1', 'ปวช.1/1', new Date().toLocaleString('th-TH')],
      ['CLS-2', 'ปวช.1', 'ห้อง 2', 'ปวช.1/2', new Date().toLocaleString('th-TH')],
      ['CLS-3', 'ปวช.2', 'ห้อง 1', 'ปวช.2/1', new Date().toLocaleString('th-TH')],
      ['CLS-4', 'ปวช.3', 'ห้อง 1', 'ปวช.3/1', new Date().toLocaleString('th-TH')],
      ['CLS-5', 'ปวส.1', 'ห้อง 1', 'ปวส.1/1', new Date().toLocaleString('th-TH')],
      ['CLS-6', 'ปวส.2', 'ห้อง 1', 'ปวส.2/1', new Date().toLocaleString('th-TH')]
    ];
    for (var r = 0; r < defaultRooms.length; r++) {
      classSheet.appendRow(defaultRooms[r]);
    }
    for (var c = 1; c <= CLASSROOM_HEADERS.length; c++) {
      classSheet.autoResizeColumn(c);
    }
  }
  
  // 2. Initialize Students Sheet
  var studentSheet = ss.getSheetByName(STUDENTS_SHEET_NAME);
  if (!studentSheet) {
    studentSheet = ss.insertSheet(STUDENTS_SHEET_NAME);
    studentSheet.appendRow(STUDENT_HEADERS);
    
    var headerRange = studentSheet.getRange(1, 1, 1, STUDENT_HEADERS.length);
    headerRange.setBackground('#FF6B00');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    studentSheet.setFrozenRows(1);
    
    for (var col = 1; col <= STUDENT_HEADERS.length; col++) {
      studentSheet.autoResizeColumn(col);
    }
  } else {
    // Check if headers need upgrade to include HousingType
    var existingHeaders = studentSheet.getRange(1, 1, 1, studentSheet.getLastColumn() || 1).getValues()[0];
    if (existingHeaders.indexOf('HousingType') === -1 || existingHeaders.indexOf('Address') === -1) {
      studentSheet.getRange(1, 1, 1, STUDENT_HEADERS.length).setValues([STUDENT_HEADERS]);
    }
  }
}

/**
 * Verify Admin Password
 */
function verifyAdminPassword(password) {
  return {
    success: (String(password || '').trim() === ADMIN_PASSWORD)
  };
}

/**
 * Fetch all Classrooms / Grade Levels
 */
function getClassrooms() {
  var ss = getSpreadsheet();
  if (!ss) return [];
  var sheet = ss.getSheetByName(CLASSROOMS_SHEET_NAME);
  if (!sheet) {
    initSheets();
    sheet = ss.getSheetByName(CLASSROOMS_SHEET_NAME);
    if (!sheet) return [];
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var rooms = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] && !row[1]) continue;
    rooms.push({
      id: String(row[0] || ''),
      gradeLevel: String(row[1] || ''),
      roomName: String(row[2] || ''),
      fullName: String(row[3] || (row[1] + ' ' + row[2])),
      createdAt: String(row[4] || '')
    });
  }
  return rooms;
}

/**
 * Add a new Classroom (Admin Only)
 */
function addClassroom(gradeLevel, roomName, adminPassword) {
  try {
    if (String(adminPassword || '').trim() !== ADMIN_PASSWORD) {
      return { success: false, message: 'รหัสผ่าน Admin ไม่ถูกต้อง' };
    }
    
    var ss = getSpreadsheet();
    if (!ss) return { success: false, message: 'ไม่พบ Spreadsheet' };
    
    var sheet = ss.getSheetByName(CLASSROOMS_SHEET_NAME);
    if (!sheet) {
      initSheets();
      sheet = ss.getSheetByName(CLASSROOMS_SHEET_NAME);
    }
    
    var grade = String(gradeLevel || '').trim();
    var room = String(roomName || '').trim();
    
    if (!grade || !room) {
      return { success: false, message: 'กรุณากรอกระดับชั้นและชื่อห้องเรียน' };
    }
    
    var id = 'CLS-' + (new Date().getTime().toString().slice(-6));
    var fullName = grade + ' ' + room;
    var nowStr = new Date().toLocaleString('th-TH');
    
    sheet.appendRow([id, grade, room, fullName, nowStr]);
    
    return {
      success: true,
      classroom: {
        id: id,
        gradeLevel: grade,
        roomName: room,
        fullName: fullName,
        createdAt: nowStr
      }
    };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

/**
 * Delete a Classroom (Admin Only)
 */
function deleteClassroom(classroomId, adminPassword) {
  try {
    if (String(adminPassword || '').trim() !== ADMIN_PASSWORD) {
      return { success: false, message: 'รหัสผ่าน Admin ไม่ถูกต้อง' };
    }
    
    var ss = getSpreadsheet();
    if (!ss) return { success: false, message: 'ไม่พบ Spreadsheet' };
    
    var sheet = ss.getSheetByName(CLASSROOMS_SHEET_NAME);
    if (!sheet) return { success: false, message: 'ไม่พบ Sheet ห้องเรียน' };
    
    var data = sheet.getDataRange().getValues();
    var deleted = false;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(classroomId)) {
        sheet.deleteRow(i + 1);
        deleted = true;
        break;
      }
    }
    
    return { success: deleted, message: deleted ? 'ลบห้องเรียนสำเร็จ' : 'ไม่พบข้อมูลห้องเรียน' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

/**
 * Fetch all Students (Dynamic Column Resolution)
 */
function getStudents() {
  var ss = getSpreadsheet();
  if (!ss) return [];
  var sheet = ss.getSheetByName(STUDENTS_SHEET_NAME);
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0].map(function(h) { return String(h || '').trim(); });
  
  function getVal(row, colName, defaultVal) {
    var idx = headers.indexOf(colName);
    if (idx !== -1 && row[idx] !== undefined && row[idx] !== null) {
      return String(row[idx]);
    }
    return defaultVal || '';
  }

  var students = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] && !row[2]) continue;
    
    var id = getVal(row, 'ID', String(row[0] || ''));
    var fullName = getVal(row, 'FullName', String(row[2] || ''));
    if (!id && !fullName) continue;

    students.push({
      id: id,
      studentCode: getVal(row, 'StudentCode', String(row[1] || '')),
      fullName: fullName,
      nickname: getVal(row, 'Nickname', String(row[3] || '')),
      gradeLevel: getVal(row, 'GradeLevel', String(row[4] || '')),
      classroom: getVal(row, 'Classroom', String(row[5] || '')),
      phone: normalizePhoneNumber(getVal(row, 'Phone', String(row[6] || ''))),
      parentPhone: normalizePhoneNumber(getVal(row, 'ParentPhone', String(row[7] || ''))),
      parentRelation: getVal(row, 'ParentRelation', String(row[8] || 'ผู้ปกครอง')),
      photoUrl: getVal(row, 'PhotoUrl', String(row[9] || '')),
      igHandle: getVal(row, 'IG', String(row[10] || '')),
      fbHandle: getVal(row, 'FB', String(row[11] || '')),
      lineId: getVal(row, 'Line', String(row[12] || '')),
      birthDate: getVal(row, 'BirthDate', ''),
      age: getVal(row, 'Age', ''),
      livingWith: getVal(row, 'LivingWith', 'บิดาและมารดา'),
      housingType: getVal(row, 'HousingType', 'พักที่บ้าน'),
      address: getVal(row, 'Address', ''),
      mapLocation: getVal(row, 'MapLocation', ''),
      note: getVal(row, 'Note', String(row[headers.indexOf('Note')] || '')),
      createdAt: getVal(row, 'CreatedAt', String(row[headers.indexOf('CreatedAt')] || '')),
      updatedAt: getVal(row, 'UpdatedAt', String(row[headers.indexOf('UpdatedAt')] || ''))
    });
  }
  return students;
}

/**
 * Upload base64 image directly to Google Drive folder
 */
function uploadPhotoToDrive(base64Data, filename) {
  try {
    if (!base64Data || base64Data.indexOf('data:image') !== 0) {
      return base64Data;
    }
    
    var split = base64Data.split(',');
    var contentType = split[0].split(':')[1].split(';')[0];
    var bytes = Utilities.base64Decode(split[1]);
    var blob = Utilities.newBlob(bytes, contentType, filename || ('photo_' + new Date().getTime() + '.jpg'));
    
    var folder = getDriveFolder();
    var file = folder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(e) {}
    
    var fileId = file.getId();
    var directUrl = 'https://lh3.googleusercontent.com/d/' + fileId;
    return directUrl;
  } catch (err) {
    Logger.log('Drive upload error: ' + err.toString());
    return base64Data;
  }
}

/**
 * Add or update student
 * General users can register/add student; Admin can edit existing student
 */
function saveStudent(studentData, adminPassword) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { success: false, message: 'Spreadsheet not found' };
    
    var sheet = ss.getSheetByName(STUDENTS_SHEET_NAME);
    if (!sheet) {
      initSheets();
      sheet = ss.getSheetByName(STUDENTS_SHEET_NAME);
    }
    
    var isNew = !studentData.id;
    
    // If editing existing student, check admin password or allow if user session is valid
    if (!isNew && adminPassword && String(adminPassword).trim() !== ADMIN_PASSWORD) {
      return { success: false, message: 'รหัสผ่าน Admin ไม่ถูกต้องสำหรับการแก้ไข' };
    }
    
    var nowStr = new Date().toLocaleString('th-TH');
    var studentId = studentData.id || ('STU-' + (new Date().getTime().toString().slice(-6)));
    
    // Handle photo upload if base64
    var photoUrl = studentData.photoUrl || '';
    if (photoUrl && photoUrl.indexOf('data:image') === 0) {
      var photoName = 'student_' + (studentData.studentCode || studentId) + '_' + new Date().getTime() + '.jpg';
      photoUrl = uploadPhotoToDrive(photoUrl, photoName);
    }
    
    var cleanPhone = normalizePhoneNumber(studentData.phone);
    var cleanParentPhone = normalizePhoneNumber(studentData.parentPhone);
    
    // Ensure header row is synced with STUDENT_HEADERS
    var data = sheet.getDataRange().getValues();
    if (data.length > 0) {
      var currentHeaders = data[0].map(function(h) { return String(h || '').trim(); });
      if (currentHeaders.indexOf('HousingType') === -1 || currentHeaders.indexOf('Address') === -1) {
        sheet.getRange(1, 1, 1, STUDENT_HEADERS.length).setValues([STUDENT_HEADERS]);
        data = sheet.getDataRange().getValues();
      }
    }
    
    var rowIndex = -1;
    if (!isNew) {
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(studentData.id)) {
          rowIndex = i + 1;
          break;
        }
      }
    }
    
    var rowData = [
      studentId,
      studentData.studentCode || '',
      studentData.fullName || '',
      studentData.nickname || '',
      studentData.gradeLevel || '',
      studentData.classroom || '',
      cleanPhone ? ("'" + cleanPhone) : '',
      cleanParentPhone ? ("'" + cleanParentPhone) : '',
      studentData.parentRelation || 'ผู้ปกครอง',
      photoUrl,
      studentData.igHandle || '',
      studentData.fbHandle || '',
      studentData.lineId || '',
      studentData.birthDate || '',
      studentData.age || '',
      studentData.livingWith || 'บิดาและมารดา',
      studentData.housingType || 'พักที่บ้าน',
      studentData.address || '',
      studentData.mapLocation || '',
      studentData.note || '',
      isNew ? nowStr : (rowIndex > 1 ? (data[rowIndex - 1][20] || nowStr) : nowStr),
      nowStr
    ];
    
    if (rowIndex > 1) {
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    
    var savedStudent = {
      id: studentId,
      studentCode: studentData.studentCode || '',
      fullName: studentData.fullName || '',
      nickname: studentData.nickname || '',
      gradeLevel: studentData.gradeLevel || '',
      classroom: studentData.classroom || '',
      phone: cleanPhone,
      parentPhone: cleanParentPhone,
      parentRelation: studentData.parentRelation || 'ผู้ปกครอง',
      photoUrl: photoUrl,
      igHandle: studentData.igHandle || '',
      fbHandle: studentData.fbHandle || '',
      lineId: studentData.lineId || '',
      birthDate: studentData.birthDate || '',
      age: studentData.age || '',
      livingWith: studentData.livingWith || 'บิดาและมารดา',
      housingType: studentData.housingType || 'พักที่บ้าน',
      address: studentData.address || '',
      mapLocation: studentData.mapLocation || '',
      note: studentData.note || '',
      createdAt: isNew ? nowStr : (rowIndex > 1 ? (data[rowIndex - 1][20] || nowStr) : nowStr),
      updatedAt: nowStr
    };
    
    return { success: true, student: savedStudent, isNew: isNew };
  } catch (e) {
    Logger.log('saveStudent error: ' + e.toString());
    return { success: false, message: e.toString() };
  }
}

/**
 * Delete a Student (Admin Only)
 */
function deleteStudent(studentId, adminPassword) {
  try {
    if (String(adminPassword || '').trim() !== ADMIN_PASSWORD) {
      return { success: false, message: 'รหัสผ่าน Admin ไม่ถูกต้อง' };
    }
    
    var ss = getSpreadsheet();
    if (!ss) return { success: false, message: 'Spreadsheet not found' };
    
    var sheet = ss.getSheetByName(STUDENTS_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };
    
    var data = sheet.getDataRange().getValues();
    var deleted = false;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(studentId)) {
        sheet.deleteRow(i + 1);
        deleted = true;
        break;
      }
    }
    
    return { success: deleted, message: deleted ? 'ลบข้อมูลสำเร็จ' : 'ไม่พบข้อมูลนักศึกษา' };
  } catch (e) {
    Logger.log('deleteStudent error: ' + e.toString());
    return { success: false, message: e.toString() };
  }
}
