const { google } = require('googleapis');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const { getDynamicReportContent } = require('../../src/scripts/raport_logic.js');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  // 1. INTELIGENTNE PARSOWANIE DANYCH (JSON lub FORMULARZ)
  let data;
  try {
      // Próbujemy jako JSON
      data = JSON.parse(event.body);
  } catch (e) {
      // Jeśli nie JSON, to parsujemy jako formularz (x-www-form-urlencoded)
      // To kluczowe, bo Konwersja.astro wysyła dane w ten sposób
      data = querystring.parse(event.body);
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // 2. URUCHAMIAMY MÓZG RAPORTU (Logika backendowa)
  const dynamicContent = getDynamicReportContent(data);

  try {
    // 3. WPIS DO GOOGLE SHEETS
    const auth = new google.auth.JWT(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        null,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/spreadsheets']
    );
    const sheets = google.sheets({ version: 'v4', auth });
    
    // ZAPISUJEMY DANE ZGODNIE Z TWOJĄ NOWĄ STRUKTURĄ KOLUMN (A-AD)
    await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'A:AD',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[
                new Date().toLocaleString('pl-PL'),         // A: Timestamp
                data.source || 'kalkulator_premium',        // B: Source
                'raport_wyslany',                           // C: Cel
                data.imie,                                  // D: Imie
                data.email,                                 // E: Email
                data.telefon || '-',                        // F: Telefon
                '',                                         // G: Wiadomosc (Puste techniczne)
                'TAK',                                      // H: Zgoda
                data.wynik_typ_budynku || dynamicContent.buildingType, // I: Typ Budynku
                data.wynik_slonce || dynamicContent.sunFactorLabel,    // J: Nasłonecznienie
                data.wynik_ludzie || data.peopleCount,      // K: Liczba Osób
                data.wynik_paliwo || "Nieznane",            // L: Obecne Ciepło (NOWE)
                data.wynik_rachunek || "0 zł",              // M: Rachunek (NOWE)
                data.wynik_komfort || "Standardowy",        // N: Komfort (NOWE)
                data.wynik_metraz || data.area,             // O: Metraż
                data.wynik_moc || data.calculatedPower,     // P: Moc
                data.wynik_cel || dynamicContent.goalLabel, // Q: Cel
                data.wynik_oszczednosci || data.savingsYear,// R: Oszczędność
                data.wynik_model || data.modelName,         // S: Model
                data.expertExplanation,                     // T: Wyjaśnienie
                // Pola PDF (kopia dla backupu)
                data.wynik_metraz || data.area,             // U
                data.wynik_moc || data.calculatedPower,     // V
                data.wynik_cel || dynamicContent.goalLabel, // W
                data.wynik_oszczednosci || data.savingsYear,// X
                data.wynik_model || data.modelName,         // Y
                new Date().toISOString(),                   // Z: Generated At
                'TAK',                                      // AA: Email Sent
                'TAK',                                      // AB: PDF Sent
                `Raport_AirTUR_${dynamicContent.reportId}.pdf`, // AC: Filename
                'new'                                       // AD: Status
            ]]
        }
    });

    // 4. GENEROWANIE TREŚCI HTML DO PDF/MAILA
    let htmlTemplate = fs.readFileSync(path.resolve(__dirname, '../../src/templates/report-template.html'), 'utf8');
    
    // Podmieniamy tagi na dane (priorytet mają dane z formularza 'wynik_xxx')
    const finalHtml = htmlTemplate
        .replace(/{{reportId}}/g, dynamicContent.reportId)
        .replace(/{{name}}/g, data.imie)
        .replace(/{{goalLabel}}/g, data.wynik_cel || dynamicContent.goalLabel)
        .replace(/{{buildingType}}/g, data.wynik_typ_budynku || dynamicContent.buildingType)
        .replace(/{{area}}/g, data.wynik_metraz || data.area)
        .replace(/{{sunFactorLabel}}/g, data.wynik_slonce || dynamicContent.sunFactorLabel)
        .replace(/{{peopleCount}}/g, data.wynik_ludzie || data.peopleCount)
        
        // NOWE POLA W RAPORCIE
        .replace(/{{currentHeatSource}}/g, data.wynik_paliwo || "Nieznane") 
        
        .replace(/{{calculatedPower}}/g, data.wynik_moc || data.calculatedPower)
        .replace(/{{modelName}}/g, data.wynik_model || data.modelName)
        // Pola obliczane przez raport_logic.js
        .replace(/{{modelPower}}/g, dynamicContent.modelPower || '3.5') 
        .replace(/{{expertExplanation}}/g, dynamicContent.expertExplanation)
        .replace(/{{rejectedPowerClass}}/g, dynamicContent.rejectedPowerClass)
        .replace(/{{savingsYear}}/g, data.wynik_oszczednosci || data.savingsYear)
        .replace(/{{savings5Years}}/g, dynamicContent.savings5Years)
        .replace(/{{savings10Years}}/g, dynamicContent.savings10Years)
        .replace(/{{expertTipDynamic}}/g, dynamicContent.expertTipDynamic)
        .replace(/{{date}}/g, dynamicContent.date);

    // 5. WYSYŁKA PRZEZ RESEND
    await resend.emails.send({
        from: 'AirTUR <kontakt@airtur.pl>',
        to: [data.email],
        subject: `Twoja Osobista Karta Diagnostyczna AirTUR (ID: ${dynamicContent.reportId})`,
        html: finalHtml
    });

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Sukces", reportId: dynamicContent.reportId })
    };

  } catch (err) {
    console.error("Critical Error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};