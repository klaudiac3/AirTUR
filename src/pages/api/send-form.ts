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
// @ts-ignore
import { generateReportPdf } from '../../utils/generatePdf';

// ============================================================
// 🛡️ UTILS: SECURITY & RESILIENCE (Netlify / Serverless Ready)
// ============================================================

const ipRequestCounts = new Map<string, { count: number, timestamp: number }>();
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS_PER_WINDOW = 5;

// FIX: Poprawna mapa i typowanie dla TypeScript
const escapeHtml = (str: string) => {
    if (!str) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(str).replace(/[&<>"']/g, (m) => map[m as keyof typeof map] || m);
};

const withTimeout = <T>(promise: Promise<T>, ms = 8000): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout API po ${ms}ms`)), ms))
    ]);
};

// ============================================================
// 🚀 ENDPOINTY API
// ============================================================

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ message: "API ŻYJE" }), { status: 200 });
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let pdfBase64: string | null = null;
  const ipRaw = request.headers.get('x-forwarded-for') || clientAddress || 'unknown-ip';
  const ip = ipRaw.split(',')[0].trim(); // FIX: Bierzemy tylko pierwsze IP z łańcucha proxy

  try {
    // --- 1. OCHRONA PRZED DoS (Rozmiar payloadu) ---
    const contentLength = request.headers.get('content-length');
    if (contentLength && Number(contentLength) > 100_000) { // Limit ~100KB
        console.warn(JSON.stringify({ level: "warn", msg: "Payload too large", ip }));
        return new Response(JSON.stringify({ error: "Zbyt duży rozmiar danych." }), { status: 413 });
    }

    // --- 2. ZABEZPIECZENIE PRZED CRASHEM (Invalid JSON) ---
    let rawData;
    try {
        rawData = await request.json();
    } catch (e) {
        console.error(JSON.stringify({ level: "error", msg: "Invalid JSON format", ip }));
        return new Response(JSON.stringify({ error: "Nieprawidłowy format danych." }), { status: 400 });
    }

    // --- 3. ENV CHECKS (Fail Fast) ---
    const spreadsheetId = import.meta.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEET_ID;
    const clientEmail = import.meta.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawKey = import.meta.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY;
    const resendKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    
    if (!spreadsheetId || !clientEmail || !rawKey || !resendKey) {
        throw new Error("Brak kluczy środowiskowych (ENV)!");
    }

    // --- 4. ZABEZPIECZENIE PRZED SPAMEM (Rate Limit + GC) ---
    const now = Date.now();
    if (Math.random() < 0.05) { 
        for (const [key, data] of ipRequestCounts.entries()) {
            if (now - data.timestamp > RATE_LIMIT_WINDOW) ipRequestCounts.delete(key);
        }
    }

    const ipData = ipRequestCounts.get(ip);
    if (ipData && (now - ipData.timestamp < RATE_LIMIT_WINDOW)) {
        if (ipData.count >= MAX_REQUESTS_PER_WINDOW) {
            console.warn(JSON.stringify({ level: "warn", msg: "Rate limit exceeded", ip }));
            return new Response(JSON.stringify({ error: "Zbyt wiele zapytań. Spróbuj ponownie za minutę." }), { status: 429 });
        }
        ipData.count++;
    } else {
        ipRequestCounts.set(ip, { count: 1, timestamp: now });
    }

    if (rawData.b_website) {
        console.warn(JSON.stringify({ level: "info", msg: "Bot złapany w honeypot", ip }));
        return new Response(JSON.stringify({ message: "Sukces" }), { status: 200 }); 
    }

    // --- 5. WALIDACJA BACKENDOWA ---
    const allowedSources = ['narzedzia_kalkulator_raport_email', 'narzedzia_kalkulator_raport_telefon', 'oferta_montaz_email', 'oferta_montaz_telefon', 'formularz_www', 'oferta_serwis_email', 'oferta_serwis_telefon', 'strona_kontaktowa_glowna'];
    if (rawData.source && !allowedSources.includes(rawData.source)) {
        console.warn(JSON.stringify({ level: "warn", msg: "Nieznane źródło formularza", source: rawData.source, ip }));
        rawData.source = 'nieznane_zrodlo'; // Zamiast rzucać błędem, flagujemy dla handlowca
    }

    if (!rawData.imie || rawData.imie.trim().length < 2) throw new Error("Nieprawidłowe imię.");
    
    // FIX: Email injection protection
    const safeEmail = rawData.email ? rawData.email.replace(/[\r\n]/g, '').trim() : '';
    if (safeEmail !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) {
        throw new Error("Nieprawidłowy adres e-mail.");
    }

    // FIX: Walidacja telefonu
    if (rawData.telefon) {
        const phoneDigits = rawData.telefon.replace(/\D/g, '');
        if (phoneDigits.length > 0 && phoneDigits.length < 9) throw new Error("Nieprawidłowy numer telefonu.");
    }

    // Zostawiamy dane nie-escapowane dla Arkusza, usuwamy tylko nadmiarowe spacje
    const data: any = {};
    for (const [key, value] of Object.entries(rawData)) {
        data[key] = typeof value === 'string' ? value.trim() : value;
    }
    data.email = safeEmail; // Używamy oczyszczonego maila

    // STRUCTURED LOGGING
    console.log(JSON.stringify({ level: "info", msg: "NOWE ZGŁOSZENIE", source: data.source, cel: data.cel, ip }));

    const ADMIN_EMAIL = companyConfig.contact?.email || 'kontakt@airtur.pl'; 
    const isCalculator = data.source && data.source.includes('kalkulator');
    let dynamicContent: any = {};

    let rowValues: any[] = [];
    let recipients: string[] = [];
    let emailSubject = '';
    let finalHtml = '';
    let attachments: any[] = [];

    if (isCalculator) {
        if (data.email && data.email !== '') recipients.push(data.email);
        recipients.push(ADMIN_EMAIL);

        dynamicContent = getDynamicReportContent(data);

        // FIX: Timeout dla PDF (Max 15 sekund na generację, by uniknąć zawieszenia funkcji serverless)
        try {
            console.log(JSON.stringify({ level: "info", msg: "Generowanie pliku PDF..." }));
            const pdfUint8 = await withTimeout(generateReportPdf(data, dynamicContent), 15000);
            const pdfBuffer = Buffer.from(pdfUint8);
            
            attachments.push({
                filename: `Raport_AirTUR_${dynamicContent.reportId}.pdf`,
                content: pdfBuffer,
            });

            pdfBase64 = pdfBuffer.toString('base64');
            console.log(JSON.stringify({ level: "info", msg: "PDF wygenerowany pomyślnie" }));
        } catch (err: any) {
            console.error(JSON.stringify({ level: "error", msg: "Błąd generowania PDF", error: err.message }));
        }

        emailSubject = `Twoja Osobista Karta Diagnostyczna AirTUR (ID: ${dynamicContent.reportId})`;
        
        // Helper: zabezpiecza przed wypisaniem "undefined" i chroni przed XSS (Tylko dla e-maila HTML)
        const sHtml = (val: any, fallback = '-') => (val !== undefined && val !== null && val !== '') ? escapeHtml(String(val)) : fallback;
        const sVal = (val: any, fallback = '-') => (val !== undefined && val !== null && val !== '') ? String(val) : fallback;


        // 🔥 Wstrzykiwanie dynamicznego CTA w zależności od wyboru klienta
        let dynamicNextStepsHtml = '';
        
        if (data.cel === 'chce_wycene') {
            dynamicNextStepsHtml = `
                <div style="text-align:center; padding-top:10px;">
                    <p style="font-size:16px; font-weight:800; color:#0AB3C6; margin-bottom:10px;">Co dalej?</p>
                    <p style="font-size:14px; color:#3A4149; margin-bottom:20px; line-height: 1.6;">
                        Twój raport znajduje się w załączniku tej wiadomości. <br>W kolejnym e-mailu nasz inżynier prześle Ci <strong>szczegółową wycenę</strong>.<br><br>
                        W międzyczasie zapraszamy do naszej <a href="https://airtur.pl/baza-wiedzy/?utm_source=raport_pdf&utm_medium=email" style="color:#0AB3C6; font-weight:bold; text-decoration:underline;">Bazy Wiedzy</a>, gdzie znajdziesz odpowiedzi na najczęstsze pytania.
                    </p>
                </div>
            `;
        } else {
            dynamicNextStepsHtml = `
                <div style="text-align:center; padding-top:10px;">
                    <p style="font-size:14px; font-weight:700; color:#3A4149; margin-bottom:15px;">W załączniku znajdziesz pełny Raport w formacie PDF.</p>
                    <a href="https://airtur.pl/kontakt/?utm_source=raport_pdf&utm_medium=email" class="btn">ZAMÓW BEZPŁATNĄ WYCENĘ</a>
                </div>
            `;
        }
// 🔥 WSTRZYKNIĘCIE TABELI LUB BANERA MULTI SPLIT
        let modelsComparisonHtml = '';
        if (dynamicContent.isMultisplit) {
            modelsComparisonHtml = `
            <div style="background-color: #212529; border-top: 4px solid #0AB3C6; padding: 25px; border-radius: 8px; margin-bottom: 25px; text-align: center; color: white;">
                <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #0AB3C6; text-transform: uppercase;">Wymagany Projekt Indywidualny</h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #E2E8F0;">
                    Twój budynek wymaga zaawansowanego systemu Multi Split (kilka jednostek wewnątrz). Standardowe, pojedyncze modele nie zapewnią odpowiedniego komfortu, dlatego nasi inżynierowie przygotują dla Ciebie dedykowaną koncepcję instalacji.
                </p>
            </div>`;
        } else {
            modelsComparisonHtml = `
            <h3 style="margin:0 0 15px 0; font-size:16px; font-weight:800; color:#212529; text-align:center;">Porównanie Rekomendowanych Modeli</h3>
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;" role="presentation">
                <tr>
                    <td class="model-col" style="background-color: #F6F7FA;">
                        <span class="model-badge badge-eco">ECO</span>
                        <p class="model-name">{{ecoName}}</p>
                        <p class="spec-label">Klasa / Energia</p>
                        <p class="spec-val">{{ecoEnergy}}</p>
                        <p class="spec-label">Głośność</p>
                        <p class="spec-val">{{ecoNoise}}</p>
                        <p class="spec-label">Filtry</p>
                        <p class="spec-val" style="margin-bottom: 0;">{{ecoFilter}}</p>
                    </td>
                    <td class="model-col" style="background-color: #FFFFFF; border-top: 3px solid #0AB3C6; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <span class="model-badge badge-smart">SMART</span>
                        <p class="model-name" style="color: #0AB3C6;">{{smartName}}</p>
                        <p class="spec-label">Klasa / Energia</p>
                        <p class="spec-val">{{smartEnergy}}</p>
                        <p class="spec-label">Głośność</p>
                        <p class="spec-val">{{smartNoise}}</p>
                        <p class="spec-label">Filtry</p>
                        <p class="spec-val" style="margin-bottom: 0;">{{smartFilter}}</p>
                    </td>
                    <td class="model-col" style="background-color: #212529; border-top: 3px solid #0A3876;">
                        <span class="model-badge badge-premium">PREMIUM</span>
                        <p class="model-name" style="color: #FFFFFF;">{{premiumName}}</p>
                        <p class="spec-label" style="color: #A0AEC0;">Klasa / Energia</p>
                        <p class="spec-val" style="color: #E2E8F0;">{{premiumEnergy}}</p>
                        <p class="spec-label" style="color: #A0AEC0;">Głośność</p>
                        <p class="spec-val" style="color: #E2E8F0;">{{premiumNoise}}</p>
                        <p class="spec-label" style="color: #A0AEC0;">Filtry</p>
                        <p class="spec-val" style="color: #E2E8F0; margin-bottom: 0;">{{premiumFilter}}</p>
                    </td>
                </tr>
            </table>`;
        }

        finalHtml = htmlTemplate
            .replace(/{{modelsComparisonArea}}/g, modelsComparisonHtml)
            .replace(/{{dynamicNextSteps}}/g, dynamicNextStepsHtml)
            .replace(/{{companyName}}/g, sHtml(companyConfig.fullName || companyConfig.name, 'AirTUR'))
            .replace(/{{companyAddress}}/g, sHtml(companyConfig.address?.full, 'Zarzecze 9, 33-390 Łącko'))
            .replace(/{{companyEmail}}/g, sHtml(companyConfig.contact?.email, 'kontakt@airtur.pl'))
            .replace(/{{companyPhone}}/g, sHtml(companyConfig.contact?.phoneFull, '+48 508 485 790'))
            .replace(/{{companyNip}}/g, sHtml(companyConfig.nip, '---'))
            .replace(/{{heroHeadline}}/g, sHtml(dynamicContent.heroHeadline, 'Analiza Inwestycyjna AirTUR'))
            .replace(/{{heroDesc}}/g, sHtml(dynamicContent.heroDesc, ''))
            .replace(/{{roiPsychology}}/g, sHtml(dynamicContent.roiPsychology, ''))
            .replace(/{{reportId}}/g, sVal(dynamicContent.reportId))
            .replace(/{{date}}/g, sVal(dynamicContent.date))
            .replace(/{{name}}/g, sHtml(data.imie, 'Kliencie'))
            .replace(/{{buildingType}}/g, sHtml(dynamicContent.buildingType))
            .replace(/{{area}}/g, sHtml(data.wynik_metraz || data.area))
            .replace(/{{sunFactorLabel}}/g, sHtml(dynamicContent.sunFactorLabel))
            .replace(/{{peopleCount}}/g, sHtml(data.wynik_ludzie || data.peopleCount))
            .replace(/{{currentHeatSource}}/g, sHtml(dynamicContent.currentHeatSource))
            .replace(/{{modelPower}}/g, sVal(dynamicContent.modelPower))
            .replace(/{{modelName}}/g, sHtml(dynamicContent.modelName))
            .replace(/{{expertExplanation}}/g, sHtml(dynamicContent.expertExplanation)) 
            .replace(/{{rejectionText}}/g, sHtml(dynamicContent.rejectionText))
            .replace(/{{expertTipDynamic}}/g, sHtml(dynamicContent.expertTipDynamic))
            .replace(/{{selectionLabel}}/g, sHtml(dynamicContent.selectionLabel, 'Twój wstępny wybór:'))
            .replace(/{{ecoName}}/g, sHtml(dynamicContent.modelEco?.name, 'Model Ekonomiczny'))
            .replace(/{{ecoEnergy}}/g, sHtml(dynamicContent.modelEco?.energy_class))
            .replace(/{{ecoNoise}}/g, sHtml(dynamicContent.modelEco?.noise))
            .replace(/{{ecoFilter}}/g, sHtml(dynamicContent.modelEco?.filter))
            .replace(/{{smartName}}/g, sHtml(dynamicContent.modelSmart?.name, 'Model Optymalny'))
            .replace(/{{smartEnergy}}/g, sHtml(dynamicContent.modelSmart?.energy_class))
            .replace(/{{smartNoise}}/g, sHtml(dynamicContent.modelSmart?.noise))
            .replace(/{{smartFilter}}/g, sHtml(dynamicContent.modelSmart?.filter))
            .replace(/{{premiumName}}/g, sHtml(dynamicContent.modelPremium?.name, 'Model Premium'))
            .replace(/{{premiumEnergy}}/g, sHtml(dynamicContent.modelPremium?.energy_class))
            .replace(/{{premiumNoise}}/g, sHtml(dynamicContent.modelPremium?.noise))
            .replace(/{{premiumFilter}}/g, sHtml(dynamicContent.modelPremium?.filter))
            .replace(/{{savingsYear}}/g, sHtml(dynamicContent.savingsYear))
            .replace(/{{savings5Years}}/g, sHtml(dynamicContent.savings5Years))
            .replace(/{{savings10Years}}/g, sHtml(dynamicContent.savings10Years));

        const wszystkieModele = dynamicContent.isMultisplit 
            ? "MULTI SPLIT (Wymagana wycena indywidualna)" 
            : `ECO: ${dynamicContent.modelEco?.name || '-'} | SMART: ${dynamicContent.modelSmart?.name || '-'} | PREMIUM: ${dynamicContent.modelPremium?.name || '-'}`;
        
        let wybranyZapisId = "NIE WYBRANO";
        if (data.wynik_wybrany_tier && data.wynik_wybrany_tier !== "") {
            const wybranyTierText = data.wynik_wybrany_tier.toUpperCase();
            const nazwaModelu = data.wynik_model && data.wynik_model !== "" ? data.wynik_model : dynamicContent.modelName;
            wybranyZapisId = `${wybranyTierText} (${nazwaModelu})`;
        }

        // TWORZENIE ZAPISU DO ARKUSZA (CZYSTE DANE bez HTML escape)
        rowValues = [
            new Date().toLocaleString('pl-PL'),                     // A: Timestamp
            data.source,                                            // B: Source
            data.cel || 'raport_wyslany',                           // C: Cel
            data.imie,                                              // D: Imie
            data.email || '-',                                      // E: Email
            data.telefon || '-',                                    // F: Telefon
            '-',                                                    // G: Wiadomosc
            data.zgoda ? 'TAK' : 'NIE',                             // H: Zgoda
            data.wynik_typ_budynku || dynamicContent.buildingType,  // I
            data.wynik_slonce || dynamicContent.sunFactorLabel,     // J
            data.wynik_ludzie || data.peopleCount,                  // K
            data.wynik_paliwo || "Nieznane",                        // L
            data.wynik_rachunek || "0 zł",                          // M
            data.wynik_komfort || "Standardowy",                    // N
            data.wynik_metraz || data.area,                         // O
            data.wynik_moc || data.calculatedPower,                 // P
            data.wynik_cel || dynamicContent.goalLabel,             // Q
            data.wynik_oszczednosci || data.savingsYear,            // R
            data.wynik_oszczednosci_5 || dynamicContent.savings5Years || '-', // S
            data.wynik_oszczednosci_10 || dynamicContent.savings10Years || '-', // T
            wszystkieModele,                                        // U: Zestaw 3 modeli
            data.expertExplanation || dynamicContent.expertExplanation || '-', // V: Opis Eksperta
            data.wynik_metraz || data.area,                         // W
            data.wynik_moc || data.calculatedPower,                 // X
            data.wynik_cel || dynamicContent.goalLabel,             // Y
            data.wynik_oszczednosci || data.savingsYear,            // Z
            wszystkieModele,                                        // AA: Ponowny zapis zestawu 3 modeli
            new Date().toISOString(),                               // AB: pdf_generated_at
            true,                                                   // AC: email_sent
            pdfBase64 ? true : false,                               // AD: pdf_sent
            `Raport_AirTUR_${dynamicContent.reportId || 'Nowy'}.pdf`,// AE: Filename
            'new',                                                  // AF: Status
            wybranyZapisId                                          // AG: WYBRANY WARIANT
        ];

    } else {
        // SCENARIUSZ B: ZWYKŁY KONTAKT
        recipients.push(ADMIN_EMAIL); 

        emailSubject = `🔥 NOWY LEAD: ${escapeHtml(data.cel) || 'Kontakt'} - ${escapeHtml(data.imie)}`;
        finalHtml = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; max-width: 600px;">
                <h2 style="color: #d32f2f;">Nowe zgłoszenie: ${escapeHtml(data.cel) || 'Formularz'}</h2>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
                    <p><strong>Imię:</strong> ${escapeHtml(data.imie)}</p>
                    <p><strong>Email:</strong> <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email) || '-'}</a></p>
                    <p><strong>Telefon:</strong> <a href="tel:${escapeHtml(data.telefon)}">${escapeHtml(data.telefon) || '-'}</a></p>
                    <p><strong>Źródło:</strong> ${escapeHtml(data.source)}</p>
                </div>
                <h3>Treść wiadomości:</h3>
                <p style="padding: 10px; border-left: 4px solid #d32f2f; background: #fff;">${escapeHtml(data.wiadomosc) || 'Brak treści'}</p>
            </div>
        `;

        rowValues = [
            new Date().toLocaleString('pl-PL'), data.source || 'formularz_www', data.cel || 'kontakt', 
            data.imie, data.email || '-', data.telefon || '-', data.wiadomosc || '-', data.zgoda ? 'TAK' : 'NIE',
            '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', 
            new Date().toISOString(), false, false, '-', 'new', '-'
        ];
    }

    const privateKey = rawKey.replace(/\\n/g, '\n').replace(/^"|"$/g, '').trim();
    
    const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const saveToSheetsTask = sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'A1', // FIX: Bezpieczny zakres, Arkusz znajdzie ostatni wiersz automatycznie
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rowValues] },
    });

    // FIX: Zabezpieczenie attachments w Resend
    const sendEmailTask = async () => {
        if (recipients.length > 0) {
            const resend = new Resend(resendKey);
            await resend.emails.send({
                from: 'AirTUR <kontakt@airtur.pl>',
                to: recipients,
                subject: emailSubject,
                html: finalHtml,
                ...(attachments.length > 0 && { attachments }) // Dodajemy tylko gdy nie puste
            });
        }
    };

    // Wykonanie równoległe z Timeoutami
    const [sheetsResult, emailResult] = await Promise.allSettled([
        withTimeout(saveToSheetsTask, 8000),
        withTimeout(sendEmailTask(), 8000)
    ]);

    if (sheetsResult.status === 'rejected') console.error(JSON.stringify({ level: "error", msg: "Błąd Google Sheets", reason: sheetsResult.reason }));
    if (emailResult.status === 'rejected') console.error(JSON.stringify({ level: "error", msg: "Błąd Resend", reason: emailResult.reason }));

    return new Response(JSON.stringify({ 
        message: "Sukces", 
        reportId: dynamicContent?.reportId || null,
        pdfBase64: pdfBase64 
    }), { status: 200 });

  } catch (error: any) {
    console.error(JSON.stringify({ level: "error", msg: "BŁĄD KONTROLERA", error: error.message }));
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};