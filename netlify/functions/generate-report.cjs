const { google } = require('googleapis');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

// UWAGA: Zakładam, że plik raport_logic.cjs jest w TYM SAMYM folderze co ta funkcja.
// Jeśli nie - skopiuj go tam, to najbezpieczniejsze rozwiązanie dla Netlify!
const { getDynamicReportContent } = require('./raport_logic.cjs');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // 1. PARSOWANIE DANYCH
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    data = querystring.parse(event.body);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const dynamicContent = getDynamicReportContent(data);

  // 2. OBSŁUGA PDF
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

    // 4. ZAPIS TWOICH 30 KOLUMN (A-AD)
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A:AD',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          new Date().toLocaleString('pl-PL'),                 // A
          data.source || 'kalkulator_premium',                // B
          data.cel || 'raport_wyslany',                       // C
          data.imie || '-',                                   // D
          data.email || '-',                                  // E
          data.telefon || '-',                                // F
          data.wiadomosc || '-',                              // G
          data.zgoda || 'TAK',                                // H
          data.wynik_typ_budynku || dynamicContent.buildingType, // I
          data.wynik_slonce || dynamicContent.sunFactorLabel, // J
          data.wynik_ludzie || data.peopleCount || '-',       // K
          data.wynik_paliwo || "Nieznane",                    // L
          data.wynik_rachunek || "0 zł",                      // M
          data.wynik_komfort || "Standardowy",                // N
          data.wynik_metraz || data.area || '-',              // O
          data.wynik_moc || data.calculatedPower || '-',      // P
          data.wynik_cel || dynamicContent.goalLabel || '-',  // Q
          data.wynik_oszczednosci || data.savingsYear || '-', // R
          data.wynik_model || data.modelName || '-',          // S
          dynamicContent.expertExplanation || '-',            // T
          data.wynik_metraz || data.area || '-',              // U
          data.wynik_moc || data.calculatedPower || '-',      // V
          data.wynik_cel || dynamicContent.goalLabel || '-',  // W
          data.wynik_oszczednosci || data.savingsYear || '-', // X
          data.wynik_model || data.modelName || '-',          // Y
          new Date().toISOString(),                           // Z
          'TAK',                                              // AA
          pdfStatus === 'WYGENEROWANO' ? 'TAK' : 'NIE',       // AB
          `Raport_AirTUR_${dynamicContent.reportId}.pdf`,     // AC
          'new'                                               // AD
        ]]
      }
    });

    // 5. GENEROWANIE TREŚCI HTML
    const templatePath = path.resolve(process.cwd(), 'src/templates/report-template.html');
    let htmlTemplate = "<h1>Raport AirTUR</h1><p>Dziękujemy za kontakt!</p>"; // Fallback
    
    if (fs.existsSync(templatePath)) {
        htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    }

    const finalHtml = htmlTemplate
      .replace(/{{reportId}}/g, dynamicContent.reportId)
      .replace(/{{name}}/g, data.imie || 'Kliencie')
      .replace(/{{goalLabel}}/g, data.wynik_cel || dynamicContent.goalLabel)
      .replace(/{{buildingType}}/g, data.wynik_typ_budynku || dynamicContent.buildingType)
      .replace(/{{area}}/g, data.wynik_metraz || data.area || '---')
      .replace(/{{sunFactorLabel}}/g, dynamicContent.sunFactorLabel)
      .replace(/{{peopleCount}}/g, data.wynik_ludzie || data.peopleCount || '---')
      .replace(/{{currentHeatSource}}/g, data.wynik_paliwo || "Nieznane")
      .replace(/{{calculatedPower}}/g, data.wynik_moc || data.calculatedPower || '---')
      .replace(/{{modelName}}/g, data.wynik_model || data.modelName || 'Model Premium')
      .replace(/{{modelPower}}/g, dynamicContent.modelPower || '3.5')
      .replace(/{{expertExplanation}}/g, dynamicContent.expertExplanation)
      .replace(/{{rejectedPowerClass}}/g, dynamicContent.rejectedPowerClass)
      .replace(/{{savingsYear}}/g, data.wynik_oszczednosci || data.savingsYear || '---')
      .replace(/{{savings5Years}}/g, dynamicContent.savings5Years)
      .replace(/{{savings10Years}}/g, dynamicContent.savings10Years)
      .replace(/{{expertTipDynamic}}/g, dynamicContent.expertTipDynamic)
      .replace(/{{date}}/g, dynamicContent.date);

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