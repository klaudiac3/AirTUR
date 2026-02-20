// src/pages/api/send-form.ts
import type { APIRoute } from 'astro';
import { google } from 'googleapis';
import { Resend } from 'resend';
// @ts-ignore
import { getDynamicReportContent } from '../../scripts/raport_logic.js';
// @ts-ignore
import htmlTemplate from '../../templates/report-template.html?raw'; 
// @ts-ignore
import { companyConfig } from '../../data/companyConfig.js';
import { generateReportPdf } from '../../utils/generatePdf';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ message: "API ŻYJE" }), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    console.log(`📥 NOWE ZGŁOSZENIE | Źródło: ${data.source} | Cel: ${data.cel}`);

    const spreadsheetId = import.meta.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEET_ID;
    const clientEmail = import.meta.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawKey = import.meta.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY;
    const resendKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    
    // Używamy bezpiecznego dostępu do emaila kontaktowego
    const ADMIN_EMAIL = companyConfig.contact?.email || 'kontakt@airtur.pl'; 

    const isCalculator = data.source && data.source.includes('kalkulator');
    let dynamicContent: any = {};

    let rowValues: any[] = [];
    let recipients: string[] = [];
    let emailSubject = '';
    let finalHtml = '';
    let attachments: any[] = [];
    let pdfBase64: string | null = null;

    if (isCalculator) {
        if (data.email) recipients.push(data.email);
        recipients.push(ADMIN_EMAIL);

        // Generowanie treści dynamicznych (logika z models.js i nowego raport_logic.js)
        dynamicContent = getDynamicReportContent(data);

        // Generowanie PDF
        try {
            console.log("⚙️ Generowanie pliku PDF...");
            const pdfUint8 = await generateReportPdf(data, dynamicContent);
            const pdfBuffer = Buffer.from(pdfUint8);
            
            attachments.push({
                filename: `Raport_AirTUR_${dynamicContent.reportId}.pdf`,
                content: pdfBuffer,
            });

            pdfBase64 = pdfBuffer.toString('base64');
            console.log("✅ PDF gotowy do wysyłki i pobrania.");

        } catch (err) {
            console.error("❌ Błąd generowania PDF (kontynuuję bez załącznika):", err);
        }

        emailSubject = `Twoja Osobista Karta Diagnostyczna AirTUR (ID: ${dynamicContent.reportId})`;
        
        // 🔥 WSTRZYKIWANIE DANYCH DO SZABLONU HTML MAILA
        finalHtml = htmlTemplate
            // 1. Dane firmy
            .replace(/{{companyName}}/g, companyConfig.fullName || companyConfig.name || 'AirTUR')
            .replace(/{{companyAddress}}/g, companyConfig.address?.full || 'Zarzecze 9, 33-390 Łącko')
            .replace(/{{companyEmail}}/g, companyConfig.contact?.email || 'kontakt@airtur.pl')
            .replace(/{{companyPhone}}/g, companyConfig.contact?.phoneFull || '+48 508 485 790')
            .replace(/{{companyNip}}/g, companyConfig.nip || '---')
            
            // 2. Sekcja Hero i Cele
            .replace(/{{heroHeadline}}/g, dynamicContent.heroHeadline || 'Analiza Inwestycyjna AirTUR')
            .replace(/{{heroDesc}}/g, dynamicContent.heroDesc || '')
            .replace(/{{roiPsychology}}/g, dynamicContent.roiPsychology || '')
            
            // 3. Karta Parametrów
            .replace(/{{reportId}}/g, dynamicContent.reportId)
            .replace(/{{date}}/g, dynamicContent.date)
            .replace(/{{name}}/g, data.imie || 'Kliencie')
            .replace(/{{buildingType}}/g, dynamicContent.buildingType)
            .replace(/{{area}}/g, data.wynik_metraz || data.area)
            .replace(/{{sunFactorLabel}}/g, dynamicContent.sunFactorLabel)
            .replace(/{{peopleCount}}/g, data.wynik_ludzie || data.peopleCount)
            .replace(/{{currentHeatSource}}/g, dynamicContent.currentHeatSource)
            
            // 4. Diagnoza Mocy i Ekspert (Dla wybranego modelu)
            .replace(/{{modelPower}}/g, dynamicContent.modelPower)
            .replace(/{{modelName}}/g, dynamicContent.modelName)
            .replace(/{{expertExplanation}}/g, dynamicContent.expertExplanation || '-') 
            .replace(/{{rejectionText}}/g, dynamicContent.rejectionText || '-')
            .replace(/{{expertTipDynamic}}/g, dynamicContent.expertTipDynamic || '-')
            
            // 5. 🔥 TABELA 3 MODELI W MAILU (Wypełniamy zmiennymi wyeksportowanymi z raport_logic.js)
            .replace(/{{ecoName}}/g, dynamicContent.modelEco?.name || 'Model Ekonomiczny')
            .replace(/{{ecoEnergy}}/g, dynamicContent.modelEco?.energy_class || '-')
            .replace(/{{ecoNoise}}/g, dynamicContent.modelEco?.noise || '-')
            .replace(/{{ecoFilter}}/g, dynamicContent.modelEco?.filter || '-')

            .replace(/{{smartName}}/g, dynamicContent.modelSmart?.name || 'Model Optymalny')
            .replace(/{{smartEnergy}}/g, dynamicContent.modelSmart?.energy_class || '-')
            .replace(/{{smartNoise}}/g, dynamicContent.modelSmart?.noise || '-')
            .replace(/{{smartFilter}}/g, dynamicContent.modelSmart?.filter || '-')

            .replace(/{{premiumName}}/g, dynamicContent.modelPremium?.name || 'Model Premium')
            .replace(/{{premiumEnergy}}/g, dynamicContent.modelPremium?.energy_class || '-')
            .replace(/{{premiumNoise}}/g, dynamicContent.modelPremium?.noise || '-')
            .replace(/{{premiumFilter}}/g, dynamicContent.modelPremium?.filter || '-')
            
            // 6. Finanse
            .replace(/{{savingsYear}}/g, dynamicContent.savingsYear)
            .replace(/{{savings5Years}}/g, dynamicContent.savings5Years)
            .replace(/{{savings10Years}}/g, dynamicContent.savings10Years);


        // Tworzymy czytelny ciąg tekstowy dla arkusza (Kolumna AA)
        const wszystkieModele = `ECO: ${dynamicContent.modelEco?.name || '-'} | SMART: ${dynamicContent.modelSmart?.name || '-'} | PREMIUM: ${dynamicContent.modelPremium?.name || '-'}`;
        
        // Zapis do kolumny AG - Jasna informacja dla handlowca co do wariantu klienta
        const wybranyTierText = (data.wynik_wybrany_tier || 'smart').toUpperCase();
        const wybranyZapisId = `${wybranyTierText} (${dynamicContent.modelName})`;

        // Wiersz do arkusza (PEŁNY ZAKRES A:AG)
        rowValues = [
            new Date().toLocaleString('pl-PL'),                     // A: Timestamp
            data.source,                                            // B: Source
            data.cel || 'raport_wyslany',                           // C: Cel
            data.imie,                                              // D: Imie
            data.email,                                             // E: Email
            data.telefon || '-',                                    // F: Telefon
            '-',                                                    // G: Wiadomosc
            data.zgoda ? 'TAK' : 'NIE',                             // H: Zgoda
            // DANE TECHNICZNE
            data.wynik_typ_budynku || dynamicContent.buildingType,  // I
            data.wynik_slonce || dynamicContent.sunFactorLabel,     // J
            data.wynik_ludzie || data.peopleCount,                  // K
            data.wynik_paliwo || "Nieznane",                        // L
            data.wynik_rachunek || "0 zł",                          // M
            data.wynik_komfort || "Standardowy",                    // N
            data.wynik_metraz || data.area,                         // O
            data.wynik_moc || data.calculatedPower,                 // P
            data.wynik_cel || dynamicContent.goalLabel,             // Q
            // FINANSE
            data.wynik_oszczednosci || data.savingsYear,            // R
            data.wynik_oszczednosci_5 || dynamicContent.savings5Years || '-', // S
            data.wynik_oszczednosci_10 || dynamicContent.savings10Years || '-', // T
            // MODELE I OPIS
            wszystkieModele,                                        // U: Zestaw 3 zaoferowanych modeli (zastępuje 1 model)
            data.expertExplanation || dynamicContent.expertExplanation || '-', // V: Opis Eksperta
            // BACKUP PDF
            data.wynik_metraz || data.area,                         // W
            data.wynik_moc || data.calculatedPower,                 // X
            data.wynik_cel || dynamicContent.goalLabel,             // Y
            data.wynik_oszczednosci || data.savingsYear,            // Z
            wszystkieModele,                                        // AA: Ponowny zapis zestawu 3 modeli
            // SYSTEMOWE
            new Date().toISOString(),                               // AB: pdf_generated_at
            true,                                                   // AC: email_sent
            true,                                                   // AD: pdf_sent
            `Raport_AirTUR_${dynamicContent.reportId}.pdf`,         // AE: Filename
            'new',                                                  // AF: Status
            wybranyZapisId                                          // AG: 🔥 WYBRANY WARIANT (np. ECO (Gree Amber))
        ];

    } else {
        // SCENARIUSZ B: ZWYKŁY KONTAKT / ZGŁOSZENIE BEZ KALKULATORA
        recipients.push(ADMIN_EMAIL); 

        emailSubject = `🔥 NOWY LEAD: ${data.cel || 'Kontakt'} - ${data.imie}`;
        finalHtml = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; max-width: 600px;">
                <h2 style="color: #d32f2f;">Nowe zgłoszenie: ${data.cel || 'Formularz'}</h2>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
                    <p><strong>Imię:</strong> ${data.imie}</p>
                    <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
                    <p><strong>Telefon:</strong> <a href="tel:${data.telefon}">${data.telefon}</a></p>
                    <p><strong>Źródło:</strong> ${data.source}</p>
                </div>
                <h3>Treść wiadomości:</h3>
                <p style="padding: 10px; border-left: 4px solid #d32f2f; background: #fff;">${data.wiadomosc || 'Brak treści'}</p>
            </div>
        `;

        rowValues = [
            new Date().toLocaleString('pl-PL'),                     // A
            data.source || 'formularz_www',                         // B
            data.cel || 'kontakt',                                  // C
            data.imie || '-',                                       // D
            data.email || '-',                                      // E
            data.telefon || '-',                                    // F
            data.wiadomosc || '-',                                  // G
            data.zgoda ? 'TAK' : 'NIE',                             // H
            // PUSTE DANE TECHNICZNE
            '-', '-', '-', '-', '-', '-', '-', '-', '-', 
            '-', '-', '-', '-', '-', '-', '-', '-', '-', '-',
            '-',    // AB
            false,  // AC
            false,  // AD
            '-',    // AE
            'new',  // AF
            '-'     // AG (Brak)
        ];
    }

    const privateKey = rawKey?.replace(/\\n/g, '\n')?.replace(/^"|"$/g, '')?.trim();
    
    const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Zapisujemy nowy zakres do arkusza
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'A:AG', 
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rowValues] },
    });

    if (resendKey && recipients.length > 0) {
        const resend = new Resend(resendKey);
        await resend.emails.send({
            from: 'AirTUR <kontakt@airtur.pl>',
            to: recipients,
            subject: emailSubject,
            html: finalHtml,
            attachments: attachments
        });
    }

    return new Response(JSON.stringify({ 
        message: "Sukces", 
        reportId: dynamicContent?.reportId || null,
        pdfBase64: pdfBase64 
    }), { status: 200 });

  } catch (error: any) {
    console.error("❌ BŁĄD API:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};