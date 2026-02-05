const { google } = require('googleapis');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

// Pobieranie logiki raportu
const { getDynamicReportContent } = require('../../src/scripts/raport_logic.cjs');

exports.handler = async (event) => {
  // 1. TYLKO POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // 2. PARSOWANIE DANYCH WEJŚCIOWYCH
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    data = querystring.parse(event.body);
  }

  // Konfiguracja Resend
  const resend = new Resend(process.env.RESEND_API_KEY);
  const dynamicContent = getDynamicReportContent(data);

  // 3. DIAGNOSTYKA (WIDOCZNA W LOGACH NETLIFY)
  console.log("🔍 --- DIAGNOSTYKA START ---");
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  console.log("- Klucz obecny?:", !!rawKey, rawKey ? `(Długość: ${rawKey.length})` : "(BRAK)");
  console.log("- Email robota:", process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "(BRAK)");
  console.log("- ID arkusza:", process.env.GOOGLE_SHEET_ID || "(BRAK)");
  console.log("🔍 --- DIAGNOSTYKA KONIEC ---");

  // 4. PRZYGOTOWANIE ZAŁĄCZNIKA PDF
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
      console.error("❌ Błąd PDF:", err.message);
      pdfStatus = 'BŁĄD';
    }
  }

  try {
    // 5. PANCERNA NAPRAWA KLUCZA PRYWATNEGO (Specjalnie pod Netlify i \n)
    const formattedKey = rawKey
      .replace(/\\n/g, '\n')     // Zamiana tekstowych \n na fizyczne entery
      .replace(/^"|"$/g, '')    // Usunięcie ewentualnych cudzysłowów
      .trim();

    if (!formattedKey.includes("BEGIN PRIVATE KEY")) {
      throw new Error("Klucz prywatny jest nieprawidłowy (brak nagłówka BEGIN)!");
    }

    // Używamy formatu obiektowego JWT - najbardziej odporny na błędy serwerowe
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      formattedKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    // 6. ZAPIS DO ARKUSZA GOOGLE (MAPOWANIE 30 KOLUMN A-AD)
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
          data.wynik_metraz || data.area || '-',              // U (Backup)
          data.wynik_moc || data.calculatedPower || '-',      // V (Backup)
          data.wynik_cel || dynamicContent.goalLabel || '-',  // W (Backup)
          data.wynik_oszczednosci || data.savingsYear || '-', // X (Backup)
          data.wynik_model || data.modelName || '-',          // Y (Backup)
          new Date().toISOString(),                           // Z
          'TAK',                                              // AA
          pdfStatus === 'WYGENEROWANO' ? 'TAK' : 'NIE',       // AB
          `Raport_AirTUR_${dynamicContent.reportId}.pdf`,     // AC
          'new'                                               // AD
        ]]
      }
    });

    // 7. PRZYGOTOWANIE TREŚCI HTML Z SZABLONU
    const templatePath = path.resolve(process.cwd(), 'src/templates/report-template.html');
    let htmlTemplate = "<h1>Raport AirTUR</h1><p>Dziękujemy za kontakt!</p>"; 
    
    if (fs.existsSync(templatePath)) {
        htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    }

    const finalHtml = htmlTemplate
      .replace(/{{reportId}}/g, dynamicContent.reportId)
      .replace(/{{name}}/g, data.imie || 'Kliencie')
      .replace(/{{goalLabel}}/g, data.wynik_cel || dynamicContent.goalLabel)
      .replace(/{{savingsYear}}/g, data.wynik_oszczednosci || '---');

    // 8. WYSYŁKA E-MAILA PRZEZ RESEND
    await resend.emails.send({
      from: 'AirTUR <kontakt@airtur.pl>',
      to: [data.email],
      bcc: 'kontakt@airtur.pl',
      subject: `Twoja Karta Diagnostyczna AirTUR (ID: ${dynamicContent.reportId})`,
      html: finalHtml,
      attachments: attachments
    });

    console.log("✅ SUKCES: Robot Google dopisał wiersz, Resend wysłał maila!");

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Sukces", reportId: dynamicContent.reportId })
    };

  } catch (err) {
    console.error("❌ KRYTYCZNY BŁĄD FUNKCJI:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};