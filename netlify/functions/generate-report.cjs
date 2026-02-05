const { google } = require('googleapis');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const { getDynamicReportContent } = require('../../src/scripts/raport_logic.cjs');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  let data;
  try { data = JSON.parse(event.body); } catch (e) { data = querystring.parse(event.body); }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const dynamicContent = getDynamicReportContent(data);

  try {
    // 1. PRZYGOTOWANIE POŚWIADCZEŃ
    const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
    const formattedKey = rawKey.replace(/\\n/g, '\n').replace(/^"|"$/g, '').trim();
    const clientEmail = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim();
    const spreadsheetId = (process.env.GOOGLE_SHEET_ID || '').trim();

    // 2. TWORZYMY OBIEKT AUTORYZACJI
    const auth = new google.auth.JWT(
      clientEmail,
      null,
      formattedKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    // 3. WAŻNE: Wymuszamy pobranie tokena (to sprawdza czy klucz jest OK)
    console.log("🔑 Generowanie tokena dostępu...");
    await auth.getAccessToken();
    console.log("✅ Token wygenerowany pomyślnie!");

    const sheets = google.sheets({ version: 'v4' });

    // 4. ZAPIS DO ARKUSZA (Przekazujemy 'auth' bezpośrednio tutaj!)
    await sheets.spreadsheets.values.append({
      auth: auth, // <--- TO JEST KLUCZ DO SUKCESU
      spreadsheetId: spreadsheetId,
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
          data.pdf_base64 ? 'TAK' : 'NIE',                   // AB
          `Raport_AirTUR_${dynamicContent.reportId}.pdf`,     // AC
          'new'                                               // AD
        ]]
      }
    });

    // 5. WYSYŁKA EMAIL
    let attachments = [];
    if (data.pdf_base64) {
      attachments.push({
        filename: `Raport_AirTUR_${dynamicContent.reportId}.pdf`,
        content: Buffer.from(data.pdf_base64.split('base64,').pop(), 'base64'),
        contentType: 'application/pdf'
      });
    }

    const templatePath = path.resolve(process.cwd(), 'src/templates/report-template.html');
    let htmlTemplate = "<h1>Raport AirTUR</h1>"; 
    if (fs.existsSync(templatePath)) htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    const finalHtml = htmlTemplate
      .replace(/{{reportId}}/g, dynamicContent.reportId)
      .replace(/{{name}}/g, data.imie || 'Kliencie')
      .replace(/{{goalLabel}}/g, data.wynik_cel || dynamicContent.goalLabel)
      .replace(/{{savingsYear}}/g, data.wynik_oszczednosci || '---');

    await resend.emails.send({
      from: 'AirTUR <kontakt@airtur.pl>',
      to: [data.email],
      bcc: 'kontakt@airtur.pl',
      subject: `Twoja Karta Diagnostyczna AirTUR (ID: ${dynamicContent.reportId})`,
      html: finalHtml,
      attachments: attachments
    });

    console.log("✅ SUKCES TOTALNY!");
    return { statusCode: 200, body: JSON.stringify({ message: "Sukces" }) };

  } catch (err) {
    console.error("❌ BŁĄD:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};