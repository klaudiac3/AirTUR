import { google } from 'googleapis';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import querystring from 'querystring';
import { getDynamicReportContent } from '../../src/scripts/raport_logic.js';

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // 1. PARSOWANIE DANYCH (JSON lub Formularz)
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    data = querystring.parse(event.body);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const dynamicContent = getDynamicReportContent(data);

  // 2. OBSŁUGA PDF (Base64 -> Buffer)
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
      console.error("Błąd dekodowania PDF:", err);
      pdfStatus = 'BŁĄD';
    }
  }

  try {
    // 3. AUTORYZACJA GOOGLE
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    const sheets = google.sheets({ version: 'v4', auth });

    // 4. ZAPIS WSZYSTKICH 30 KOLUMN (A-AD)
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A:AD',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          new Date().toLocaleString('pl-PL'),                 // A: Timestamp
          data.source || 'kalkulator_premium',                // B: Source
          data.cel || 'raport_wyslany',                       // C: Cel
          data.imie || '-',                                   // D: Imie
          data.email || '-',                                  // E: Email
          data.telefon || '-',                                // F: Telefon
          data.wiadomosc || '-',                              // G: Wiadomosc
          data.zgoda || 'TAK',                                // H: Zgoda
          data.wynik_typ_budynku || dynamicContent.buildingType, // I: Typ Budynku
          data.wynik_slonce || dynamicContent.sunFactorLabel, // J: Nasłonecznienie
          data.wynik_ludzie || data.peopleCount || '-',       // K: Liczba Osób
          data.wynik_paliwo || "Nieznane",                    // L: Obecne Ciepło
          data.wynik_rachunek || "0 zł",                      // M: Rachunek
          data.wynik_komfort || "Standardowy",                // N: Komfort
          data.wynik_metraz || data.area || '-',              // O: Metraż
          data.wynik_moc || data.calculatedPower || '-',      // P: Moc
          data.wynik_cel || dynamicContent.goalLabel || '-',  // Q: Cel
          data.wynik_oszczednosci || data.savingsYear || '-', // R: Oszczędność
          data.wynik_model || data.modelName || '-',          // S: Model
          dynamicContent.expertExplanation || '-',            // T: Wyjaśnienie
          data.wynik_metraz || data.area || '-',              // U: PDF Backup Metraż
          data.wynik_moc || data.calculatedPower || '-',      // V: PDF Backup Moc
          data.wynik_cel || dynamicContent.goalLabel || '-',  // W: PDF Backup Cel
          data.wynik_oszczednosci || data.savingsYear || '-', // X: PDF Backup Oszczędność
          data.wynik_model || data.modelName || '-',          // Y: PDF Backup Model
          new Date().toISOString(),                           // Z: Generated At
          'TAK',                                              // AA: Email Sent
          pdfStatus === 'WYGENEROWANO' ? 'TAK' : 'NIE',       // AB: PDF Sent
          `Raport_AirTUR_${dynamicContent.reportId}.pdf`,     // AC: Filename
          'new'                                               // AD: Status
        ]]
      }
    });

    // 5. GENEROWANIE TREŚCI HTML Z TWOJEGO SZABLONU
    const templatePath = path.resolve(process.cwd(), 'src/templates/report-template.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    
    const finalHtml = htmlTemplate
      .replace(/{{reportId}}/g, dynamicContent.reportId)
      .replace(/{{name}}/g, data.imie || 'Kliencie')
      .replace(/{{goalLabel}}/g, data.wynik_cel || dynamicContent.goalLabel)
      .replace(/{{buildingType}}/g, data.wynik_typ_budynku || dynamicContent.buildingType)
      .replace(/{{area}}/g, data.wynik_metraz || data.area || '---')
      .replace(/{{sunFactorLabel}}/g, data.wynik_slonce || dynamicContent.sunFactorLabel)
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

    // 6. WYSYŁKA EMAIL (Klient + BCC do Ciebie)
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
    console.error("Błąd krytyczny funkcji:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};