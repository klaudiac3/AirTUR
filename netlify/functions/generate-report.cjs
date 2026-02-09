const { google } = require('googleapis');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const data = JSON.parse(event.body);
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // 1. Wyciągamy dane i czyścimy klucz
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    // Naprawa klucza: zamieniamy tekstowe \n na prawdziwe entery
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.split(String.raw`\n`).join('\n').replace(/^"|"$/g, '').trim();

    // 2. Prosta autoryzacja - identyczna jak w Twoim udanym teście
    const auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    // 3. Zapis do arkusza (wywalamy skomplikowaną logikę, piszemy prosto)
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          new Date().toLocaleString('pl-PL'),
          data.source || 'kontakt',
          data.cel || 'formularz',
          data.imie || '-',
          data.email || '-',
          data.telefon || '-',
          data.wiadomosc || '-',
          data.zgoda || 'TAK'
        ]]
      },
    });

    // 4. Wysyłka maila (tylko jeśli email jest podany)
    if (data.email) {
        await resend.emails.send({
          from: 'AirTUR <kontakt@airtur.pl>',
          to: [data.email],
          subject: 'Dziękujemy za kontakt - AirTUR',
          html: `<p>Witaj ${data.imie}, otrzymaliśmy Twoje zapytanie.</p>`
        });
    }

    return { statusCode: 200, body: JSON.stringify({ message: "Sukces" }) };

  } catch (err) {
    console.error("❌ BŁĄD:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};