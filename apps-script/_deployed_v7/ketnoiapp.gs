function doGet(e) {
  var action = e ? e.parameter.action : "";
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var prData = getSheetData(ss.getSheetByName("PR"));
  var poData = getSheetData(ss.getSheetByName("PO"));
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success", pr: prData, po: poData }))
                       .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var payload = JSON.parse(contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. GHI ĐƠN PR MỚI VÀO SHEET
    if (payload.type === "SAVE_PR" && payload.data) {
      var sheetPR = ss.getSheetByName("PR");
      if (!sheetPR) sheetPR = ss.insertSheet("PR");
      
      if (sheetPR.getLastRow() === 0) {
        sheetPR.appendRow(["Mã PR", "Người Đề Xuất", "Tên Vật Tư", "Mã Part", "Số Lượng", "Lý Do", "Ngày Tạo", "Trạng Thái", "Người Duyệt", "Thời Gian Duyệt"]);
      }
      var d = payload.data;
      sheetPR.appendRow([d.id, d.requester, d.itemName, d.partNo, d.qty, d.reason, d.date, d.status, "", ""]);
    }

    // 2. TPKT DUYỆT ĐƠN PR -> CẬP NHẬT TRẠNG THÁI & TỰ SINH ĐƠN PO SANG TAB PO
    if (payload.type === "APPROVE_PR" && payload.id) {
      var sheetPR = ss.getSheetByName("PR");
      if (sheetPR) {
        var data = sheetPR.getDataRange().getValues();
        
        // Đảm bảo có cột Người Duyệt & Thời Gian Duyệt
        if (data[0].length < 10) {
          sheetPR.getRange(1, 9, 1, 2).setValues([["Người Duyệt", "Thời Gian Duyệt"]]);
        }
        
        for (var i = 1; i < data.length; i++) {
          if (data[i][0] == payload.id) {
            // Cập nhật vết duyệt bên Sheet PR
            sheetPR.getRange(i + 1, 8).setValue("Đã Duyệt");
            sheetPR.getRange(i + 1, 9).setValue(payload.approver || "Trưởng phòng Kỹ Thuật (TPKT)");
            sheetPR.getRange(i + 1, 10).setValue(payload.approvedTime || new Date().toLocaleString("vi-VN"));
            
            // Tự động ghi 1 dòng sang Tab PO
            var sheetPO = ss.getSheetByName("PO");
            if (!sheetPO) sheetPO = ss.insertSheet("PO");
            if (sheetPO.getLastRow() === 0) {
              sheetPO.appendRow(["Mã PO", "Mã PR", "Nhà Cung Cấp", "Vật Tư", "Số Lượng", "Đơn Giá VAT", "Thành Tiền", "Ngày Tạo PO", "Trạng Thái"]);
            }
            var poId = "PO-" + payload.id.replace("PR-", "");
            sheetPO.appendRow([poId, payload.id, "Chưa chọn NCC", data[i][2], data[i][4], 0, 0, new Date().toLocaleDateString("vi-VN"), "Chờ phát hành"]);
            break;
          }
        }
      }
    }

    // 3. LỆNH XÓA ĐƠN PR
    if (payload.type === "DELETE_PR" && payload.id) {
      var sheetPR = ss.getSheetByName("PR");
      if (sheetPR) {
        var data = sheetPR.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          if (data[i][0] == payload.id) {
            sheetPR.deleteRow(i + 1);
            break;
          }
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetData(sheet) {
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  return result;
}