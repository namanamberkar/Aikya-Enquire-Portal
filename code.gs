const SHEET_NAME = 'Enquiries';

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['ID', 'Date', 'Name', 'Phone', 'Source', 'Guests', 'Check-In', 'Check-Out', 'Property Type', 'Location', 'Message', 'Status']);
    
    // Formatting
    const headerRange = sheet.getRange("1:1");
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f3f4f6");
    sheet.setFrozenRows(1);
    
    // Resize columns
    sheet.setColumnWidth(1, 230); // ID
    sheet.setColumnWidth(2, 140); // Date
    sheet.setColumnWidth(3, 140); // Name
    sheet.setColumnWidth(4, 120); // Phone
    sheet.setColumnWidth(5, 120); // Source
    sheet.setColumnWidth(6, 80);  // Guests
    sheet.setColumnWidth(7, 100); // Check-In
    sheet.setColumnWidth(8, 100); // Check-Out
    sheet.setColumnWidth(9, 100); // Property Type
    sheet.setColumnWidth(10, 100); // Location
    sheet.setColumnWidth(11, 250); // Message
    sheet.setColumnWidth(12, 120); // Status
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      setup();
      sheet = ss.getSheetByName(SHEET_NAME);
    }
    
    const action = e.parameter.action || 'create';
    
    // Status update logic
    if (action === 'update_status') {
      const id = e.parameter.id;
      const status = e.parameter.status;
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const idColIndex = headers.indexOf('ID');
      const statusColIndex = headers.indexOf('Status') + 1; // 1-based index for getRange
      
      if (idColIndex === -1 || statusColIndex === 0) {
        throw new Error("Missing ID or Status columns in sheet.");
      }
      
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][idColIndex] === id) {
          rowIndex = i + 1; // 1-based index
          break;
        }
      }
      
      if (rowIndex !== -1) {
        sheet.getRange(rowIndex, statusColIndex).setValue(status);
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          message: 'Status updated successfully!'
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        throw new Error("Record not found.");
      }
    }
    
    // Create new record logic
    const name = e.parameter.name || '';
    const phone = e.parameter.phone || '';
    const dateInput = e.parameter.date || '';
    const source = e.parameter.source || '';
    const checkInInput = e.parameter.checkIn || '';
    const checkOutInput = e.parameter.checkOut || '';
    const guests = e.parameter.guests || '';
    const propertyType = e.parameter.propertyType || '';
    const location = e.parameter.location || '';
    const message = e.parameter.message || '';
    
    // Generate short ID (e.g., ENQ-1A2B)
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const id = `ENQ-${randomStr}`;
    
    // Helper function to format frontend date (yyyy-mm-dd) to India display (dd-mm-yyyy)
    function formatUiDate(d) {
        if (!d) return '';
        const parts = d.split('-');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return d;
    }

    let dateFormatted = dateInput ? formatUiDate(dateInput) : Utilities.formatDate(new Date(), "Asia/Kolkata", "dd-MM-yyyy");
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = new Array(headers.length).fill('');
    
    const fieldMap = {
      'ID': id,
      'Date': dateFormatted,
      'Name': name,
      'Phone': phone,
      'Source': source,
      'Guests': guests,
      'Check-In': formatUiDate(checkInInput),
      'Check-Out': formatUiDate(checkOutInput),
      'Property Type': propertyType,
      'Location': location,
      'Message': message,
      'Status': 'New'
    };
    
    // Dynamically map to current worksheet headers
    for (let i = 0; i < headers.length; i++) {
      if (fieldMap[headers[i]] !== undefined) {
        newRow[i] = fieldMap[headers[i]];
      }
    }
    
    sheet.appendRow(newRow);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Enquiry saved successfully!',
      record: { id, date: dateFormatted, ...fieldMap }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
     const ss = SpreadsheetApp.getActiveSpreadsheet();
     const sheet = ss.getSheetByName(SHEET_NAME);
     
     if (!sheet) {
       return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          data: []
       })).setMimeType(ContentService.MimeType.JSON);
     }
     
     const data = sheet.getDataRange().getValues();
     const headers = data[0];
     const result = [];
     
     if (data.length > 1) {
       for (let i = 1; i < data.length; i++) {
         const row = data[i];
         const record = {};
         for (let j = 0; j < headers.length; j++) {
            let val = row[j];
            if (val instanceof Date) {
              val = Utilities.formatDate(val, "Asia/Kolkata", "dd-MM-yyyy");
            }
            record[headers[j]] = val;
         }
         result.push(record);
       }
     }
     
     result.reverse(); // Newest first
     
     return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        data: result
     })).setMimeType(ContentService.MimeType.JSON);
     
  } catch (error) {
     return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
     })).setMimeType(ContentService.MimeType.JSON);
  }
}
