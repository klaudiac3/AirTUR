// Logika dopasowująca treści do wyników kalkulatora AirTUR
export const getDynamicReportContent = (data) => {
    const power = parseFloat(data.calculatedPower);
    const people = parseFloat(data.peopleCount);
    const building = data.typ_budynku; // poddasze, mieszkanie, dom, biuro
    const goal = data.goal; // cisza, zdrowie, oszczednosc

    // 1. LOGIKA ODRZUCONYCH ROZWIĄZAŃ (Dlaczego nie mniejszy?)
    let rejectedPowerClass = "1.5 - 2.0";
    if (power > 2.6 && power <= 3.8) rejectedPowerClass = "2.5";
    else if (power > 3.8 && power <= 5.5) rejectedPowerClass = "3.5";
    else if (power > 5.5) rejectedPowerClass = "5.0";

    // 2. DYNAMICZNA PORADA EKSPERTA (Zależna od osób i budynku)
    let expertTipDynamic = "";
    
    // Warunek: Liczba osób (założenie: peopleFactor 0.2 = 1 osoba, 1.0 = 5 osób)
    if (people >= 0.8) {
        expertTipDynamic = "Przy 5+ domownikach kluczowa jest sterylizacja filtrów. Rekomendujemy model z lampą UV-C lub jonizacją, aby neutralizować wirusy i bakterie w obiegu ciągłym. ";
    } else {
        expertTipDynamic = "Dla 1-2 użytkowników system będzie pracował na niskich obrotach (inwerter), co drastycznie wydłuża żywotność sprężarki. ";
    }

    // Warunek: Budynek
    if (building === 'poddasze') {
        expertTipDynamic += "Specyfika poddasza sprawia, że ciepło kumuluje się pod skosami. Wybrany model posiada funkcję 3D Airflow, która 'rozbija' poduszkę ciepłego powietrza przy suficie.";
    } else if (building === 'biuro') {
        expertTipDynamic += "W przestrzeni biurowej skupiliśmy się na czystości nawiewu, aby uniknąć efektu 'suchego oka' u pracowników.";
    }

    // 3. OPIS CELU (Wizualizacja komfortu)
    const goalMap = {
        'cisza': {
            label: 'Maksymalna Cisza i Regeneracja',
            desc: 'Twój priorytet to spokój. Wybraliśmy system o poziomie głośności od 19dB – to ciszej niż szept w bibliotece. Twoje oszczędności pozwolą na lata spokojnego snu bez obaw o rachunki.'
        },
        'zdrowie': {
            label: 'Czyste Powietrze i Zdrowie Domowników',
            desc: 'Skupiamy się na filtracji PM2.5. Dzięki wyliczonej mocy, urządzenie nie będzie przesuszać powietrza, utrzymując optymalną wilgotność dla Twoich dróg oddechowych.'
        },
        'oszczednosc': {
            label: 'Maksymalna Efektywność Energetyczna',
            desc: 'Inwestujesz w najniższy koszt eksploatacji. Wybrany model zwróci się najszybciej, wykorzystując pełen potencjał technologii inwerterowej przy Twoim metrażu.'
        }
    };

    const currentGoal = goalMap[goal] || { label: 'Komfort Termiczny', desc: 'Dopasowaliśmy system tak, aby utrzymać stałą temperaturę przy minimalnym zużyciu energii.' };

    // 4. MAPOWANIE ETYKIET (Dla tabeli danych)
    const buildingMap = { 'poddasze': 'Poddasze / Ostatnie piętro', 'mieszkanie': 'Mieszkanie (Blok/Apartament)', 'dom': 'Dom Jednorodzinny', 'biuro': 'Przestrzeń Biurowa' };
    const sunMap = { '0.08': 'Niskie (północ/wschód)', '0.10': 'Standardowe (zachód)', '0.13': 'Wysokie (południe/witryny)' };

    return {
        reportId: `AT-${Math.floor(1000 + Math.random() * 9000)}`,
        goalLabel: currentGoal.label,
        cel_opis: currentGoal.desc,
        buildingType: buildingMap[building] || building,
        sunFactorLabel: sunMap[data.sunFactor] || 'Standardowe',
        rejectedPowerClass: rejectedPowerClass,
        expertTipDynamic: expertTipDynamic,
        savings5Years: (parseInt(data.savingsYear) * 5).toLocaleString('pl-PL'),
        savings10Years: (parseInt(data.savingsYear) * 10).toLocaleString('pl-PL'),
        date: new Date().toLocaleDateString('pl-PL')
    };
};