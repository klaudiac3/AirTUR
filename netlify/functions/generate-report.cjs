const { google } = require('googleapis');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

// FIX DLA EXIT CODE 2: Ścieżka relatywna do Twojego JEDYNEGO pliku logiki.
// Wychodzimy z folderu 'functions' (..), wychodzimy z 'netlify' (..), wchodzimy do 'src/scripts'
const { getDynamicReportContent } = require('../../src/scripts/raport_logic.cjs');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // 1. PARSOWANIE DANYCH WEJŚCIOWYCH
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    data = querystring.parse(event.body);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const dynamicContent = getDynamicReportContent(data);

  // 2. PRZYGOTOWANIE ZAŁĄCZNIKA PDF
  let attachments = [];
  let pdfStatus = 'BRAK';
  if (data.pdf_base64) {
    try {
      const base64Data = data.pdf_base64.split('base64,').pop();
      attachments.push({
        filename: `Raport_AirTUR_${dynamicContent.reportId}.pdf`,
        content: Buffer.from(base64Data, 'base64'),
        contentType: 'application/pdf'
      });
      pdfStatus = 'WYGENEROWANO';
    } catch (err) {
      console.error("PDF Error:", err);
      pdfStatus = 'BŁĄD';
    }
  }

  try {
    // 3. PANCERNA AUTORYZACJA GOOGLE (Senior Fix dla klucza \n)
    const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
    const formattedKey = rawKey
      .replace(/\\n/g, '\n') // Zamienia tekstowe \n na prawdziwe Entery
      .replace(/"/g, '')     // Usuwa zbędne cudzysłowy
      .trim();               // Usuwa spacje

    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      formattedKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    const sheets = google.sheets({ version: 'v4', auth });

    // 4. ZAPIS DO ARKUSZA GOOGLE - MAPOWANIE 30 KOLUMN (A - AD)
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A:AD',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          new Date().toLocaleString('pl-PL'),                 // A: Czas zapisu
          data.source || 'kalkulator_premium',                // B: Źródło leada
          data.cel || 'raport_wyslany',                       // C: Cel konwersji
          data.imie || '-',                                   // D: Imię
          data.email || '-',                                  // E: E-mail
          data.telefon || '-',                                // F: Telefon
          data.wiadomosc || '-',                              // G: Wiadomość
          data.zgoda || 'TAK',                                // H: Zgoda RODO
          data.wynik_typ_budynku || dynamicContent.buildingType, // I: Budynek
          data.wynik_slonce || dynamicContent.sunFactorLabel, // J: Nasłonecznienie
          data.wynik_ludzie || data.peopleCount || '-',       // K: Liczba osób
          data.wynik_paliwo || "Nieznane",                    // L: Obecne paliwo
          data.wynik_rachunek || "0 zł",                      // M: Obecny rachunek
          data.wynik_komfort || "Standardowy",                // N: Komfort klienta
          data.wynik_metraz || data.area || '-',              // O: Metraż (m²)
          data.wynik_moc || data.calculatedPower || '-',      // P: Obliczona moc (kW)
          data.wynik_cel || dynamicContent.goalLabel || '-',  // Q: Cel (np. Oszczędność)
          data.wynik_oszczednosci || data.savingsYear || '-', // R: Oszczędność/rok
          data.wynik_model || data.modelName || '-',          // S: Rekomendowany model
          dynamicContent.expertExplanation || '-',            // T: Porada eksperta
          data.wynik_metraz || data.area || '-',              // U: Backup Metraż
          data.wynik_moc || data.calculatedPower || '-',      // V: Backup Moc
          data.wynik_cel || dynamicContent.goalLabel || '-',  // W: Backup Cel
          data.wynik_oszczednosci || data.savingsYear || '-', // X: Backup Oszczędność
          data.wynik_model || data.modelName || '-',          // Y: Backup Model
          new Date().toISOString(),                           // Z: Znacznik czasu ISO
          'TAK',                                              // AA: Potwierdzenie wysyłki e-mail
          pdfStatus === 'WYGENEROWANO' ? 'TAK' : 'NIE',       // AB: Czy dołączono PDF
          `Raport_AirTUR_${dynamicContent.reportId}.pdf`,     // AC: Nazwa pliku PDF
          'new'                                               // AD: Status (nowy)
        ]]
      }
    });

    // 5. GENEROWANIE TREŚCI HTML
    const templatePath = path.resolve(process.cwd(), 'src/templates/report-template.html');
    let htmlTemplate = "<h1>Raport AirTUR</h1>"; 
    
    if (fs.existsSync(templatePath)) {
        htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    }

    const finalHtml = htmlTemplate
      .replace(/{{reportId}}/g, dynamicContent.reportId)
      .replace(/{{name}}/g, data.imie || 'Kliencie')
      .replace(/{{goalLabel}}/g, data.wynik_cel || dynamicContent.goalLabel)
      .replace(/{{savingsYear}}/g, data.wynik_oszczednosci || '---');

    // 6. WYSYŁKA EMAIL
    await resend.emails.send({
      from: 'AirTUR <kontakt@airtur.pl>',
      to: [data.email],
      bcc: 'kontakt@airtur.pl',
      subject: `Twoja Osobista Karta Diagnostyczna AirTUR (ID: ${dynamicContent.reportId})`,
      html: finalHtml,
      attachments: attachments
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Sukces", reportId: dynamicContent.reportId })
    };

  } catch (err) {
    console.error("KRYTYCZNY BŁĄD:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};