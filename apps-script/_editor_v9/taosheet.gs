function makeSheetBeautiful() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  
  sheets.forEach(function(sheet) {
    if (sheet.getLastRow() > 0 && sheet.getLastColumn() > 0) {
      // Đổi màu thanh tiêu đề sang Xanh Navy đậm sang trọng
      var headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
      headerRange.setBackground("#1e293b")
                 .setFontColor("#ffffff")
                 .setFontWeight("bold")
                 .setHorizontalAlignment("center")
                 .setVerticalAlignment("middle");
      
      sheet.setRowHeight(1, 35); // Cho dòng tiêu đề cao thoáng
      sheet.getBandings().forEach(function(b) { b.remove(); }); // Xóa định dạng cũ
      
      // Kẻ lưới ô đẹp mắt
      var fullRange = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 20), sheet.getLastColumn());
      fullRange.setFontFamily("Roboto")
               .setFontSize(10)
               .setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
    }
  });
  SpreadsheetApp.getUi().alert("✨ Đã trang trí lại Bảng tính thành công!");
}