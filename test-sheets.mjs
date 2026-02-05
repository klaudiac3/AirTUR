import { google } from 'googleapis';
import 'dotenv/config';

async function testConnection() {
    console.log("🚀 Rozpoczynam test połączenia...");

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawKey = process.env.GOOGLE_PRIVATE_KEY;

    // Pancerne czyszczenie klucza - Netlify często "psuje" znaki nowej linii
    const privateKey = rawKey
        ?.replace(/\\n/g, '\n') 
        ?.replace(/^"|"$/g, '') 
        ?.trim();

    try {
        const auth = new google.auth.JWT({
            email: clientEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        console.log("🔑 Logowanie robota...");
        await auth.authorize();
        console.log("✅ Robot zalogowany!");

        const sheets = google.sheets({ version: 'v4', auth });

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'A1',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[new Date().toLocaleString('pl-PL'), 'TEST_NETLIFY', 'Czy to działa? 🚀']]
            },
        });

        console.log("✨ SUKCES! Wiersz dodany do arkusza.");
    } catch (error) {
        console.error("❌ BŁĄD:", error.message);
    }
}

testConnection();