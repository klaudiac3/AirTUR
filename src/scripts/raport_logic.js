// src/scripts/raport_logic.js
import { models, selectThreeModels } from '../components/narzedzia/kalkulator/models.js';

// ==========================================
// ⚙️ SŁOWNIKI I MAPY (Wyciągnięte z funkcji dla wydajności - Memory Optimization)
// ==========================================

const GOAL_MAP = {
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
    'ogrzewanie': {
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

const BUILDING_MAP = { 
    'poddasze': 'Poddasze / Ostatnie piętro', 
    'mieszkanie': 'Mieszkanie (Blok/Apartament)', 
    'dom': 'Dom Jednorodzinny', 
    'biuro': 'Przestrzeń Biurowa' 
};

const SUN_MAP = { 
    '0.08': 'Niskie (Północ/Wschód)', 
    '0.1': 'Standardowe (Zachód)', 
    '0.10': 'Standardowe (Zachód)', 
    '0.13': 'Wysokie (Południe/Witryny)' 
};

const FUEL_MAP = {
    'electric': 'Grzejniki Elektryczne',
    'coal_old': 'Węgiel / Stary Piec',
    'pellet': 'Pellet / Ekogroszek',
    'gas': 'Gaz Ziemny',
    'oil': 'Olej Opałowy',
    'district': 'Ciepło Miejskie'
};

const FALLBACK_MODELS = [
    { name: 'Model Standard', desc: 'Podstawowe urządzenie.', cat: 'Standard' },
    { name: 'AirTUR Smart', desc: 'Wydajne urządzenie dobrane do Twoich potrzeb.', cat: 'Złoty Środek' },
    { name: 'AirTUR Premium', desc: 'Urządzenie najwyższej klasy.', cat: 'Premium' }
];

// ==========================================
// 🛡️ HELPERS: BEZPIECZNE PARSOWANIE (Chronią przed błędem NaN)
// ==========================================
const safeFloat = (val, fallback = 0) => {
    const parsed = parseFloat(String(val || '').replace(',', '.'));
    return isNaN(parsed) ? fallback : parsed;
};

const safeString = (val) => String(val || '').toLowerCase().trim();

// ==========================================
// 🚀 GŁÓWNY SILNIK GENEROWANIA TREŚCI
// ==========================================
export const getDynamicReportContent = (data = {}) => {
    // 1. BEZPIECZNE PARSOWANIE DANYCH WEJŚCIOWYCH
    const power = safeFloat(data.calculatedPower || data.wynik_moc);
    const peopleRaw = safeFloat(data.peopleCount || data.wynik_ludzie);
    
    const savingsRaw = String(data.savingsYear || data.wynik_oszczednosci || '0').replace(/\D/g, '');
    const savingsVal = parseInt(savingsRaw, 10) || 0;

    const building = safeString(data.wynik_typ_budynku || data.typ_budynku);
    const goalRaw = safeString(data.wynik_cel || data.goal);
    const fuelKey = safeString(data.wynik_paliwo || data.selectedFuel);
    const peopleText = String(data.wynik_ludzie || data.peopleCount || '');

    // 2. NORMALIZACJA CELU
    let goalKey = 'ogrzewanie'; 
    if (goalRaw.includes('komfort')) goalKey = 'komfort';
    else if (goalRaw.includes('zdrowie') || goalRaw.includes('alerg')) goalKey = 'zdrowie';
    else if (goalRaw.includes('cisza') || goalRaw.includes('sypial')) goalKey = 'cisza';
    else if (goalRaw.includes('design')) goalKey = 'design';
    
    // 3. POBIERANIE DANYCH 3 MODELI Z MODELS.JS
    const isMultisplit = String(data.isMultisplit) === 'true' || power > 7.2;
    let threeModels = { eco: null, smart: null, premium: null };
    let selectedModelData = {};
    let selectionLabel = 'Nasza optymalna rekomendacja:';
    
    if (isMultisplit) {
        selectedModelData = {
            name: 'System Multi Split',
            desc: 'Dla dużych przestrzeni wycena i dobór jednostek wymaga indywidualnego projektu inżynierskiego, który właśnie dla Ciebie przygotowujemy.'
        };
        selectionLabel = 'Zalecana technologia instalacji:';
    } else {
        // STANDARDOWA LOGIKA 3 MODELI
        let powerBasket = '7.0';
        if (power <= 2.8) powerBasket = '2.5';
        else if (power <= 3.8) powerBasket = '3.5';
        else if (power <= 5.5) powerBasket = '5.0';

        const availableModels = (models[goalKey] && models[goalKey][powerBasket]) 
            ? models[goalKey][powerBasket] 
            : FALLBACK_MODELS;

        threeModels = selectThreeModels(availableModels) || { eco: null, smart: null, premium: null };

        let selectedTier = 'smart'; 
        if (data.wynik_wybrany_tier && data.wynik_wybrany_tier.trim() !== "") {
            selectedTier = data.wynik_wybrany_tier.toLowerCase();
            selectionLabel = 'Twój wstępny wybór:'; 
        }
        selectedModelData = threeModels[selectedTier] || threeModels.smart || availableModels[0];
    }

    const expertExplanationFromDb = isMultisplit 
        ? "Zapotrzebowanie powyżej 7kW oznacza, że pojedynczy klimatyzator ścienny wygenerowałby niekomfortowy podmuch powietrza (tzw. przeciąg) i hałas. Rozwiązaniem jest podział tej mocy na kilka mniejszych, dyskretnych jednostek w różnych punktach domu, zasilanych z jednego wydajnego agregatu zewnętrznego."
        : (selectedModelData?.desc || '-');

    // 4. MAPA CELÓW (Opisy "Hero" i ROI)
    const currentGoalData = GOAL_MAP[goalKey] || GOAL_MAP['ogrzewanie'];

    // 5. LOGIKA ODRZUCENIA (Dlaczego NIE mniejszy?) - 🔥 NAPRAWIONY BUG Z ">"
    let rejectionText = "";
    if (isMultisplit) {
        rejectionText = "Odrzuciliśmy standardowe pojedyncze klimatyzatory typu Split. W tak dużych przestrzeniach jedno urządzenie nie jest w stanie równomiernie rozprowadzić chłodu/ciepła bez drastycznej utraty komfortu akustycznego.";
    } else if (power > 3.8) {
        rejectionText = "Odrzuciliśmy standardowe modele 3.5kW. Kubatura Twojego pomieszczenia wymaga większego przepływu powietrza, aby schłodzić każdy kąt równomiernie. Słabsza jednostka działałaby na 100% obciążenia, co generuje hałas i wyższe rachunki.";
    } else if (power > 2.8) {
        rejectionText = "Odrzuciliśmy modele o mocy 2.5kW. Przy Twoich parametrach (metraż + nasłonecznienie) pracowałyby one na skraju swoich możliwości, co generuje hałas i wyższe rachunki. Model 3.5kW zapewni 'zapas mocy' i cichą pracę.";
    } else {
        rejectionText = "Odrzuciliśmy przewymiarowane modele 3.5kW. Do Twojego metrażu mniejsza jednostka będzie idealna – nie ma sensu przepłacać za moc, której nie wykorzystasz i która powodowałaby ciągłe włączanie i wyłączanie się urządzenia.";
    }

    // 6. INTELIGENTNA PORADA (Context Tip)
    let expertTipDynamic = "";
    const isManyPeople = peopleRaw >= 0.3 || peopleText.includes('3') || peopleText.includes('5');

    if (isManyPeople) {
        expertTipDynamic = "Przy większej liczbie domowników rekomendujemy system z aktywną sterylizacją filtrów (UV-C lub Jonizacja), aby na bieżąco neutralizować bakterie w powietrzu.";
    } else if (building.includes('poddasz')) {
        expertTipDynamic = "Specyfika poddasza powoduje kumulację ciepła pod sufitem. Dobrany model posiada funkcję 3D Airflow, która skutecznie wymiesza powietrze w całej kubaturze.";
    } else {
        expertTipDynamic = "Pamiętaj, że kluczem do trwałości jest regularny serwis. Nasz autoryzowany przegląd wydłuża żywotność urządzenia nawet o 30%.";
    }

    // 7. TŁUMACZENIA ETYKIET
    const heatSourceLabel = FUEL_MAP[fuelKey] || data.wynik_paliwo || "Nie określono";
    const reportId = `AT-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
        reportId,
        date: new Date().toLocaleDateString('pl-PL'),
        
        // 🔥 WYSYŁAMY FLAGĘ MULTISPLIT DO BACKENDU (Dla E-maila)
        isMultisplit: isMultisplit,
        
        // Hero
        heroHeadline: `Twój Plan na: ${currentGoalData.label}`,
        heroDesc: currentGoalData.heroDesc,
        roiPsychology: currentGoalData.roiNote,
        
        // Dane Techniczne
        buildingType: BUILDING_MAP[building] || data.wynik_typ_budynku || building,
        sunFactorLabel: SUN_MAP[String(data.sunFactor || data.wynik_slonce)] || 'Standardowe',
        currentHeatSource: heatSourceLabel,
        
        // Diagnoza
        modelPower: (power > 0 ? power.toFixed(1) : '3.5') + ' kW',
        modelName: selectedModelData.name || 'Model AirTUR', 
        expertExplanation: expertExplanationFromDb, 
        
        // Etykieta wyboru
        selectionLabel,
        
        // Trzy modele dla tabeli
        modelEco: threeModels.eco || {},
        modelSmart: threeModels.smart || {},
        modelPremium: threeModels.premium || {},

        rejectionText,
        expertTipDynamic,
        
        // Finanse
        savingsYear: savingsVal.toLocaleString('pl-PL'),
        savings5Years: (savingsVal * 5).toLocaleString('pl-PL'),
        savings10Years: (savingsVal * 10).toLocaleString('pl-PL')
    };
};