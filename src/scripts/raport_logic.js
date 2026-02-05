/**
 * LOGIKA RAPORTU AIRTUR - Wersja Senior (ESM)
 */

export const getDynamicReportContent = (data) => {
    // 1. BEZPIECZNE POBIERANIE DANYCH
    const power = parseFloat(data.wynik_moc || data.calculatedPower || 0);
    const people = data.wynik_ludzie || "standard";
    const building = data.wynik_typ_budynku || "dom";
    const goalRaw = (data.wynik_cel || "").toLowerCase();
    const savingsBase = parseInt(data.wynik_oszczednosci?.toString().replace(/\D/g, '') || 0);
    const sunFactorValue = data.wynik_slonce || "0.10";

    // 2. LOGIKA ODRZUCONYCH ROZWIĄZAŃ
    let rejectedPowerClass = "1.5 - 2.0 kW";
    if (power > 2.6 && power <= 3.8) rejectedPowerClass = "2.5 kW";
    else if (power > 3.8 && power <= 5.5) rejectedPowerClass = "3.5 kW";
    else if (power > 5.5) rejectedPowerClass = "5.0 kW";

    // 3. DYNAMICZNA PORADA EKSPERTA
    let expertTipDynamic = "";
    if (people.includes('5') || people.includes('duża')) {
        expertTipDynamic = "Przy dużej liczbie domowników kluczowa jest sterylizacja filtrów. Rekomendujemy model z lampą UV-C lub jonizacją. ";
    } else {
        expertTipDynamic = "Dla mniejszej liczby użytkowników system będzie pracował głównie na niskich obrotach (inwerter), co wydłuża żywotność. ";
    }

    if (building === 'poddasze') {
        expertTipDynamic += "Specyfika poddasza sprawia, że ciepło kumuluje się pod skosami. Funkcja 3D Airflow skutecznie 'rozbije' te strefy.";
    } else if (building === 'biuro') {
        expertTipDynamic += "W przestrzeni biurowej skupiliśmy się na cichym nawiewie, aby zapewnić komfort pracy.";
    }

    // 4. MAPOWANIE CELU
    const goalMap = {
        'cisza': {
            label: 'Maksymalna Cisza i Regeneracja',
            desc: 'Twój priorytet to spokój. Wybraliśmy system o poziomie głośności od 19dB – to ciszej niż szept.'
        },
        'zdrowie': {
            label: 'Czyste Powietrze (Zdrowie)',
            desc: 'Skupiamy się na filtracji PM2.5 i jonizacji. Urządzenie nie przesusza powietrza.'
        },
        'oszczednosc': {
            label: 'Maksymalna Efektywność',
            desc: 'Inwestujesz w najniższy koszt eksploatacji. Wybrany model inwerterowy zwróci się najszybciej.'
        }
    };

    let currentGoal = goalMap['oszczednosc']; 
    if (goalRaw.includes('cisz')) currentGoal = goalMap['cisza'];
    if (goalRaw.includes('zdrow')) currentGoal = goalMap['zdrowie'];

    // 5. MAPOWANIE ETYKIET
    const buildingMap = { 
        'poddasze': 'Poddasze / Skosy', 
        'mieszkanie': 'Mieszkanie w bloku', 
        'dom': 'Dom Jednorodzinny', 
        'biuro': 'Biuro / Firma' 
    };

    const sunMap = {
        '0.08': 'Niskie (Północ / Wschód)',
        '0.10': 'Standardowe (Zachód)',
        '0.13': 'Wysokie (Południe / Witryny)'
    };

    // 6. FINALNY OBIEKT WYNIKOWY
    return {
        reportId: `AT-${Math.floor(1000 + Math.random() * 9000)}`,
        goalLabel: currentGoal.label,
        expertExplanation: currentGoal.desc,
        buildingType: buildingMap[building] || building,
        sunFactorLabel: sunMap[sunFactorValue] || 'Standardowe',
        rejectedPowerClass: rejectedPowerClass,
        expertTipDynamic: expertTipDynamic,
        savings5Years: (savingsBase * 5).toLocaleString('pl-PL'),
        savings10Years: (savingsBase * 10).toLocaleString('pl-PL'),
        date: new Date().toLocaleDateString('pl-PL'),
        modelPower: power > 0 ? `${power} kW` : '3.5 kW'
    };
};