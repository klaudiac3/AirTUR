// src/utils/generatePdf.ts
import { PDFDocument, StandardFonts, PDFFont, PDFPage, PDFImage, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { promises as fsp } from 'fs';
import path from 'path';
// @ts-ignore
import { companyConfig } from '../data/companyConfig.js';

// ============================================================
// 1. STRICT TYPES (Zero "any")
// ============================================================

export interface ReportData {
    wynik_metraz?: string | number;
    area?: string | number;
    wynik_ludzie?: string | number;
    peopleCount?: string | number;
}

export interface DynamicContent {
    reportId: string;
    date: string;
    heroHeadline: string;
    heroDesc: string;
    buildingType: string;
    sunFactorLabel: string;
    currentHeatSource: string;
    modelPower: string;
    modelName: string;
    selectionLabel?: string;
    expertExplanation: string;
    rejectionText: string;
    savingsYear: string | number;
    savings5Years: string | number;
    savings10Years: string | number;
    roiPsychology: string;
    expertTipDynamic: string;
}

interface Fonts {
    regular: PDFFont;
    bold: PDFFont;
    hasPolishChars: boolean;
}

interface WrappedText {
    lines: string[];
    height: number;
}

type RGBColor = ReturnType<typeof rgb>;

// ============================================================
// 2. DESIGN TOKENS (Layout, Spacing, Colors)
// ============================================================

const hex2rgb = (hex: string): RGBColor => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
};

const COLORS = {
    dark: hex2rgb('#212529'),       // 🔥 Zaktualizowany głęboki grafit
    textMain: hex2rgb('#3A4149'),   // 🔥 Nowy, lżejszy kolor do długich tekstów (lepsza czytelność)
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

const LAYOUT = {
    margin: 40,
    pageWidth: 595.28,
    pageHeight: 841.89,
    get contentWidth() { return this.pageWidth - (this.margin * 2); },
    headerOffset: 130,
    footerOffset: 60,
    lineHeight: 1.4
};

// Vertical Rhythm
const SPACING = {
    xs: 5,
    sm: 10,
    md: 15,
    lg: 25,
    xl: 40,
    xxl: 60,
    boxPadding: 20
};

const GRID = {
    leftAlign: LAYOUT.margin,
    textOffset: 55,
    valueOffset: 220,
    recomOffset: 280,
    table: { col1: 50, col2: 200, col3: 340, col4: 450, col5: 525 }
};

// ============================================================
// 3. PURE FUNCTIONS & DATA PREPARATION
// ============================================================

const removePolishSigns = (text?: unknown): string => {
    if (!text) return '';
    const str = String(text);
    const map: Record<string, string> = { 'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z', 'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z' };
    return str.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, match => map[match] || match);
};

const sanitizeText = (text: unknown, usePolishChars: boolean): string => {
    if (!text) return '';
    return usePolishChars ? String(text) : removePolishSigns(text);
};

// Wrapper łamiący tekst - Zwraca obiekt z liniami i obliczoną wysokością
const wrapText = (text: string, maxWidth: number, font: PDFFont, size: number, usePolish: boolean): WrappedText => {
    if (!text) return { lines: [], height: 0 };
    const words = sanitizeText(text, usePolish).split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (font.widthOfTextAtSize(testLine, size) > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    
    return {
        lines,
        height: lines.length * size * LAYOUT.lineHeight
    };
};

const fileExists = async (filePath: string): Promise<boolean> => {
    try { await fsp.access(filePath); return true; } 
    catch { return false; }
};

// Parse currency strings safely
const parseToCurrency = (val: string | number): string => {
    const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, ''), 10) : val;
    return isNaN(num as number) ? '0' : (num as number).toLocaleString('pl-PL');
};

// ============================================================
// 4. MAIN BUILDER
// ============================================================

