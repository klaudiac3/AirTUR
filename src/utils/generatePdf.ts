// src/utils/generatePdf.ts
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import { companyConfig } from '../data/companyConfig.js';

const hex2rgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
};

const c = {
    dark: hex2rgb('#2D3748'),
    primary: hex2rgb('#0AB3C6'),
    primaryLight: hex2rgb('#F0FDFF'),
    red: hex2rgb('#C53030'),
    redLight: hex2rgb('#FFF5F5'),
    green: hex2rgb('#059669'),
    gray: hex2rgb('#718096'),
    lightGray: hex2rgb('#E2E8F0'),
    white: rgb(1, 1, 1),
    orange: hex2rgb('#D97706'),
    orangeLight: hex2rgb('#FFFBEB')
};

export async function generateReportPdf(data: any, dynamicContent: any) {
    const pdfDoc = await PDFDocument.create();
    let fontRegular: any, fontBold: any;
    let usePolishChars = false;
    let logoImage: any = null;

    // --- ŁADOWANIE CZCIONEK I LOGO (PNG) ---
    try {
        pdfDoc.registerFontkit(fontkit);
        const fontsDir = path.resolve(process.cwd(), 'public/fonts');
        const regPath = path.join(fontsDir, 'Roboto-Regular.ttf');
        const boldPath = path.join(fontsDir, 'Roboto-Bold.ttf');

        if (fs.existsSync(regPath) && fs.existsSync(boldPath)) {
            fontRegular = await pdfDoc.embedFont(fs.readFileSync(regPath));
            fontBold = await pdfDoc.embedFont(fs.readFileSync(boldPath));
            usePolishChars = true; 
        } else {
            throw new Error('Brak lokalnych plików fontów.');
        }

        // 🔥 SZUKAMY LOGO.PNG
        const logoPath = path.resolve(process.cwd(), 'public/logo.png');
        if (fs.existsSync(logoPath)) {
            const logoBytes = fs.readFileSync(logoPath);
            logoImage = await pdfDoc.embedPng(logoBytes);
        }
    } catch (e) {
        console.warn("⚠️ Fallback: Brak czcionek lub logo PNG.", e);
        if(!fontRegular) fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
        if(!fontBold) fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }

    const txt = (text: any) => {
        if (!text) return '';
        return usePolishChars ? String(text) : removePolishSigns(text);
    };

    const getWrappedHeight = (text: string, maxWidth: number, font: any, size: number, lineHeight = 1.4) => {
        if (!text) return 0;
        const words = txt(text).split(' ');
        let currentLine = '';
        let lines = 1;
        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (font.widthOfTextAtSize(testLine, size) > maxWidth && currentLine) {
                lines++;
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        return lines * size * lineHeight;
    };

    const drawWrappedText = (page: any, text: string, x: number, y: number, maxWidth: number, font: any, size: number, color: any, lineHeight = 1.4) => {
        if (!text) return y;
        const words = txt(text).split(' ');
        let currentLine = '';
        let currentY = y;
        const lh = size * lineHeight;

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (font.widthOfTextAtSize(testLine, size) > maxWidth && currentLine) {
                page.drawText(currentLine, { x, y: currentY, font, size, color });
                currentLine = word;
                currentY -= lh;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            page.drawText(currentLine, { x, y: currentY, font, size, color });
            currentY -= lh;
        }
        return currentY;
    };

    const drawHeader = (page: any, width: number, height: number, pageNum: number) => {
        page.drawLine({ start: {x: 40, y: height - 40}, end: {x: width - 40, y: height - 40}, color: c.primary, thickness: 2 });
        
        // Rysowanie LOGO lub Tekstu zastępczego
        if (logoImage) {
            const logoDims = logoImage.scaleToFit(220, 55);
            page.drawImage(logoImage, {
                x: 40,
                y: height - 45 - logoDims.height,
                width: logoDims.width,
                height: logoDims.height
            });
        } else {
            const brandName = companyConfig.name || 'AirTUR';
            page.drawText(brandName, { x: 40, y: height - 65, size: 24, font: fontBold, color: c.primary });
            page.drawText('Inżynieria Komfortu', { x: 40, y: height - 78, size: 9, font: fontBold, color: c.dark });
        }
        
        page.drawText(`Raport #${txt(dynamicContent.reportId)}`, { x: width - 150, y: height - 60, size: 12, font: fontBold, color: c.dark });
        page.drawText(`DATA: ${txt(dynamicContent.date)}`, { x: width - 150, y: height - 75, size: 9, font: fontRegular, color: c.gray });
    };

    // ==========================================
    // STRONA 1: ANALIZA I DIAGNOZA
    // ==========================================
    const page1 = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page1.getSize();
    drawHeader(page1, width, height, 1);

    // Zmniejszony dystans od nagłówka
    let yPos = height - 130;

    // HERO SECTION
    const heroH = getWrappedHeight(dynamicContent.heroDesc, 475, fontRegular, 11) + 50; // Mniej pustej przestrzeni (z 60 na 50)
    page1.drawRectangle({ x: 40, y: yPos - heroH, width: width - 80, height: heroH, color: c.dark });
    yPos -= 25;
    page1.drawText(txt(dynamicContent.heroHeadline), { x: 60, y: yPos, size: 16, font: fontBold, color: c.primary });
    yPos -= 20;
    drawWrappedText(page1, dynamicContent.heroDesc, 60, yPos, 475, fontRegular, 11, c.white);
    yPos -= (heroH - 35);

    // 01. PARAMETRY BUDYNKU
    page1.drawText(txt('01. KARTA PARAMETRÓW BUDYNKU'), { x: 40, y: yPos, size: 11, font: fontBold, color: c.primary });
    yPos -= 25;
    
    const params = [
        { l: 'Typ budynku:', v: dynamicContent.buildingType },
        { l: 'Powierzchnia:', v: `${data.wynik_metraz || data.area}` },
        { l: 'Ekspozycja na słońce:', v: dynamicContent.sunFactorLabel },
        { l: 'Liczba domowników:', v: data.wynik_ludzie || data.peopleCount },
        { l: 'Obecne źródło ogrzewania:', v: dynamicContent.currentHeatSource }
    ];

    params.forEach(p => {
        page1.drawText(txt(p.l), { x: 40, y: yPos, size: 10, font: fontBold, color: c.gray });
        page1.drawText(txt(p.v), { x: 220, y: yPos, size: 10, font: fontBold, color: c.dark });
        page1.drawLine({ start: {x: 40, y: yPos - 8}, end: {x: width - 40, y: yPos - 8}, color: c.lightGray, thickness: 1 });
        yPos -= 20; // Zmniejszony odstęp między wierszami (z 22 na 20)
    });

    // 02. DIAGNOZA MOCY
    yPos -= 15;
    page1.drawText(txt('02. DIAGNOZA MOCY I DOBÓR'), { x: 40, y: yPos, size: 11, font: fontBold, color: c.primary });
    yPos -= 25;

    page1.drawRectangle({ x: 40, y: yPos - 50, width: 220, height: 50, color: c.primaryLight, borderColor: c.primary, borderWidth: 1 });
    page1.drawText(txt('WYMAGANA MOC UKŁADU'), { x: 55, y: yPos - 15, size: 8, font: fontBold, color: c.primary });
    page1.drawText(txt(dynamicContent.modelPower), { x: 55, y: yPos - 40, size: 22, font: fontBold, color: c.primary });
    
    page1.drawText(txt('Rekomendowany System:'), { x: 280, y: yPos - 15, size: 10, font: fontRegular, color: c.gray });
    page1.drawText(txt(dynamicContent.modelName), { x: 280, y: yPos - 35, size: 16, font: fontBold, color: c.dark });
    yPos -= 60; // Zmniejszony odstęp pod ramką z 70 na 60

    // UZASADNIENIE Z JASNOŻÓŁTYM TŁEM
    const expText = `Uzasadnienie: ${dynamicContent.expertExplanation}`;
    const expH = getWrappedHeight(expText, 475, fontRegular, 10) + 30; 
    page1.drawRectangle({ x: 40, y: yPos - expH, width: width - 80, height: expH, color: c.orangeLight });
    page1.drawLine({ start: {x: 40, y: yPos - expH}, end: {x: 40, y: yPos}, color: c.orange, thickness: 4 });
    drawWrappedText(page1, expText, 55, yPos - 15, 480, fontRegular, 10, c.dark);
    yPos -= (expH + 15); // Zmniejszony odstęp z 20 na 15

    const rejH = getWrappedHeight(dynamicContent.rejectionText, 475, fontRegular, 10) + 40;
    page1.drawRectangle({ x: 40, y: yPos - rejH, width: width - 80, height: rejH, color: c.redLight });
    page1.drawLine({ start: {x: 40, y: yPos - rejH}, end: {x: 40, y: yPos}, color: c.red, thickness: 4 }); 
    page1.drawText(txt('DLACZEGO ODRZUCILIŚMY INNE WARIANTY?'), { x: 55, y: yPos - 20, size: 9, font: fontBold, color: c.red });
    drawWrappedText(page1, dynamicContent.rejectionText, 55, yPos - 35, 480, fontRegular, 10, c.dark);
    yPos -= (rejH + 20); // Zmniejszony odstęp z 30 na 20

    // 03. ROI
    page1.drawText(txt('03. PROGNOZA FINANSOWA (ROI)'), { x: 40, y: yPos, size: 11, font: fontBold, color: c.primary });
    yPos -= 20;
    
    const boxW = (width - 100) / 3;
    const rois = [
        { l: '1 ROK', v: `${dynamicContent.savingsYear} zł`, x: 40 },
        { l: '5 LAT', v: `${dynamicContent.savings5Years} zł`, x: 40 + boxW + 10 },
        { l: '10 LAT', v: `${dynamicContent.savings10Years} zł`, x: 40 + (boxW + 10) * 2 }
    ];

    rois.forEach(r => {
        page1.drawRectangle({ x: r.x, y: yPos - 50, width: boxW, height: 50, color: c.white, borderColor: c.primaryLight, borderWidth: 2 });
        page1.drawText(txt(r.l), { x: r.x + 15, y: yPos - 15, size: 9, font: fontBold, color: c.primary });
        page1.drawText(txt(r.v), { x: r.x + 15, y: yPos - 38, size: 16, font: fontBold, color: c.green });
    });
    
    yPos -= 60; // Zmniejszony odstęp z 70 na 60

    // ROI - GŁÓWNY WNIOSEK + DISCLAIMER Z GWIAZDKĄ
    page1.drawText(txt(dynamicContent.roiPsychology), { x: 40, y: yPos, size: 10, font: fontBold, color: c.dark });
    yPos -= 15;
    const roiDisclaimer = "* Powyższe wartości to szacunki oparte na wprowadzonych przez Ciebie danych (obecne źródło ciepła, metraż, rachunki). Rzeczywiste oszczędności mogą się różnić w zależności od zmian cen energii i nawyków użytkowania.";
    drawWrappedText(page1, roiDisclaimer, 40, yPos, width - 80, fontRegular, 8, c.gray, 1.2);

    page1.drawText('Strona 1 / 2', { x: width / 2 - 20, y: 30, size: 9, font: fontRegular, color: c.gray });

    // ==========================================
    // STRONA 2: ARKUSZ INWESTORA
    // ==========================================
    const page2 = pdfDoc.addPage([595.28, 841.89]);
    drawHeader(page2, width, height, 2);
    
    let y2 = height - 135;

    page2.drawText(txt('04. TWÓJ ARKUSZ DECYZYJNY: AirTUR vs RYNEK'), { x: 40, y: y2, size: 11, font: fontBold, color: c.primary });
    y2 -= 15;
    page2.drawText(txt('Wydrukuj ten raport i użyj go przy porównywaniu ofert. Nie płać za obietnice, płać za standardy.'), { x: 40, y: y2, size: 9, font: fontRegular, color: c.gray });
    y2 -= 30;

    page2.drawRectangle({ x: 40, y: y2 - 25, width: width - 80, height: 25, color: c.dark });
    page2.drawText(txt('KRYTERIUM'), { x: 50, y: y2 - 17, size: 9, font: fontBold, color: c.white });
    page2.drawText(txt('STANDARD AirTUR'), { x: 200, y: y2 - 17, size: 9, font: fontBold, color: c.primary });
    page2.drawText(txt('OFERTA KONKURENCJI A'), { x: 340, y: y2 - 17, size: 9, font: fontBold, color: c.white });
    page2.drawText(txt('OFERTA KONKURENCJI B'), { x: 450, y: y2 - 17, size: 9, font: fontBold, color: c.white });
    y2 -= 25;

    // 🔥 ZAKTUALIZOWANE TEKSTY TABELI
    const tableRows = [
        { k1: '1. Analiza Potrzeb', k2: 'TEN RAPORT', v1: 'ZROBIONE (Ten Raport)' },
        { k1: '2. Dobrane Urządzenie', k2: `Moc: ${dynamicContent.modelPower}`, v1: dynamicContent.modelName },
        { k1: '3. Kalkulacja ROI', k2: 'Wiem, kiedy się zwróci', v1: `SZACUNEK (${dynamicContent.savingsYear} zł/rok)` },
        { k1: '4. Standard Montażu', k2: 'Porządek', v1: 'NASZ PRIORYTET' },
        { k1: '5. Instruktaż', k2: 'Pokażemy co i jak', v1: 'INSTRUKCJA OBSŁUGI', v1_sub: 'I CZYSZCZENIA' },
    ];

    const drawDottedLine = (x1: number, x2: number, y: number) => {
        page2.drawLine({ start: {x: x1, y}, end: {x: x2, y}, color: c.gray, thickness: 1, dashArray: [2, 3] });
    };

    tableRows.forEach(row => {
        page2.drawRectangle({ x: 190, y: y2 - 40, width: 140, height: 40, color: c.primaryLight });
        page2.drawText(txt(row.k1), { x: 50, y: y2 - 15, size: 10, font: fontBold, color: c.dark });
        page2.drawText(txt(row.k2), { x: 50, y: y2 - 28, size: 8, font: fontRegular, color: c.gray });
        
        // Obsługa długiego tekstu "Instrukcja Obsługi I Czyszczenia"
        if(row.v1_sub) {
            page2.drawText(txt(row.v1), { x: 200, y: y2 - 17, size: 9, font: fontBold, color: c.dark });
            page2.drawText(txt(row.v1_sub), { x: 200, y: y2 - 27, size: 9, font: fontBold, color: c.dark });
        } else {
            page2.drawText(txt(row.v1), { x: 200, y: y2 - 22, size: 9, font: fontBold, color: c.dark });
        }

        drawDottedLine(340, 430, y2 - 22);
        drawDottedLine(450, 540, y2 - 22);
        page2.drawLine({ start: {x: 40, y: y2 - 40}, end: {x: width - 40, y: y2 - 40}, color: c.lightGray, thickness: 1 });
        y2 -= 40;
    });

    // Wiersz: CENA KOŃCOWA
    page2.drawRectangle({ x: 190, y: y2 - 40, width: 140, height: 40, color: c.primaryLight });
    page2.drawText(txt('CENA KOŃCOWA'), { x: 50, y: y2 - 25, size: 11, font: fontBold, color: c.dark });
    
    // ZMIANA: Miejsce na długopis dla AirTUR (tak samo jak dla konkurencji)
    drawDottedLine(200, 290, y2 - 25); page2.drawText('zł', { x: 295, y: y2 - 25, size: 9, font: fontRegular, color: c.gray });
    drawDottedLine(340, 410, y2 - 25); page2.drawText('zł', { x: 415, y: y2 - 25, size: 9, font: fontRegular, color: c.gray });
    drawDottedLine(450, 520, y2 - 25); page2.drawText('zł', { x: 525, y: y2 - 25, size: 9, font: fontRegular, color: c.gray });
    page2.drawLine({ start: {x: 40, y: y2 - 40}, end: {x: width - 40, y: y2 - 40}, color: c.dark, thickness: 1 });
    y2 -= 70;

    page2.drawText(txt('05. RADA EKSPERTA'), { x: 40, y: y2, size: 11, font: fontBold, color: c.primary });
    y2 -= 20;
    const tipH = getWrappedHeight(dynamicContent.expertTipDynamic, 475, fontRegular, 10) + 40;
    page2.drawRectangle({ x: 40, y: y2 - tipH, width: width - 80, height: tipH, color: c.orangeLight });
    page2.drawLine({ start: {x: 40, y: y2 - tipH}, end: {x: 40, y: y2}, color: c.orange, thickness: 4 });
    page2.drawText(txt('WSKAZÓWKA DLA TWOJEGO BUDYNKU:'), { x: 55, y: y2 - 20, size: 9, font: fontBold, color: c.orange });
    drawWrappedText(page2, dynamicContent.expertTipDynamic, 55, y2 - 35, 480, fontRegular, 10, c.dark);

    const legalText = "Niniejsza 'Karta Diagnostyki Termicznej' ma charakter wyłącznie analityczno-poglądowy. Przedstawione wyliczenia oszczędności (ROI) opierają się na danych szacunkowych oraz średnich cenach energii i mogą różnić się w zależności od rzeczywistego użytkowania. Dokument nie stanowi oferty handlowej w rozumieniu art. 66 § 1 Kodeksu Cywilnego. Ostateczna specyfikacja techniczna i wycena wymagają potwierdzenia podczas wizji lokalnej przez certyfikowanego instalatora AirTUR.";
    drawWrappedText(page2, legalText, 40, 100, width - 80, fontRegular, 7, c.gray, 1.2);
    
    const cAddress = companyConfig.address?.full || 'Zarzecze 9, 33-390 Łącko';
    const cNip = companyConfig.nip || '7343606386';
    const cEmail = companyConfig.contact?.email || 'kontakt@airtur.pl';
    const companyFooterText = `${companyConfig.fullName || companyConfig.name || 'AirTUR'} | ${cAddress} | NIP: ${cNip} | ${cEmail}`;
    
    page2.drawText(txt(companyFooterText), { x: 40, y: 115, size: 8, font: fontBold, color: c.dark });
    page2.drawText('Strona 2 / 2', { x: width / 2 - 20, y: 30, size: 9, font: fontRegular, color: c.gray });

    return await pdfDoc.save();
}

function removePolishSigns(text: any): string {
    if (text === null || text === undefined) return '';
    const str = String(text);
    const map: { [key: string]: string } = { 'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z', 'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z' };
    return str.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, match => map[match]);
}