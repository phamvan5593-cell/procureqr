var VAT_FOLDER_ID = "14-gWx5bo7VP2YFAKs96j2fxKavCIsFrX"; 

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ContentService.createTextOutput(JSON.stringify({ 
    status: "success", 
    pr: getSheetData(ss.getSheetByName("PR")), 
    po: getSheetData(ss.getSheetByName("PO")), 
    inventory: getSheetData(ss.getSheetByName("TonKho")),
    exportHistory: getSheetData(ss.getSheetByName("LichSuXuatKho"))
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var payload = JSON.parse(contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. LƯU ĐƠN PR MỚI
    if (payload.type === "SAVE_PR" && payload.data) {
      var sheetPR = ss.getSheetByName("PR") || ss.insertSheet("PR");
      checkHeaders(sheetPR, ["Mã PR", "Người Đề Xuất", "Công Ty", "Tên Máy", "Tên Vật Tư", "Mã Part", "Số Lượng", "Lý Do", "Ngày Tạo", "Trạng Thái", "Người Duyệt", "Thời Gian Duyệt"]);
      var d = payload.data;
      sheetPR.appendRow([d.id, d.requester, d.company, d.machine, d.itemName, d.partNo, d.qty, d.reason, d.date, d.status, "", ""]);
    }

    // 2. DUYỆT PR TỪ ADMIN
    if (payload.type === "APPROVE_PR" && payload.id) {
      var sheetPR = ss.getSheetByName("PR");
      if (sheetPR) {
        var data = sheetPR.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          if (data[i][0] == payload.id) {
            sheetPR.getRange(i + 1, 10).setValue("Đã Duyệt");
            sheetPR.getRange(i + 1, 11).setValue(payload.approver || "TPKT");
            sheetPR.getRange(i + 1, 12).setValue(payload.approvedTime || new Date().toLocaleString("vi-VN"));
            break;
          }
        }
      }
    }

    // 3. XUẤT KHO & LƯU LỊCH SỬ BẢO HÀNH
    if (payload.type === "EXPORT_STOCK" && payload.data) {
      var sheetHistory = ss.getSheetByName("LichSuXuatKho") || ss.insertSheet("LichSuXuatKho");
      checkHeaders(sheetHistory, ["Mã Part", "Tên Linh Kiện", "Số Lượng", "Công Ty", "Tên Máy", "Thời Gian Xuất", "Số Tháng BH", "Hạn Bảo Hành", "Người Xuất"]);
      var h = payload.data;
      sheetHistory.appendRow([h.partNo, h.itemName, h.qty, h.company, h.machine, h.exportTime, h.warrantyMonths, h.warrantyExpireDate, h.exporter]);
    }

    // 4. UPLOAD FILE HÓA ĐƠN VAT
    if (payload.type === "UPLOAD_VAT_FILE" && payload.fileData) {
      var folder = DriveApp.getFolderById(VAT_FOLDER_ID);
      var blob = Utilities.newBlob(Utilities.base64Decode(payload.fileData), payload.mimeType, payload.fileName);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      var fileUrl = file.getUrl();

      var sheetPO = ss.getSheetByName("PO");
      if (sheetPO) {
        var data = sheetPO.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          if (data[i][0] == payload.poId) {
            sheetPO.getRange(i + 1, 10).setValue(fileUrl);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", fileUrl: fileUrl })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function checkHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
}

function getSheetData(sheet) {
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) { obj[headers[j]] = data[i][j]; }
    result.push(obj);
  }
  return result;
}