// src/scripts/raport_logic.js
import { models, selectThreeModels } from '../components/narzedzia/kalkulator/models.js';

// Logika dopasowująca treści do wyników kalkulatora AirTUR
export const getDynamicReportContent = (data) => {
    // 1. BEZPIECZNE PARSOWANIE DANYCH WEJŚCIOWYCH
    const power = parseFloat(String(data.calculatedPower || data.wynik_moc || '0').replace(',', '.'));
    const peopleRaw = parseFloat(String(data.peopleCount || data.wynik_ludzie || '0').replace(',', '.'));
    
    // Oszczędności: Czyścimy wszystko co nie jest cyfrą
    const savingsRaw = String(data.savingsYear || data.wynik_oszczednosci || '0').replace(/\D/g, '');
    const savingsVal = parseInt(savingsRaw, 10) || 0;

    const building = String(data.wynik_typ_budynku || data.typ_budynku || '').toLowerCase();
    const goalRaw = String(data.wynik_cel || data.goal || '').toLowerCase();
    const fuelKey = String(data.wynik_paliwo || data.selectedFuel || '').toLowerCase();
    const peopleText = String(data.wynik_ludzie || data.peopleCount || '');

    // ==========================================
    // 2. NORMALIZACJA CELU (Dla models.js i Mapy Celów)
    // ==========================================
    let goalKey = 'ogrzewanie'; // Domyślny (Oszczędność)
    if (goalRaw.includes('komfort')) goalKey = 'komfort';
    else if (goalRaw.includes('zdrowie') || goalRaw.includes('alerg')) goalKey = 'zdrowie';
    else if (goalRaw.includes('cisza') || goalRaw.includes('sypial')) goalKey = 'cisza';
    else if (goalRaw.includes('design')) goalKey = 'design';
    
    // ==========================================
    // 3. POBIERANIE DANYCH 3 MODELI Z MODELS.JS
    // ==========================================
    // Określamy "koszyk" mocy, tak samo jak w Kalkulatorze
    let powerBasket = '2.5';
    if (power <= 2.8) powerBasket = '2.5';
    else if (power <= 3.8) powerBasket = '3.5';
    else if (power <= 5.5) powerBasket = '5.0';
    else if (power <= 7.2) powerBasket = '7.0';
    else powerBasket = '7.0';

    let availableModels = [];
    if (models[goalKey] && models[goalKey][powerBasket]) {
        availableModels = models[goalKey][powerBasket];
    } else {
        // Fallback jeśli czegoś zabraknie
        availableModels = [
            { name: 'Model Standard', desc: 'Podstawowe urządzenie.', cat: 'Standard' },
            { name: 'AirTUR Smart', desc: 'Wydajne urządzenie dobrane do Twoich potrzeb.', cat: 'Złoty Środek' },
            { name: 'AirTUR Premium', desc: 'Urządzenie najwyższej klasy.', cat: 'Premium' }
        ];
    }

    // Wyciągamy dokładnie 3 karty, gwarantując brak duplikatów (logika z models.js)
    const threeModels = selectThreeModels(availableModels) || { eco: null, smart: null, premium: null };

    // 🔥 KULOODPORNE SPRAWDZANIE WYBORU KLIENTA PO 'TIER' (eco/smart/premium)
    const selectedTier = data.wynik_wybrany_tier || 'smart'; // domyślnie 'smart'
    
    let selectedModelData = threeModels[selectedTier]; 
    if (!selectedModelData) {
        // Awaryjne zabezpieczenie, gdyby coś poszło nie tak
        selectedModelData = threeModels.smart || availableModels[0];
    }

    // Opis wybranego modelu dla inżyniera
    const expertExplanationFromDb = selectedModelData.desc;

    // ==========================================
    // 4. MAPA CELÓW (Opisy "Hero" i ROI)
    // ==========================================
    const goalMap = {
        'cisza': {
            label: 'Absolutną Ciszę i Regenerację',
            heroDesc: 'Priorytetem jest Twój sen i spokój. Wybrana konfiguracja zapewni pracę urządzenia na poziomie głośności szeptu (od 19dB), co pozwoli Ci wypoczywać bez irytującego szumu tła.',
            roiNote: 'Twoje oszczędności to równowartość lat spokojnego snu bez martwienia się o rachunki.'
        },
        'zdrowie': {
            label: 'Zdrowy Dom Wolny od Alergenów',
            heroDesc: 'Skupiamy się na jakości powietrza. Dobrana moc pozwoli na efektywną filtrację PM2.5 i wirusów, utrzymując jednocześnie optymalną wilgotność, aby chronić drogi oddechowe Twojej rodziny.',
            roiNote: 'Zaoszczędzone środki możesz przeznaczyć na zdrowie rodziny, zamiast oddawać je elektrowni.'
        },
        'ogrzewanie': { // Oszczędność
            label: 'Maksymalną Efektywność Energetyczną',
            heroDesc: 'Inwestujesz w najniższy możliwy koszt eksploatacji (TCO). System został dobrany tak, aby pracować w najwyższym punkcie sprawności (SCOP), co gwarantuje najszybszy zwrot z inwestycji.',
            roiNote: 'To czysty zysk. Twoja instalacja zacznie zarabiać na siebie szybciej, niż lokata bankowa.'
        },
        'komfort': {
            label: 'Idealny Komfort Termiczny',
            heroDesc: 'Koniec z walką o temperaturę. System zapewni stabilne warunki w Twoim domu niezależnie od upałów czy mrozów na zewnątrz, eliminując strefy zimna.',
            roiNote: 'Komfort, który nie kosztuje fortuny. Inwestycja zwraca się w niższych rachunkach.'
        },
        'design': {
            label: 'Nowoczesny Design i Estetykę',
            heroDesc: 'Stawiamy na harmonię. Urządzenie stanie się ozdobą Twojego wnętrza, łącząc minimalistyczną formę z najwyższą technologią ukrytą wewnątrz obudowy.',
            roiNote: 'Piękno, które na siebie zarabia. Oszczędność energii w najlepszym stylu.'
        }
    };

    // Wybieramy zestaw tekstów (z fallbackiem na ogrzewanie)
    let currentGoalData = goalMap[goalKey] || goalMap['ogrzewanie'];

    // ==========================================
    // 5. LOGIKA ODRZUCENIA (Dlaczego NIE mniejszy?)
    // ==========================================
    let rejectionText = "";
    
    if (power > 3.8) {
        rejectionText = "Odrzuciliśmy standardowe modele 3.5kW. Kubatura Twojego pomieszczenia wymaga większego przepływu powietrza, aby schłodzić każdy kąt równomiernie. Słabsza jednostka działałaby na 100% obciążenia, co generuje hałas i wyższe rachunki.";
    } else if (power > 2.8) {
        rejectionText = "Odrzuciliśmy modele o mocy 2.5kW. Przy Twoich parametrach (metraż + nasłonecznienie) pracowałyby one na skraju swoich możliwości, co generuje hałas i wyższe rachunki. Model 3.5kW zapewni 'zapas mocy' i cichą pracę.";
    } else {
        rejectionText = "Odrzuciliśmy przewymiarowane modele 3.5kW. Do Twojego metrażu mniejsza jednostka będzie idealna – nie ma sensu przepłacać za moc, której nie wykorzystasz i która powodowałaby ciągłe włączanie i wyłączanie się urządzenia.";
    }

    // ==========================================
    // 6. INTELIGENTNA PORADA (Context Tip)
    // ==========================================
    let expertTipDynamic = "";
    const isManyPeople = peopleRaw >= 0.3 || peopleText.includes('3') || peopleText.includes('5');

    if (isManyPeople) {
        expertTipDynamic = "Przy większej liczbie domowników rekomendujemy system z aktywną sterylizacją filtrów (UV-C lub Jonizacja), aby na bieżąco neutralizować bakterie w powietrzu.";
    } else if (building.includes('poddasz')) {
        expertTipDynamic = "Specyfika poddasza powoduje kumulację ciepła pod sufitem. Dobrany model posiada funkcję 3D Airflow, która skutecznie wymiesza powietrze w całej kubaturze.";
    } else {
        expertTipDynamic = "Pamiętaj, że kluczem do trwałości jest regularny serwis. Nasz autoryzowany przegląd wydłuża żywotność urządzenia nawet o 30%.";
    }

    // ==========================================
    // 7. TŁUMACZENIA ETYKIET
    // ==========================================
    const buildingMap = { 
        'poddasze': 'Poddasze / Ostatnie piętro', 
        'mieszkanie': 'Mieszkanie (Blok/Apartament)', 
        'dom': 'Dom Jednorodzinny', 
        'biuro': 'Przestrzeń Biurowa' 
    };
    const sunMap = { 
        '0.08': 'Niskie (Północ/Wschód)', 
        '0.1': 'Standardowe (Zachód)', 
        '0.10': 'Standardowe (Zachód)', 
        '0.13': 'Wysokie (Południe/Witryny)' 
    };
    const fuelMap = {
        'electric': 'Grzejniki Elektryczne',
        'coal_old': 'Węgiel / Stary Piec',
        'pellet': 'Pellet / Ekogroszek',
        'gas': 'Gaz Ziemny',
        'oil': 'Olej Opałowy',
        'district': 'Ciepło Miejskie'
    };
    let heatSourceLabel = fuelMap[fuelKey] || data.wynik_paliwo || "Nie określono";

    const reportId = `AT-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
        reportId: reportId,
        date: new Date().toLocaleDateString('pl-PL'),
        
        // Hero
        heroHeadline: `Twój Plan na: ${currentGoalData.label}`,
        heroDesc: currentGoalData.heroDesc,
        roiPsychology: currentGoalData.roiNote,
        
        // Dane
        buildingType: buildingMap[building] || data.wynik_typ_budynku || building,
        sunFactorLabel: sunMap[String(data.sunFactor || data.wynik_slonce)] || 'Standardowe',
        currentHeatSource: heatSourceLabel,
        
        // Diagnoza - Wybrany model
        modelPower: (isNaN(power) ? '3.5' : power.toFixed(1)) + ' kW',
        modelName: selectedModelData.name, 
        expertExplanation: expertExplanationFromDb, 
        
        // Trzy modele dla tabeli w PDF i Mailu
        modelEco: threeModels.eco || {},
        modelSmart: threeModels.smart || {},
        modelPremium: threeModels.premium || {},

        rejectionText: rejectionText,
        expertTipDynamic: expertTipDynamic,
        
        // Finanse
        savingsYear: savingsVal.toLocaleString('pl-PL'),
        savings5Years: (savingsVal * 5).toLocaleString('pl-PL'),
        savings10Years: (savingsVal * 10).toLocaleString('pl-PL')
    };
};