export async function generateReportPdf(rawData: ReportData, rawDynamicContent: DynamicContent): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    let logoImage: PDFImage | null = null;
    
    const fonts: Fonts = {
        regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
        bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        hasPolishChars: false
    };

    // --- NON-BLOCKING ASYNC RESOURCE LOADING ---
    try {
        pdfDoc.registerFontkit(fontkit);
        const fontsDir = path.resolve(process.cwd(), 'public/fonts');
        const regPath = path.join(fontsDir, 'Roboto-Regular.ttf');
        const boldPath = path.join(fontsDir, 'Roboto-Bold.ttf');

        if (await fileExists(regPath) && await fileExists(boldPath)) {
            const [regBytes, boldBytes] = await Promise.all([
                fsp.readFile(regPath),
                fsp.readFile(boldPath)
            ]);
            fonts.regular = await pdfDoc.embedFont(regBytes);
            fonts.bold = await pdfDoc.embedFont(boldBytes);
            fonts.hasPolishChars = true; 
        } else {
            console.warn('[PDF] Brak lokalnych fontów TTF. Używam systemowych.');
        }

        const logoPath = path.resolve(process.cwd(), 'public/logo.png');
        if (await fileExists(logoPath)) {
            logoImage = await pdfDoc.embedPng(await fsp.readFile(logoPath));
        }
    } catch (e) {
        console.warn("[PDF] Błąd ładowania zasobów graficznych:", e);
    }

    // --- PRE-SANITIZATION ---
    const snt = (text: unknown): string => fonts.hasPolishChars ? String(text || '') : removePolishSigns(text);
    
    const data = {
        area: snt(rawData.wynik_metraz || rawData.area),
        peopleCount: snt(rawData.wynik_ludzie || rawData.peopleCount)
    };

    const dyn = {
        ...rawDynamicContent,
        heroHeadline: snt(rawDynamicContent.heroHeadline),
        heroDesc: snt(rawDynamicContent.heroDesc),
        buildingType: snt(rawDynamicContent.buildingType),
        sunFactorLabel: snt(rawDynamicContent.sunFactorLabel),
        currentHeatSource: snt(rawDynamicContent.currentHeatSource),
        modelPower: snt(rawDynamicContent.modelPower),
        modelName: snt(rawDynamicContent.modelName),
        selectionLabel: snt(rawDynamicContent.selectionLabel || 'Rekomendowany System:'),
        expertExplanation: snt(rawDynamicContent.expertExplanation),
        rejectionText: snt(rawDynamicContent.rejectionText),
        roiPsychology: snt(rawDynamicContent.roiPsychology),
        expertTipDynamic: snt(rawDynamicContent.expertTipDynamic),
        savingsYear: parseToCurrency(rawDynamicContent.savingsYear),
        savings5Years: parseToCurrency(rawDynamicContent.savings5Years),
        savings10Years: parseToCurrency(rawDynamicContent.savings10Years),
    };

    // --- RENDER ENGINE ---
    const pages: PDFPage[] = [];
    let currentPage: PDFPage;

    const drawHeader = (page: PDFPage) => {
        // 🔥 Pogrubiona linia (thickness: 4 zamiast 2)
        page.drawLine({ start: {x: LAYOUT.margin, y: LAYOUT.pageHeight - LAYOUT.margin}, end: {x: LAYOUT.pageWidth - LAYOUT.margin, y: LAYOUT.pageHeight - LAYOUT.margin}, color: COLORS.primary, thickness: 4 });
        
        if (logoImage) {
            const logoDims = logoImage.scaleToFit(220, 55);
            page.drawImage(logoImage, { x: LAYOUT.margin, y: LAYOUT.pageHeight - 45 - logoDims.height, width: logoDims.width, height: logoDims.height });
        } else {
            const brandName = snt(companyConfig.name || 'AirTUR');
            page.drawText(brandName, { x: LAYOUT.margin, y: LAYOUT.pageHeight - 65, size: 24, font: fonts.bold, color: COLORS.primary });
            page.drawText(snt('Inżynieria Komfortu'), { x: LAYOUT.margin, y: LAYOUT.pageHeight - 78, size: 9, font: fonts.bold, color: COLORS.dark });
        }
        
        page.drawText(`Raport #${dyn.reportId}`, { x: LAYOUT.pageWidth - 150, y: LAYOUT.pageHeight - 60, size: 12, font: fonts.bold, color: COLORS.dark });
        page.drawText(`DATA: ${dyn.date}`, { x: LAYOUT.pageWidth - 150, y: LAYOUT.pageHeight - 75, size: 9, font: fonts.regular, color: COLORS.gray });
    };

    const addPage = () => {
        currentPage = pdfDoc.addPage([LAYOUT.pageWidth, LAYOUT.pageHeight]);
        pages.push(currentPage);
        drawHeader(currentPage);
        return createCursor(LAYOUT.pageHeight - LAYOUT.headerOffset);
    };

    const createCursor = (startY: number) => {
        let y = startY;
        return {
            get current() { return y; },
            moveDown(amount: number) { y -= amount; },
            ensureSpace(requiredHeight: number) {
                if (y - requiredHeight < LAYOUT.footerOffset) {
                    const newCursor = addPage();
                    y = newCursor.current;
                }
            }
        };
    };

    let cursor = addPage(); // Inicjalizacja Strony 1

    // --- REUSABLE COMPONENTS ---
    const drawWrappedLines = (page: PDFPage, wrapped: WrappedText, x: number, yPos: number, font: PDFFont, size: number, color: RGBColor) => {
        let y = yPos;
        for (const line of wrapped.lines) {
            page.drawText(line, { x, y, font, size, color });
            y -= size * LAYOUT.lineHeight;
        }
    };

    const drawSectionTitle = (text: string) => {
        cursor.ensureSpace(SPACING.xl);
        currentPage.drawText(text, { x: GRID.leftAlign, y: cursor.current, size: 11, font: fonts.bold, color: COLORS.primary });
        cursor.moveDown(SPACING.lg);
    };

    const createInfoBox = (title: string, content: string, bgColor: RGBColor, lineColor: RGBColor, titleColor: RGBColor, textColor: RGBColor) => {
        const wrapped = wrapText(content, 480, fonts.regular, 10, fonts.hasPolishChars);
        const height = wrapped.height + SPACING.xl;
        
        return {
            height,
            render: () => {
                cursor.ensureSpace(height);
                currentPage.drawRectangle({ x: GRID.leftAlign, y: cursor.current - height, width: LAYOUT.contentWidth, height, color: bgColor });
                currentPage.drawLine({ start: {x: GRID.leftAlign, y: cursor.current - height}, end: {x: GRID.leftAlign, y: cursor.current}, color: lineColor, thickness: 4 });
                
                currentPage.drawText(title, { x: GRID.textOffset, y: cursor.current - 20, size: 9, font: fonts.bold, color: titleColor });
                drawWrappedLines(currentPage, wrapped, GRID.textOffset, cursor.current - 35, fonts.regular, 10, textColor);
                cursor.moveDown(height + SPACING.md);
            }
        };
    };

    // ==========================================
    // RENDER: BLOKI STRONY 1
    // ==========================================

    // HERO
    const heroWrap = wrapText(dyn.heroDesc, 475, fonts.regular, 11, fonts.hasPolishChars);
    const heroH = heroWrap.height + 50; 
    cursor.ensureSpace(heroH);
    
    currentPage.drawRectangle({ x: GRID.leftAlign, y: cursor.current - heroH, width: LAYOUT.contentWidth, height: heroH, color: COLORS.dark });
    currentPage.drawText(dyn.heroHeadline, { x: 60, y: cursor.current - SPACING.lg, size: 16, font: fonts.bold, color: COLORS.primary });
    drawWrappedLines(currentPage, heroWrap, 60, cursor.current - SPACING.lg - SPACING.boxPadding, fonts.regular, 11, COLORS.white);
    
    cursor.moveDown(heroH + SPACING.lg);

    // PARAMETRY
    drawSectionTitle('01. KARTA PARAMETRÓW BUDYNKU');
    const paramsList = [
        { l: 'Typ budynku:', v: dyn.buildingType },
        { l: 'Powierzchnia:', v: data.area },
        { l: 'Ekspozycja na słońce:', v: dyn.sunFactorLabel },
        { l: 'Liczba domowników:', v: data.peopleCount },
        { l: 'Obecne źródło ogrzewania:', v: dyn.currentHeatSource }
    ];

    cursor.ensureSpace(paramsList.length * SPACING.boxPadding);
    paramsList.forEach(p => {
        currentPage.drawText(p.l, { x: GRID.leftAlign, y: cursor.current, size: 10, font: fonts.bold, color: COLORS.gray });
        currentPage.drawText(p.v, { x: GRID.valueOffset, y: cursor.current, size: 10, font: fonts.bold, color: COLORS.dark });
        currentPage.drawLine({ start: {x: GRID.leftAlign, y: cursor.current - 8}, end: {x: LAYOUT.pageWidth - GRID.leftAlign, y: cursor.current - 8}, color: COLORS.lightGray, thickness: 1 });
        cursor.moveDown(SPACING.boxPadding); 
    });

    // DIAGNOZA
    cursor.moveDown(SPACING.xs);
    drawSectionTitle('02. DIAGNOZA MOCY I DOBÓR');

    cursor.ensureSpace(70);
    currentPage.drawRectangle({ x: GRID.leftAlign, y: cursor.current - 50, width: 220, height: 50, color: COLORS.primaryLight, borderColor: COLORS.primary, borderWidth: 1 });
    currentPage.drawText(snt('WYMAGANA MOC UKŁADU'), { x: GRID.textOffset, y: cursor.current - 15, size: 8, font: fonts.bold, color: COLORS.primary });
    currentPage.drawText(dyn.modelPower, { x: GRID.textOffset, y: cursor.current - 40, size: 22, font: fonts.bold, color: COLORS.primary });
    
    currentPage.drawText(dyn.selectionLabel, { x: GRID.recomOffset, y: cursor.current - 15, size: 10, font: fonts.regular, color: COLORS.gray });
    currentPage.drawText(dyn.modelName, { x: GRID.recomOffset, y: cursor.current - 35, size: 16, font: fonts.bold, color: COLORS.dark });
    cursor.moveDown(SPACING.xxl); 

    // BOXY INFORMACYJNE (🔥 Używamy COLORS.textMain dla lepszej czytelności)
    createInfoBox('UZASADNIENIE', dyn.expertExplanation, COLORS.orangeLight, COLORS.orange, COLORS.orange, COLORS.textMain).render();
    createInfoBox('DLACZEGO ODRZUCILIŚMY INNE WARIANTY?', dyn.rejectionText, COLORS.redLight, COLORS.red, COLORS.red, COLORS.textMain).render();

    // ROI
    drawSectionTitle('03. PROGNOZA FINANSOWA (ROI)');
    
    const boxW = (LAYOUT.contentWidth - 20) / 3;
    const rois = [
        { l: '1 ROK', v: `${dyn.savingsYear} zł`, x: GRID.leftAlign },
        { l: '5 LAT', v: `${dyn.savings5Years} zł`, x: GRID.leftAlign + boxW + 10 },
        { l: '10 LAT', v: `${dyn.savings10Years} zł`, x: GRID.leftAlign + (boxW + 10) * 2 }
    ];

    cursor.ensureSpace(80);
    rois.forEach(r => {
        currentPage.drawRectangle({ x: r.x, y: cursor.current - 50, width: boxW, height: 50, color: COLORS.white, borderColor: COLORS.primaryLight, borderWidth: 2 });
        currentPage.drawText(r.l, { x: r.x + 15, y: cursor.current - 15, size: 9, font: fonts.bold, color: COLORS.primary });
        currentPage.drawText(r.v, { x: r.x + 15, y: cursor.current - 38, size: 16, font: fonts.bold, color: COLORS.green });
    });
    
    cursor.moveDown(SPACING.xxl); 
    cursor.ensureSpace(40);
    currentPage.drawText(dyn.roiPsychology, { x: GRID.leftAlign, y: cursor.current, size: 10, font: fonts.bold, color: COLORS.dark });
    cursor.moveDown(SPACING.md);
    
    const roiDisclaimer = snt("* Powyższe wartości to szacunki oparte na wprowadzonych przez Ciebie danych. Rzeczywiste oszczędności mogą się różnić.");
    const discWrap = wrapText(roiDisclaimer, LAYOUT.contentWidth, fonts.regular, 8, fonts.hasPolishChars);
    drawWrappedLines(currentPage, discWrap, GRID.leftAlign, cursor.current, fonts.regular, 8, COLORS.gray);

    // ==========================================
    // RENDER: STRONA 2 
    // ==========================================
    cursor = addPage(); 
    cursor.moveDown(SPACING.xs);

    drawSectionTitle('04. TWÓJ ARKUSZ DECYZYJNY: AirTUR vs RYNEK');
    currentPage.drawText(snt('Wydrukuj ten raport i użyj go przy porównywaniu ofert. Nie płać za obietnice, płać za standardy.'), { x: GRID.leftAlign, y: cursor.current, size: 9, font: fonts.regular, color: COLORS.gray });
    cursor.moveDown(SPACING.xl); 

    // Rejestrujemy Y, żeby potem narysować ramkę AirTUR
    const tableStartY = cursor.current;

    currentPage.drawRectangle({ x: GRID.leftAlign, y: cursor.current - 25, width: LAYOUT.contentWidth, height: 25, color: COLORS.dark });
    currentPage.drawText(snt('KRYTERIUM'), { x: GRID.table.col1, y: cursor.current - 17, size: 9, font: fonts.bold, color: COLORS.white });
    currentPage.drawText(snt('STANDARD AirTUR'), { x: GRID.table.col2, y: cursor.current - 17, size: 9, font: fonts.bold, color: COLORS.primary });
    currentPage.drawText(snt('OFERTA KONKURENCJI A'), { x: GRID.table.col3, y: cursor.current - 17, size: 9, font: fonts.bold, color: COLORS.white });
    currentPage.drawText(snt('OFERTA KONKURENCJI B'), { x: GRID.table.col4, y: cursor.current - 17, size: 9, font: fonts.bold, color: COLORS.white });
    cursor.moveDown(SPACING.lg);

    const tableRows = [
        { k1: '1. Analiza Potrzeb', k2: 'TEN RAPORT', v1: 'ZROBIONE (Ten Raport)' },
        { k1: '2. Dobrane Urządzenie', k2: `Moc: ${dyn.modelPower}`, v1: dyn.modelName },
        { k1: '3. Kalkulacja ROI', k2: 'Wiem, kiedy się zwróci', v1: `SZACUNEK (${dyn.savingsYear} zł/rok)` },
        { k1: '4. Standard Montażu', k2: 'Porządek', v1: 'NASZ PRIORYTET' },
        { k1: '5. Instruktaż', k2: 'Pokażemy co i jak', v1: 'INSTRUKCJA OBSŁUGI', v1_sub: 'I CZYSZCZENIA' },
    ];

    const drawDottedLine = (x1: number, x2: number, y: number) => {
        currentPage.drawLine({ start: {x: x1, y}, end: {x: x2, y}, color: COLORS.gray, thickness: 1, dashArray: [2, 3] });
    };

    tableRows.forEach(row => {
        currentPage.drawRectangle({ x: 190, y: cursor.current - 40, width: 140, height: 40, color: COLORS.primaryLight });
        currentPage.drawText(snt(row.k1), { x: GRID.table.col1, y: cursor.current - 15, size: 10, font: fonts.bold, color: COLORS.dark });
        currentPage.drawText(snt(row.k2), { x: GRID.table.col1, y: cursor.current - 28, size: 8, font: fonts.regular, color: COLORS.gray });
        
        if(row.v1_sub) {
            currentPage.drawText(snt(row.v1), { x: GRID.table.col2, y: cursor.current - 17, size: 9, font: fonts.bold, color: COLORS.dark });
            currentPage.drawText(snt(row.v1_sub), { x: GRID.table.col2, y: cursor.current - 27, size: 9, font: fonts.bold, color: COLORS.dark });
        } else {
            currentPage.drawText(snt(row.v1), { x: GRID.table.col2, y: cursor.current - 22, size: 9, font: fonts.bold, color: COLORS.dark });
        }

        drawDottedLine(GRID.table.col3, 430, cursor.current - 22);
        drawDottedLine(GRID.table.col4, 540, cursor.current - 22);
        currentPage.drawLine({ start: {x: GRID.leftAlign, y: cursor.current - 40}, end: {x: LAYOUT.pageWidth - GRID.leftAlign, y: cursor.current - 40}, color: COLORS.lightGray, thickness: 1 });
        cursor.moveDown(SPACING.xl);
    });

    // CENA KOŃCOWA
    currentPage.drawRectangle({ x: 190, y: cursor.current - 40, width: 140, height: 40, color: COLORS.primaryLight });
    currentPage.drawText(snt('CENA KOŃCOWA'), { x: GRID.table.col1, y: cursor.current - 25, size: 11, font: fonts.bold, color: COLORS.dark });
    
    drawDottedLine(GRID.table.col2, 290, cursor.current - 25); currentPage.drawText('zł', { x: 295, y: cursor.current - 25, size: 9, font: fonts.regular, color: COLORS.gray });
    drawDottedLine(GRID.table.col3, 410, cursor.current - 25); currentPage.drawText('zł', { x: 415, y: cursor.current - 25, size: 9, font: fonts.regular, color: COLORS.gray });
    drawDottedLine(GRID.table.col4, 520, cursor.current - 25); currentPage.drawText('zł', { x: GRID.table.col5, y: cursor.current - 25, size: 9, font: fonts.regular, color: COLORS.gray });
    currentPage.drawLine({ start: {x: GRID.leftAlign, y: cursor.current - 40}, end: {x: LAYOUT.pageWidth - GRID.leftAlign, y: cursor.current - 40}, color: COLORS.dark, thickness: 1 });
    
    // 🔥 Wyróżnienie całej kolumny AirTUR ramką
    const tableTotalHeight = tableStartY - (cursor.current - 40);
    currentPage.drawRectangle({ 
        x: 190, 
        y: cursor.current - 40, 
        width: 140, 
        height: tableTotalHeight, 
        borderColor: COLORS.primary, 
        borderWidth: 2 
    });

    cursor.moveDown(70);

    // RADA EKSPERTA
    createInfoBox('WSKAZÓWKA DLA TWOJEGO BUDYNKU:', dyn.expertTipDynamic, COLORS.orangeLight, COLORS.orange, COLORS.orange, COLORS.textMain).render();

    // ==========================================
    // RENDER: FOOTERS (Tylko na ostatniej stronie!)
    // ==========================================
    const legalText = snt("Niniejsza Karta Diagnostyki ma charakter analityczny. Wyliczenia ROI opierają się na danych szacunkowych i mogą różnić się w zależności od rzeczywistego użytkowania. Dokument nie stanowi oferty handlowej (art. 66 KC).");
    const legalWrap = wrapText(legalText, LAYOUT.contentWidth, fonts.regular, 7, fonts.hasPolishChars);
    
    const cAddress = snt(companyConfig.address?.full || 'Zarzecze 9, 33-390 Łącko');
    const cNip = snt(companyConfig.nip || '7343606386');
    const cEmail = snt(companyConfig.contact?.email || 'kontakt@airtur.pl');
    const companyFooterText = `${snt(companyConfig.fullName || companyConfig.name || 'AirTUR')} | ${cAddress} | NIP: ${cNip} | ${cEmail}`;

    pages.forEach((p, index) => {
        if (index === pages.length - 1) {
            drawWrappedLines(p, legalWrap, GRID.leftAlign, 100, fonts.regular, 7, COLORS.gray);
            p.drawText(companyFooterText, { x: GRID.leftAlign, y: 115, size: 8, font: fonts.bold, color: COLORS.dark });
        }
        p.drawText(`Strona ${index + 1} / ${pages.length}`, { x: LAYOUT.pageWidth / 2 - 20, y: 30, size: 9, font: fonts.regular, color: COLORS.gray });
    });

    return await pdfDoc.save();
}