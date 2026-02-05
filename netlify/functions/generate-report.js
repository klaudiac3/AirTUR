const { google } = require('googleapis');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const { getDynamicReportContent } = require('../../src/scripts/raport_logic.js');

exports.handler = async (event) => {
  // 0. Walidacja metody HTTP
  if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
  }

  // 1. INTELIGENTNE PARSOWANIE DANYCH
  let data;
  try {
      data = JSON.parse(event.body);
  } catch (e) {
      data = querystring.parse(event.body);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  
  // Logika biznesowa raportu (działa zawsze, nawet dla zwykłego kontaktu zwróci domyślne wartości)
  const dynamicContent = getDynamicReportContent(data);

  // 2. PRZETWARZANIE PDF (Jeśli został przesłany)
  let attachments = [];
  let pdfStatus = 'BRAK';

  if (data.pdf_base64) {
      try {
          const base64Data = data.pdf_base64.split('base64,').pop();
          const pdfBuffer = Buffer.from(base64Data, 'base64');
          
          attachments.push({
              filename: `Raport_AirTUR_${dynamicContent.reportId}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
          });
          pdfStatus = 'WYGENEROWANO';
      } catch (pdfError) {
          console.error("Błąd przetwarzania PDF:", pdfError);
          pdfStatus = 'BŁĄD_DANYCH';
      }
  }

  // Zmienne do śledzenia statusu operacji
  let googleSheetStatus = 'PENDING';
  let emailStatus = 'PENDING';
  let logs = []; // Zbieramy błędy do logów

  // 3. OPERACJA A: ZAPIS DO GOOGLE SHEETS (Izolowana)
  try {
    const auth = new google.auth.JWT(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        null,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/spreadsheets']
    );
    const sheets = google.sheets({ version: 'v4', auth });
    
    await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'A:AD',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[
                new Date().toLocaleString('pl-PL'),                 // A: Timestamp
                data.source || 'nieznane',                          // B: Source
                data.cel || 'kontakt',                              // C: Cel
                data.imie || '-',                                   // D: Imie
                data.email || '-',                                  // E: Email
                data.telefon || '-',                                // F: Telefon
                data.wiadomosc || '-',                              // G: Wiadomosc
                data.zgoda || 'TAK',                                // H: Zgoda
                data.wynik_typ_budynku || '-',                      // I
                data.wynik_slonce || '-',                           // J
                data.wynik_ludzie || '-',                           // K
                data.wynik_paliwo || '-',                           // L
                data.wynik_rachunek || '-',                         // M
                data.wynik_komfort || '-',                          // N
                data.wynik_metraz || '-',                           // O
                data.wynik_moc || '-',                              // P
                data.wynik_cel || '-',                              // Q
                data.wynik_oszczednosci || '-',                     // R
                data.wynik_model || '-',                            // S
                dynamicContent.expertExplanation || '-',            // T
                // Dane PDF (kopia)
                data.wynik_metraz || '-',                           // U
                data.wynik_moc || '-',                              // V
                data.wynik_cel || '-',                              // W
                data.wynik_oszczednosci || '-',                     // X
                data.wynik_model || '-',                            // Y
                new Date().toISOString(),                           // Z
                'PENDING',                                          // AA (Email status - wstępnie)
                pdfStatus,                                          // AB
                pdfStatus === 'WYGENEROWANO' ? `Raport_${dynamicContent.reportId}.pdf` : '-', // AC
                'new'                                               // AD
            ]]
        }
    });
    googleSheetStatus = 'SUCCESS';
  } catch (sheetErr) {
    console.error("Google Sheets Error:", sheetErr);
    googleSheetStatus = 'FAILED';
    logs.push(`Sheets error: ${sheetErr.message}`);
  }

  // 4. OPERACJA B: WYSYŁKA EMAIL (Izolowana)
  try {
    // Generowanie HTML
    let htmlTemplate = fs.readFileSync(path.resolve(__dirname, '../../src/templates/report-template.html'), 'utf8');
    
    const finalHtml = htmlTemplate
        .replace(/{{reportId}}/g, dynamicContent.reportId)
        .replace(/{{name}}/g, data.imie || 'Kliencie')
        .replace(/{{goalLabel}}/g, data.wynik_cel || dynamicContent.goalLabel)
        .replace(/{{buildingType}}/g, data.wynik_typ_budynku || dynamicContent.buildingType)
        .replace(/{{area}}/g, data.wynik_metraz || data.area)
        .replace(/{{sunFactorLabel}}/g, data.wynik_slonce || dynamicContent.sunFactorLabel)
        .replace(/{{peopleCount}}/g, data.wynik_ludzie || data.peopleCount)
        .replace(/{{currentHeatSource}}/g, data.wynik_paliwo || "Nieznane") 
        .replace(/{{calculatedPower}}/g, data.wynik_moc || data.calculatedPower)
        .replace(/{{modelName}}/g, data.wynik_model || data.modelName)
        .replace(/{{modelPower}}/g, dynamicContent.modelPower || '3.5') 
        .replace(/{{expertExplanation}}/g, dynamicContent.expertExplanation)
        .replace(/{{rejectedPowerClass}}/g, dynamicContent.rejectedPowerClass)
        .replace(/{{savingsYear}}/g, data.wynik_oszczednosci || data.savingsYear)
        .replace(/{{savings5Years}}/g, dynamicContent.savings5Years)
        .replace(/{{savings10Years}}/g, dynamicContent.savings10Years)
        .replace(/{{expertTipDynamic}}/g, dynamicContent.expertTipDynamic)
        .replace(/{{date}}/g, dynamicContent.date);

    // Wysyłka
    await resend.emails.send({
        from: 'AirTUR <kontakt@airtur.pl>',
        to: [data.email],
        bcc: 'kontakt@airtur.pl', // KOPIA ZAPASOWA DLA CIEBIE
        subject: `Twoja Osobista Karta Diagnostyczna AirTUR (ID: ${dynamicContent.reportId})`,
        html: finalHtml,
        attachments: attachments
    });
    emailStatus = 'SUCCESS';

  } catch (emailErr) {
    console.error("Email Error:", emailErr);
    emailStatus = 'FAILED';
    logs.push(`Email error: ${emailErr.message}`);
  }

  // 5. PODSUMOWANIE I ODPOWIEDŹ DLA FRONTENDU
  // Jeśli wszystko padło -> Błąd 500
  if (googleSheetStatus === 'FAILED' && emailStatus === 'FAILED') {
      return {
          statusCode: 500,
          body: JSON.stringify({ error: "Critical failure. Both Sheets and Email failed.", details: logs })
      };
  }

  // Jeśli chociaż jedno zadziałało -> Sukces 200 (żeby nie straszyć klienta)
  return {
      statusCode: 200,
      body: JSON.stringify({ 
          message: "Process completed", 
          sheets: googleSheetStatus, 
          email: emailStatus,
          reportId: dynamicContent.reportId
      })
  };
};