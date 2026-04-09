// 1. DANE RYNKOWE I KONFIGURACJA OBLICZEŃ
// ==========================================
// Edytuj tę sekcję, gdy zmienią się ceny prądu lub paliw.

export const MARKET_DATA = {
    electricityPrice: 1.15, // Cena prądu (zł/kWh) - średnia z opłatami dystrybucyjnymi
    airturSCOP: 4.0,        // Sezonowa efektywność AirTUR (z 1kWh prądu robi 4kWh ciepła)
   
    // Definicje paliw i ich parametrów fizycznych
    fuels: {
        // 'klucz': { nazwa, wartość opałowa (kWh/jednostkę), cena (zł/jednostkę), sprawność pieca (0-1) }
       
        'electric': {
            name: 'Prąd (Grzejniki)',
            value: 1,
            price: 1.00, // 1 zł za 1 kWh energii (uproszczenie, bo 100% sprawności)
            efficiency: 1.00
        },
        'coal_old': {
            name: 'Węgiel/Drewno',
            value: 8.0,   // ~8 kWh z 1 kg węgla
            price: 2.00,  // ~2000 zł za tonę = 2 zł za kg
            efficiency: 0.60 // Kopciuch marnuje 40% ciepła
        },
        'pellet': {
            name: 'Pellet/Eko',    
            value: 5.0,   // ~5 kWh z 1 kg
            price: 1.90,  // ~1900 zł za tonę
            efficiency: 0.85
        },
        'gas': {
            name: 'Gaz Ziemny',    
            value: 11.0,  // ~11 kWh z 1 m3
            price: 4.50,  // cena za m3 z przesyłem
            efficiency: 0.90
        },
        'oil': {
            name: 'Olej Opałowy',  
            value: 10.0,  // ~10 kWh z litra
            price: 6.50,  // cena za litr
            efficiency: 0.85
        },
        'district': {
            name: 'Ciepło Miejskie',
            value: 1,
            price: 0.15, // Uproszczony przelicznik kosztu jednostki ciepła
            efficiency: 1.00
        }
    }
};

// ==========================================
// 2. LOGIKA KART (TIERS) - UI CONFIG
// ==========================================
export const TIERS = {
  ECO: {
    id: 'eco',
    label: 'EKONOMICZNY',
    tagline: 'Mądry wybór na start',
    borderColor: 'border-airtur-dark',
    bgColor: 'bg-[#F6F7FA]',
    badgeColor: 'bg-airtur-dark',
    textColor: 'text-airtur-dark',
    indicators: { price: 1, tech: 3 },
    isDarkTheme: false
  },
  SMART: {
    id: 'smart',
    label: 'REKOMENDACJA EKSPERTA',
    tagline: 'Lider opłacalności',
    borderColor: 'border-airtur-blue',
    bgColor: 'bg-white',
    badgeColor: 'bg-airtur-blue',
    textColor: 'text-airtur-navy',
    indicators: { price: 3, tech: 4 },
    isDarkTheme: false,
    highlight: true
  },
  PREMIUM: {
    id: 'premium',
    label: 'TECHNOLOGIA HI-END',
    tagline: 'Japońska Perfekcja',
    borderColor: 'border-airtur-navy',
    bgColor: 'bg-[#212529]',
    badgeColor: 'bg-airtur-navy',
    textColor: 'text-white',
    taglineColor: 'text-airtur-blue',
    indicators: { price: 5, tech: 5 },
    isDarkTheme: true
  }
};

// ==========================================
// 3. MAPOWANIE KATEGORII NA SLOTY
// ==========================================
const CATEGORY_MAP = {
  'Ogrzewanie / Smart Choice': 'ECO',
  'Ogrzewanie / Budżet': 'ECO',
  'Ogrzewanie / Ekonomiczne': 'ECO',
  'Ogrzewanie / Standard': 'ECO',
  'Komfort / Budżet': 'ECO',
  'Komfort / Ekonomiczny': 'ECO',
  'Komfort / Standard': 'ECO',
  'Komfort / Cena-Jakość': 'ECO',
  'Zdrowie / Smart Choice': 'ECO',
  'Zdrowie / Cena': 'ECO',
  'Cisza / Budżet': 'ECO',
  'Cisza / Ekonomiczny': 'ECO',
  'Design / Budżet': 'ECO',

  'Ogrzewanie / Złoty Środek': 'SMART',
  'Ogrzewanie / Standard Premium': 'SMART',
  'Ogrzewanie / Wytrzymałość': 'SMART',
  'Komfort / Funkcjonalność': 'SMART',
  'Komfort / Szybkość': 'SMART',
  'Komfort / 4D': 'SMART',
  'Komfort / Zdrowy nawiew': 'SMART',
  'Komfort / Higiena': 'SMART',
  'Zdrowie / Standard': 'SMART',
  'Zdrowie / Funkcjonalny': 'SMART',
  'Zdrowie / Zapachy': 'SMART',
  'Cisza / Złoty Środek': 'SMART',
  'Cisza / Solidność': 'SMART',
  'Cisza / Dyskrecja': 'SMART',
  'Design / Mat': 'SMART',
  'Design / Alternatywa': 'SMART',
  'Design / Trend': 'SMART',

  'Ogrzewanie / Premium': 'PREMIUM',
  'Ogrzewanie / Hi-End': 'PREMIUM',
  'Ogrzewanie / Innowacja': 'PREMIUM',
  'Komfort / Smart': 'PREMIUM',
  'Komfort / Oszczędność': 'PREMIUM',
  'Komfort / Jakość': 'PREMIUM',
  'Zdrowie / Lider': 'PREMIUM',
  'Zdrowie / Hi-End': 'PREMIUM',
  'Zdrowie / Technologia': 'PREMIUM',
  'Zdrowie / Bez wiatru': 'PREMIUM',
  'Zdrowie / Design': 'PREMIUM',
  'Cisza / Lider': 'PREMIUM',
  'Cisza / Premium': 'PREMIUM',
  'Cisza / Hi-End': 'PREMIUM',
  'Cisza / Ultra Cichy': 'PREMIUM',
  'Cisza / Bez wiatru': 'PREMIUM',
  'Design / Klasyk': 'PREMIUM',
  'Design / Połysk': 'PREMIUM',
  'Design / Ikona': 'PREMIUM',
  'Design / Odważny': 'PREMIUM',
  'Design / Tekstylny': 'PREMIUM',
  'Design / Minimalizm': 'PREMIUM'
};

// Pomocniczy helper określający "rangę" modelu
function getModelRank(model) {
    if (CATEGORY_MAP[model.cat]) return CATEGORY_MAP[model.cat];
    
    // Fallback: szukanie słów kluczowych w nazwie kategorii
    const cat = model.cat.toLowerCase();
    if (cat.includes('premium') || cat.includes('hi-end') || cat.includes('lider')) return 'PREMIUM';
    if (cat.includes('standard') || cat.includes('budżet') || cat.includes('eko')) return 'ECO';
    return 'SMART'; // Domyślnie środek
}

// 🔥 POPRAWIONA FUNKCJA: Wybiera 3 unikalne modele z podziałem na rangi
export function selectThreeModels(modelsArray) {
    if (!modelsArray || modelsArray.length === 0) return null;

    let result = { eco: null, smart: null, premium: null };
    const usedIndices = new Set();

    // 1. Pierwsze przejście: Szukamy idealnych dopasowań dla każdego slotu
    modelsArray.forEach((model, index) => {
        const rank = getModelRank(model);
        if (rank === 'ECO' && !result.eco) {
            result.eco = model;
            usedIndices.add(index);
        } else if (rank === 'SMART' && !result.smart) {
            result.smart = model;
            usedIndices.add(index);
        } else if (rank === 'PREMIUM' && !result.premium) {
            result.premium = model;
            usedIndices.add(index);
        }
    });

    // 2. Drugie przejście: Wypełniamy puste sloty pozostałymi modelami (unikając duplikatów)
    const slots = ['eco', 'smart', 'premium'];
    slots.forEach(slot => {
        if (!result[slot]) {
            // Szukamy modelu, który nie jest jeszcze w żadnym innym slocie
            for (let i = 0; i < modelsArray.length; i++) {
                if (!usedIndices.has(i)) {
                    result[slot] = modelsArray[i];
                    usedIndices.add(i);
                    break;
                }
            }
        }
    });

    // 3. FAILSAFE (Zabezpieczenie przed błędem UI)
    // Jeśli w koszyku masz tylko 1 lub 2 modele, duplikujemy pierwszy lepszy do brakujących slotów
    const fallbackModel = result.smart || result.eco || result.premium || modelsArray[0];
    slots.forEach(slot => {
        if (!result[slot]) {
            result[slot] = fallbackModel;
        }
    });

    return result;
}

// ==========================================
// 4. BAZA MODELI
// ==========================================
export const models = {
  'ogrzewanie': {
    '2.5': [
      { 
        name: 'Gree Amber Standard 2.7kW', 
        desc: 'Wysoka wydajność grzewcza w kompaktowej obudowie. Idealny kompromis ceny do możliwości grzewczych w małych pomieszczeniach.', 
        cat: 'Ogrzewanie / Standard', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A++', 
        noise: '24 dB (min) - 41 dB (max)', 
        filter: 'Jonizator plazmowy', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -22°C, Chłodzenie: do +43°C' 
      },
      { 
        name: 'Rotenso Imoto X 2.6kW', 
        desc: 'Dedykowany pakiet zimowy w niższej cenie. Grzałka tacy ociekowej zapobiega zamarzaniu jednostki zewnętrznej. Ekonomiczny wybór.', 
        cat: 'Ogrzewanie / Smart Choice', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '21 dB (tryb cichy)', 
        filter: 'Filtr Cold Plasma (jonizator), HEPA, antybakteryjny', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -22°C, Chłodzenie: do +50°C' 
      },
      { 
        name: 'Haier Nordic Flexis Plus 2.6kW', 
        desc: 'Czujnik ECO wykrywa obecność domowników, oszczędzając energię, gdy nikogo nie ma. Zaprojektowany z myślą o skandynawskich mrozach.', 
        cat: 'Ogrzewanie / Złoty Środek', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A++', 
        noise: '16 dB (tryb cichy)', 
        filter: 'Sterylizacja UV-C, Self-Clean (wymrażanie)', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -25°C, Chłodzenie: do +43°C' 
      },
      { 
        name: 'Mitsubishi Heavy Diamond 2.5kW (SRK-ZSX)', 
        desc: 'Japoński lider współczynnika SCOP. Jeśli planujesz ogrzewać tym pokojem przez całą zimę, ten model zwróci się najszybciej w rachunkach.', 
        cat: 'Ogrzewanie / Hi-End', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A+++', 
        noise: '19 dB (tryb cichy)', 
        filter: 'Antyalergenowy, fotokatalityczny (odwaniający)', 
        wifi: 'Opcja (wymaga adaptera)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +46°C' 
      }
    ],
    '3.5': [
      { 
        name: 'Gree Amber Prestige 3.5kW', 
        desc: 'Absolutny lider ogrzewania. Dwustopniowa sprężarka pozwala na wydajną pracę nawet przy -30°C, drastycznie obniżając koszty ogrzewania.', 
        cat: 'Ogrzewanie / Premium', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A+++', 
        noise: '18 dB (tryb cichy)', 
        filter: 'Jonizator plazmowy', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -30°C, Chłodzenie: do +52°C' 
      },
      { 
        name: 'Cooper&Hunter Supreme Continental 3.5kW', 
        desc: 'Tańsza alternatywa dla Prestige’a o podobnej konstrukcji. Solidna budowa i praca do -25°C przy zachowaniu rozsądnej ceny.', 
        cat: 'Ogrzewanie / Smart Choice', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A+++', 
        noise: '18 dB (min)', 
        filter: 'CH 7-SKY (wielostopniowa filtracja), Jonizator', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -25°C, Chłodzenie: do +43°C' 
      },
      { 
        name: 'Daikin Perfera Cold Region 3.5kW', 
        desc: 'Legendarna trwałość Daikin. Specjalny kompresor typu Swing eliminuje ryzyko wycieków czynnika i gwarantuje stabilne ciepło przez lata.', 
        cat: 'Ogrzewanie / Premium', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A+++', 
        noise: '19 dB (tryb cichy)', 
        filter: 'Flash Streamer, filtr tytanowo-apatytowy, srebrowy', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -25°C, Chłodzenie: do +50°C' 
      },
      { 
        name: 'Fujitsu Nordic KHCAN 3.5kW', 
        desc: 'Urządzenie o pancernej wytrzymałości. Może mniej urodziwe, ale stworzone do ciężkiej, ciągłej pracy jako główne źródło ciepła.', 
        cat: 'Ogrzewanie / Wytrzymałość', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '21 dB (tryb cichy)', 
        filter: 'Polifenolowy, Jonowy', 
        wifi: 'Opcja (wymaga adaptera)', 
        range: 'Grzanie: do -25°C, Chłodzenie: do +46°C' 
      }
    ],
    '5.0': [
      { 
        name: 'Panasonic Nordic Heatcharge 5.0kW', 
        desc: 'Magazynuje ciepło odpadowe ze sprężarki, dzięki czemu grzeje non-stop, nawet podczas odmrażania jednostki. Unikalna technologia na rynku.', 
        cat: 'Ogrzewanie / Innowacja', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A+++', 
        noise: '23 dB (min)', 
        filter: 'Nanoe-G (oczyszczanie powietrza)', 
        wifi: 'Opcja (zależnie od rocznika, często wymaga adaptera)', 
        range: 'Grzanie: do -35°C, Chłodzenie: do +43°C' 
      },
      { 
        name: 'Gree Amber Prestige 5.3kW', 
        desc: 'Klasyka gatunku. Potężna jednostka o klasie A+++. Jeśli szukasz sprawdzonego "woła roboczego" do dużego salonu, to bezpieczny wybór.', 
        cat: 'Ogrzewanie / Standard Premium', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A++', 
        noise: '33 dB (min) - wyższa wydajność kosztem głośności', 
        filter: 'Jonizator plazmowy', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -30°C, Chłodzenie: do +52°C' 
      },
      { 
        name: 'Rotenso Mirai 5.3kW', 
        desc: 'Najwyższa klasa oszczędności (A+++) w cenie klasy średniej. Świetny wybór, jeśli chcesz dogrzewać dużą przestrzeń nie wydając fortuny na start.', 
        cat: 'Ogrzewanie / Smart Choice', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A+++', 
        noise: '30 dB (min)', 
        filter: 'HEPA, Cold Plasma (jonizator)', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -30°C, Chłodzenie: do +50°C' 
      },
      { 
        name: 'Mitsubishi Electric LN (Hyper Heating) 5.0kW', 
        desc: 'Technologia Hyper Heating gwarantuje 100% mocy nominalnej nawet przy -15°C. Design i moc w jednym, dla najbardziej wymagających.', 
        cat: 'Ogrzewanie / Hi-End', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A++', 
        noise: '27 dB (min)', 
        filter: 'Plasma Quad Plus (zaawansowana plazma)', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -25°C, Chłodzenie: do +46°C' 
      }
    ],
    '7.0': [
      { 
        name: 'Gree Amber Prestige 7.0kW', 
        desc: 'Maksymalna moc grzewcza w najlepszej cenie. To urządzenie to w praktyce pełnoprawna pompa ciepła powietrze-powietrze dla dużych otwartych przestrzeni.', 
        cat: 'Ogrzewanie / Premium', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '38 dB (min)', 
        filter: 'Jonizator plazmowy', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -30°C, Chłodzenie: do +52°C' 
      },
      { 
        name: 'Kaisai Pro Heat 7.0kW', 
        desc: 'Ekonomiczna opcja do ogrzewania sklepów, warsztatów czy dużych biur. Prosta konstrukcja i niska cena zakupu.', 
        cat: 'Ogrzewanie / Budżet', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '32 dB (min)', 
        filter: 'Jonizator, filtr Bio HEPA', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -25°C, Chłodzenie: do +43°C' 
      },
      { 
        name: 'Daikin Comfora 7.1kW', 
        desc: 'Japońska jakość w dużej skali. Znacznie cichsza od chińskich konkurentów przy tej mocy. Idealna, jeśli salon jest połączony z aneksem kuchennym.', 
        cat: 'Ogrzewanie / Premium', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '32 dB (min)', 
        filter: 'Filtr srebrowy (usuwanie alergenów i oczyszczanie)', 
        wifi: 'Opcja (wymaga adaptera BRP069B45)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'Mitsubishi Heavy SRK-ZR 7.1kW', 
        desc: 'Potężny zasięg strugi powietrza (do 20m). Dzięki technologii Jet Air (rodem z silników odrzutowych) rozprowadzi ciepło po całej hali lub domu.', 
        cat: 'Ogrzewanie / Zasięg', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '25 dB (min) - bardzo cichy jak na tę moc', 
        filter: 'Antyalergenowy, enzymatyczny', 
        wifi: 'Opcja (wymaga adaptera)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      }
    ]
  },

  'komfort': {
    '2.5': [
      { 
        name: 'AUX J-Smart 2.7kW', 
        desc: 'Jeden z najchętniej wybieranych modeli. Nowoczesny, matowy panel i niezawodna technologia inwerterowa zapewniająca szybki chłód.', 
        cat: 'Komfort / Standard', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '19 dB (min)', 
        filter: 'Jonizator, Lampa UV (sterylizacja)', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +50°C' 
      },
      { 
        name: 'Gree Pular Pro 2.5kW', 
        desc: 'Bestseller. Bardzo dobra aplikacja na telefon i kompaktowe wymiary. Jeśli szukasz po prostu dobrego chłodzenia bez przepłacania.', 
        cat: 'Komfort / Budżet', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '21 dB (min)', 
        filter: 'Jonizator', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +43°C' 
      },
      { 
        name: 'Rotenso Revio 2.6kW', 
        desc: 'Posiada "Inteligentne Oko", które wykrywa ludzi i kieruje nawiew z dala od nich, unikając efektu "przewiania". Łatwy dostęp do filtrów.', 
        cat: 'Komfort / Funkcjonalność', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A+', 
        noise: '20 dB (min)', 
        filter: 'HEPA, Cold Plasma (jonizator)', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -25°C, Chłodzenie: do +50°C' 
      },
      { 
        name: 'Mitsubishi Electric MSZ-HR 2.5kW', 
        desc: 'Wstęp do klasy Premium. Japońska niezawodność w cenie lepszego "chińczyka". Kupujesz spokój i ciszę na lata.', 
        cat: 'Komfort / Niezawodność', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '21 dB (min)', 
        filter: 'Standardowy (opcjonalnie jonowy z srebrem)', 
        wifi: 'Opcja (wymaga adaptera)', 
        range: 'Grzanie: do -10°C, Chłodzenie: do +46°C' 
      }
    ],
    '3.5': [
      { 
        name: 'AUX J-Smart 3.5kW', 
        desc: 'Złoty środek. Funkcja szybkiego chłodzenia "Turbo" pozwala schłodzić pomieszczenie w kilka minut po powrocie z pracy.', 
        cat: 'Komfort / Standard', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '19 dB (min)', 
        filter: 'Jonizator, Lampa UV', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +50°C' 
      },
      { 
        name: 'LG Standard 2 (DualCool) 3.5kW', 
        desc: 'Podwójna sprężarka (Dual Inverter) chłodzi o 40% szybciej niż standardowe modele. Idealny do mocno nasłonecznionych pokoi.', 
        cat: 'Komfort / Szybkość', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '19 dB (min)', 
        filter: 'Filtr podwójna ochrona (wstępny)', 
        wifi: 'Tak (LG ThinQ)', 
        range: 'Grzanie: do -10°C, Chłodzenie: do +48°C' 
      },
      { 
        name: 'Samsung Cebu 3.5kW', 
        desc: 'Sztuczna inteligencja uczy się Twoich nawyków. Klimatyzator sam wie, kiedy włączyć jaki tryb, by zapewnić Ci optymalne warunki.', 
        cat: 'Komfort / Smart', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '19 dB (min)', 
        filter: 'Easy Filter Plus', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'MDV Oasis 3.5kW', 
        desc: 'Świetny stosunek ceny do jakości. Marka koncernu Midea. Posiada czujnik ruchu i płynną regulację nawiewu 1-100%.', 
        cat: 'Komfort / Cena-Jakość', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A+++', 
        noise: '19 dB (min)', 
        filter: 'Filtry katalityczne, HEPA, Jonizator', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -25°C, Chłodzenie: do +50°C' 
      }
    ],
    '5.0': [
      { 
        name: 'Rotenso Revio 5.3kW', 
        desc: 'Nawiew 4D sterowany z pilota (pion i poziom) pozwala precyzyjnie rozprowadzić chłód w dużym pomieszczeniu, omijając strefę wypoczynku.', 
        cat: 'Komfort / 4D', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '21 dB (min) - świetny wynik dla 5kW', 
        filter: 'HEPA, Cold Plasma', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +50°C' 
      },
      { 
        name: 'AUX J-Smart 5.3kW', 
        desc: 'Sprawdzony model. Prosta konstrukcja i duża moc. Dobry wybór, jeśli zależy Ci na matowej obudowie i niskiej cenie.', 
        cat: 'Komfort / Standard', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '20 dB (min)', 
        filter: 'Jonizator, Lampa UV', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +50°C' 
      },
      { 
        name: 'Haier Revive Plus 5.0kW', 
        desc: 'Funkcja Coanda Plus wybija powietrze pod sufit, dzięki czemu chłód opada na domowników jak mgiełka, a nie wieje im w kark.', 
        cat: 'Komfort / Zdrowy nawiew', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '28 dB (min)', 
        filter: 'Self-Clean (oczyszczanie wymiennika)', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +43°C' 
      },
      { 
        name: 'Fuji Electric KETA 5.0kW', 
        desc: 'Japońska inżynieria w designerskiej obudowie. Bardzo wydajny wymiennik ciepła sprawia, że rachunki za prąd będą niższe.', 
        cat: 'Komfort / Jakość', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '29 dB (min)', 
        filter: 'Jonowy o wydłużonej żywotności', 
        wifi: 'Opcja (wymaga adaptera)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      }
    ],
    '7.0': [
      { 
        name: 'Gree G-Tech 7.0kW', 
        desc: 'Innowacyjna konstrukcja. Duża moc przerobowa wiąże się z kurzem - ten model rozbierzesz do mycia samemu w 5 minut, zachowując świeżość.', 
        cat: 'Komfort / Higiena', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+ (est.)', 
        noise: '28 dB (min - est.)', 
        filter: 'Generator wody myjącej (łatwe czyszczenie), jonizator', 
        wifi: 'Tak', 
        range: 'Grzanie: do -22°C' 
      },
      { 
        name: 'Rotenso Ukura 7.0kW', 
        desc: 'Prosta, tania i mocna jednostka. Nie posiada wodotrysków, ale skutecznie i szybko schłodzi duży salon lub biuro za niewielkie pieniądze.', 
        cat: 'Komfort / Ekonomiczny', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '28 dB (min)', 
        filter: 'Cold Plasma, filtr Cold Nano', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +50°C' 
      },
      { 
        name: 'LG DualCool 6.6kW', 
        desc: 'Duża moc pod kontrolą. Technologia inwerterowa LG świetnie zarządza energią, co przy tak dużej mocy ma znaczenie dla portfela.', 
        cat: 'Komfort / Oszczędność', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '31 dB (min)', 
        filter: 'Filtr podwójna ochrona', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +48°C' 
      },
      { 
        name: 'AUX J-Smart 7.0kW', 
        desc: 'Jednostka do zadań specjalnych. Wysoka moc wentylatora gwarantuje cyrkulację powietrza, ale może być głośniejsza od droższej konkurencji.', 
        cat: 'Komfort / Standard', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '27 dB (min)', 
        filter: 'Jonizator, Lampa UV', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +50°C' 
      }
    ]
  },

  'zdrowie': {
    '2.5': [
      { 
        name: 'Panasonic Etherea Z 2.5kW', 
        desc: 'Technologia Nanoe™ X aktywnie oczyszcza powietrze, neutralizując alergeny, wirusy i zapachy. Działa jak profesjonalny oczyszczacz.', 
        cat: 'Zdrowie / Lider', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A+++', 
        noise: '19 dB (min)', 
        filter: 'Nanoe-X Mark 3 (zaawansowane oczyszczanie)', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +43°C' 
      },
      { 
        name: 'Haier Pearl Plus 2.6kW', 
        desc: 'Sterylizacja UV-C oraz wygrzewanie wymiennika w 56°C zabija bakterie i wirusy. Najtańsza opcja na rynku z tak zaawansowaną higieną.', 
        cat: 'Zdrowie / Smart Choice', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '18 dB (min)', 
        filter: 'Sterylizacja UV-C, Self-Clean', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +43°C' 
      },
      { 
        name: 'Toshiba Shorai Edge 2.5kW', 
        desc: 'Filtr PM2.5 wyłapuje do 94% drobnych pyłów smogowych. Wymiennik pokryty powłoką, do której nie przywiera brud i pleśń.', 
        cat: 'Zdrowie / Czystość', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A+++', 
        noise: '19 dB (min)', 
        filter: 'Filtr Ultra Pure PM2.5', 
        wifi: 'Opcja (wymaga adaptera)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'Samsung WindFree Elite 2.5kW', 
        desc: 'Filtr Tri-Care z zeolitem wyłapuje wirusy. Brak bezpośredniego nawiewu (WindFree) chroni Twoje zatoki i gardło przed przeziębieniem.', 
        cat: 'Zdrowie / Bez wiatru', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A+++', 
        noise: '16 dB (min) - bardzo cichy', 
        filter: 'Tri-Care Filter (antybakteryjny/wirusowy)', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      }
    ],
    '3.5': [
      { 
        name: 'Panasonic Etherea Z 3.5kW', 
        desc: 'Ochrona zdrowia całej rodziny. Generator jonów działa nawet bez chłodzenia, nawilżając skórę i oczyszczając atmosferę w pokoju.', 
        cat: 'Zdrowie / Lider', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A+++', 
        noise: '19 dB (min)', 
        filter: 'Nanoe-X Mark 3', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +43°C' 
      },
      { 
        name: 'AUX Q-Smart Premium 3.5kW', 
        desc: 'Ekonomiczna opcja z lampą UV sterylizującą powietrze. Posiada też funkcję samooczyszczania. Dobry wybór dla oszczędnych.', 
        cat: 'Zdrowie / Cena', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '19 dB (min)', 
        filter: 'Jonizator, Lampa UV', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -22°C, Chłodzenie: do +50°C' 
      },
      { 
        name: 'Mitsubishi Electric LN Diamond 3.5kW', 
        desc: 'Filtr Plasma Quad Plus działa jak tarcza elektrostatyczna niszcząca wirusy. Topowa jakość powietrza potwierdzona badaniami.', 
        cat: 'Zdrowie / Hi-End', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A+++', 
        noise: '19 dB (min)', 
        filter: 'Plasma Quad Plus', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'Daikin Perfera 3.5kW', 
        desc: 'Technologia Flash Streamer razi wirusy i pleśnie wyładowaniami elektronów. Jedno z najskuteczniejszych rozwiązań antyalergicznych na rynku.', 
        cat: 'Zdrowie / Premium', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A+++', 
        noise: '19 dB (min)', 
        filter: 'Flash Streamer, tytanowo-apatytowy', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +50°C' 
      }
    ],
    '5.0': [
      { 
        name: 'Haier Expert Plus 5.0kW', 
        desc: 'Wyposażony w lampę UVC Pro, która generuje promieniowanie niszczące DNA bakterii w przepływającym powietrzu. Łatwy do rozzebrania i mycia.', 
        cat: 'Zdrowie / Technologia', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A++', 
        noise: '23 dB (min)', 
        filter: 'Sterylizacja UV-C Pro, łatwy demontaż', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +43°C' 
      },
      { 
        name: 'Panasonic Etherea Z 5.0kW', 
        desc: 'Duża moc chłodnicza połączona z systemem Nanoe X. Idealny do salonu, gdzie przebywają zwierzęta domowe (usuwa zapachy).', 
        cat: 'Zdrowie / Zapachy', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A++', 
        noise: '30 dB (min)', 
        filter: 'Nanoe-X Mark 3', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +43°C' 
      },
      { 
        name: 'Toshiba Haori 4.6kW', 
        desc: 'Ozonowanie wymiennika po każdym użyciu i jonizator plazmowy. Oprócz designu, to jedno z najbardziej higienicznych urządzeń.', 
        cat: 'Zdrowie / Design', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A++', 
        noise: '21 dB (min)', 
        filter: 'Filtr Ultra Pure PM2.5, generator ozonu', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'Rotenso Teta 5.0kW', 
        desc: 'Lampa UV i jonizator w standardzie. Automatyczne żaluzje dbają o to, by zimne powietrze nie spadało bezpośrednio na domowników.', 
        cat: 'Zdrowie / Funkcjonalny', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '24 dB (min)', 
        filter: 'HEPA, Cold Plasma', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -25°C, Chłodzenie: do +50°C' 
      }
    ],
    '7.0': [
      { 
        name: 'Toshiba Daiseikai 9 7.0kW', 
        desc: 'Absolutny top. Działa jak profesjonalny oczyszczacz powietrza dzięki aktywnemu filtrowi plazmowemu. Wychwytuje dym, zapachy i najdrobniejsze pyły.', 
        cat: 'Zdrowie / Hi-End', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A++', 
        noise: '27 dB (min)', 
        filter: 'Plazmowy filtr powietrza', 
        wifi: 'Opcja (zazwyczaj adapter)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'Panasonic Etherea Z 7.1kW', 
        desc: 'Kompleksowe rozwiązanie dla dużych przestrzeni dziennych. Zapewnia komfort termiczny i mikrobiologiczną czystość powietrza.', 
        cat: 'Zdrowie / Standard', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '33 dB (min)', 
        filter: 'Nanoe-X Mark 3', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +43°C' 
      },
      { 
        name: 'Mitsubishi Heavy SRK-ZR 7.1kW', 
        desc: 'Filtr antyalergenowy z enzymami, które "zjadają" roztocza i pyłki. Potężna maszyna dbająca o jakość powietrza na dużej powierzchni.', 
        cat: 'Zdrowie / Antyalergen', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '25 dB (min)', 
        filter: 'Antyalergenowy, enzymatyczny', 
        wifi: 'Opcja (wymaga adaptera)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'Haier Expert Plus 7.1kW', 
        desc: 'Silna sterylizacja UV w dobrej cenie. Jeśli masz duży salon połączony z kuchnią, ten model pomoże też w walce z zapachami gotowania.', 
        cat: 'Zdrowie / Smart Choice', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A', 
        noise: '26 dB (min)', 
        filter: 'Sterylizacja UV-C Pro', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +43°C' 
      }
    ]
  },

  'cisza': {
    '2.5': [
      { 
        name: 'Toshiba Seiya 2 2.5kW', 
        desc: 'Japońskie słowo "Seiya" oznacza "Cicha noc". To najcichsze urządzenie w swojej klasie. Działa tak dyskretnie, że zapomnisz o jego istnieniu.', 
        cat: 'Cisza / Lider', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A++', 
        noise: '19 dB (min)', 
        filter: 'Filtr Ultra Fresh', 
        wifi: 'Opcja (wymaga adaptera)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'Samsung WindFree Avant 2.5kW', 
        desc: 'Idealny do sypialni. Technologia WindFree™ eliminuje szum podmuchu wiatru, rozpraszając powietrze przez mikrootwory.', 
        cat: 'Cisza / Bez wiatru', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A++', 
        noise: '16 dB (min)', 
        filter: 'Tri-Care Filter', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'LG DualCool Standard 2.5kW', 
        desc: 'Specjalne ukośne łopatki wentylatora sprawiają, że szum powietrza jest minimalny. Bardzo dobra kultura pracy w niskiej cenie.', 
        cat: 'Cisza / Budżet', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '19 dB (min)', 
        filter: 'Filtr podwójna ochrona', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -10°C, Chłodzenie: do +48°C' 
      },
      { 
        name: 'Mitsubishi Heavy SRK-ZS 2.5kW', 
        desc: 'Włoski design i japońska akustyka. Brak trzasków plastiku podczas pracy, co jest kluczowe, gdy masz lekki sen.', 
        cat: 'Cisza / Premium', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A++', 
        noise: '19 dB (min)', 
        filter: 'Antyalergenowy, odwaniający', 
        wifi: 'Opcja (wymaga adaptera)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      }
    ],
    '3.5': [
      { 
        name: 'Samsung WindFree Avant 3.5kW', 
        desc: 'Komfort bez hałasu wiatru. Tryb "Good Sleep" i głośność na poziomie szeptu (od 19 dB) gwarantują niezakłócony wypoczynek.', 
        cat: 'Cisza / Bez wiatru', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A++', 
        noise: '16 dB (min)', 
        filter: 'Tri-Care Filter', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'Toshiba Shorai Edge 3.5kW', 
        desc: 'Zaledwie 19dB(A) w trybie cichym. Jedno z nielicznych urządzeń o mocy 3.5kW, przy którym można spać bez zatyczek.', 
        cat: 'Cisza / Ultra Cichy', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A+++', 
        noise: '19 dB (min)', 
        filter: 'Ultra Pure PM2.5', 
        wifi: 'Opcja (wymaga adaptera)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'Gree U-Crown 3.5kW', 
        desc: 'Solidna konstrukcja premium z grubym wygłuszeniem. Mimo upływu lat, wciąż jeden z najciszej pracujących "chińczyków".', 
        cat: 'Cisza / Solidność', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A++', 
        noise: '18 dB (min)', 
        filter: 'Jonizator plazmowy', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -30°C, Chłodzenie: do +54°C' 
      },
      { 
        name: 'Daikin Comfora 3.5kW', 
        desc: 'Specjalny tryb cichej pracy nocnej obniża obroty, sprawiając, że urządzenie staje się ledwo słyszalne dla ludzkiego ucha.', 
        cat: 'Cisza / Złoty Środek', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A++', 
        noise: '20 dB (min)', 
        filter: 'Filtr srebrowy, powietrza', 
        wifi: 'Opcja (wymaga adaptera BRP069B45)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      }
    ],
    '5.0': [
      { 
        name: 'Mitsubishi Heavy SRK-ZS 5.0kW', 
        desc: 'Cisza w dużym formacie. Mimo dużej mocy, inżynierowie zredukowali wibracje i szum do poziomu małych jednostek. Klasa sama w sobie.', 
        cat: 'Cisza / Hi-End', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A++', 
        noise: '22 dB (min)', 
        filter: 'Antyalergenowy', 
        wifi: 'Opcja (wymaga adaptera)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'Samsung WindFree Avant 5.0kW', 
        desc: 'Technologia WindFree pozwala utrzymać chłód bez głośnego wentylatora na wysokich obrotach, co jest unikalne przy tej mocy.', 
        cat: 'Cisza / Technologia', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '25 dB (min)', 
        filter: 'Tri-Care Filter', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'LG Artcool Beige 5.0kW', 
        desc: 'Cichy tryb nocny i beżowy kolor. Bardzo dobre wyciszenie agregatu zewnętrznego, co docenią Twoi sąsiedzi.', 
        cat: 'Cisza / Dyskrecja', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '31 dB (min)', 
        filter: 'Jonizator Plasmaster, UVnano', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +48°C' 
      },
      { 
        name: 'Fujitsu KETA 5.0kW', 
        desc: 'Zoptymalizowany przepływ powietrza. Duży wentylator może kręcić się wolniej (ciszej), dając ten sam efekt chłodu co mniejsze jednostki.', 
        cat: 'Cisza / Inżynieria', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '29 dB (min)', 
        filter: 'Jonowy', 
        wifi: 'Opcja (wymaga adaptera)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      }
    ],
    '7.0': [
      { 
        name: 'Daikin Stylish 7.0kW', 
        desc: 'Wykorzystuje efekt Coanda do rozprowadzania powietrza, co eliminuje głośny szum "dmuchania" typowy dla dużych jednostek 7kW.', 
        cat: 'Cisza / Premium', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '24 dB (min) - bardzo cicho jak na 7kW', 
        filter: 'Flash Streamer, tytanowo-apatytowy', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'Samsung WindFree Avant 6.5kW', 
        desc: 'Potężna moc bez przeciągów. Unikalna konstrukcja pozwala schłodzić duży salon, a następnie przejść w cichy tryb statyczny.', 
        cat: 'Cisza / Bez wiatru', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A', 
        noise: '26 dB (min)', 
        filter: 'Tri-Care Filter', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'Mitsubishi Heavy Diamond 7.0kW', 
        desc: 'Inżynieryjny majstersztyk. Mimo potężnej mocy, wibracje są zredukowane do minimum. Najcichszy "potwór" na rynku.', 
        cat: 'Cisza / Hi-End', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '22 dB (min)', 
        filter: 'Antyalergenowy, odwaniający', 
        wifi: 'Opcja (adapter)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'Rotenso Luve 7.0kW', 
        desc: 'Jak na tak dużą moc, Luve zachowuje bardzo przyzwoitą kulturę pracy dzięki aerodynamicznym żaluzjom. Dobry wybór w rozsądnej cenie.', 
        cat: 'Cisza / Ekonomiczny', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '25 dB (min)', 
        filter: 'HEPA, Cold Plasma', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -22°C, Chłodzenie: do +50°C' 
      }
    ]
  },

  'design': {
    '2.5': [
      { 
        name: 'LG Artcool Mirror 2.5kW', 
        desc: 'Biżuteria dla wnętrza. Front z czarnego szkła hartowanego sprawia, że urządzenie wygląda jak nowoczesny gadżet, a nie AGD.', 
        cat: 'Design / Klasyk', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '19 dB (min)', 
        filter: 'UVnano, Jonizator Plasmaster', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +48°C' 
      },
      { 
        name: 'Haier Flexis Plus (Black Matt) 2.6kW', 
        desc: 'Matowa czerń to hit tego sezonu. Nie odbija światła i nie widać na niej odcisków palców. Wygląda bardzo nowocześnie i dyskretnie.', 
        cat: 'Design / Mat', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A++', 
        noise: '16 dB (min)', 
        filter: 'Sterylizacja UV-C, Self-Clean', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +43°C' 
      },
      { 
        name: 'Toshiba Haori 2.5kW', 
        desc: 'Klimatyzator z tekstylnym frontem. W zestawie dwa kolory, ale możesz uszyć własny pokrowiec, dopasowując go do zasłon lub kanapy.', 
        cat: 'Design / Unikalny', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A+++', 
        noise: '19 dB (min)', 
        filter: 'Filtr Ultra Pure PM2.5, ozonator', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'AUX Halo (Black) 2.6kW', 
        desc: 'Czarne, matowe wykończenie w cenie zwykłego klimatyzatora. Najtańszy sposób na stylowe wnętrze bez efektu taniego plastiku.', 
        cat: 'Design / Budżet', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '19 dB (min)', 
        filter: 'Jonizator, Lampa UV', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +50°C' 
      }
    ],
    '3.5': [
      { 
        name: 'Haier Flexis Plus (Black Matt) 3.5kW', 
        desc: 'Głęboka, matowa czerń. Idealnie pasuje do loftów i nowoczesnych mieszkań. Posiada świetną sterylizację UV i czujnik ECO.', 
        cat: 'Design / Trend', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A++', 
        noise: '17 dB (min)', 
        filter: 'Sterylizacja UV-C, Self-Clean', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +43°C' 
      },
      { 
        name: 'LG Artcool Mirror 3.5kW', 
        desc: 'Elegancja i technologia. Oprócz stylowego wyglądu, urządzenie oferuje wbudowane Wi-Fi i jonizator, łącząc piękno z funkcjonalnością.', 
        cat: 'Design / Połysk', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '19 dB (min)', 
        filter: 'UVnano, Jonizator Plasmaster', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +48°C' 
      },
      { 
        name: 'Gree Fairy (Dark) 3.5kW', 
        desc: 'Obudowa o nietypowym, opływowym kształcie z grafitowym wykończeniem i chromem. Wygląda znacznie drożej niż kosztuje.', 
        cat: 'Design / Budżet', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '25 dB (min)', 
        filter: 'Jonizator plazmowy', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -22°C, Chłodzenie: do +50°C' 
      },
      { 
        name: 'Mitsubishi Electric LN (Ruby Red) 3.5kW', 
        desc: 'Odważna, głęboka czerwień o strukturze lakieru samochodowego. Dla kogoś, kto chce, aby klimatyzator był główną ozdobą ściany.', 
        cat: 'Design / Odważny', 
        energy_class: 'Chłodzenie: A+++ / Grzanie: A+++', 
        noise: '19 dB (min)', 
        filter: 'Plasma Quad Plus', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      }
    ],
    '5.0': [
      { 
        name: 'Toshiba Haori 4.6kW', 
        desc: 'W dużym salonie tekstylny front sprawia, że urządzenie wygląda jak element mebli tapicerowanych. Ociepla wizerunek wnętrza i nie rzuca się w oczy.', 
        cat: 'Design / Tekstylny', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A++', 
        noise: '21 dB (min)', 
        filter: 'Filtr Ultra Pure PM2.5, generator ozonu', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'LG Artcool Mirror 5.0kW', 
        desc: 'Dominujący akcent. Ciemna tafla szkła doskonale komponuje się z dużymi telewizorami. Wymaga jednak częstszego przecierania z kurzu.', 
        cat: 'Design / Połysk', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '31 dB (min)', 
        filter: 'UVnano, Jonizator', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +48°C' 
      },
      { 
        name: 'Rotenso Versu Mirror 5.3kW', 
        desc: 'Front z ciemnego lustra podobny do LG, ale w niższej cenie. Subtelne podświetlenie LED informuje kolorem o trybie pracy (ciepło/zimno).', 
        cat: 'Design / Alternatywa', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '26 dB (min)', 
        filter: 'HEPA, Cold Plasma', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +50°C' 
      },
      { 
        name: 'Daikin Emura (Black) 5.0kW', 
        desc: 'Ikona designu światowego formatu. Zakrzywiony profil, który podczas pracy otwiera się w futurystyczny sposób.', 
        cat: 'Design / Ikona', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A++', 
        noise: '24 dB (min)', 
        filter: 'Flash Streamer, tytanowo-apatytowy', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +50°C' 
      }
    ],
    '7.0': [
      { 
        name: 'Mitsubishi Electric EF (Zen) Black 7.0kW', 
        desc: 'Minimalizm w czystej postaci. Prosta, geometryczna bryła w czarnym połysku. Mimo dużej mocy, obudowa pozostaje smukła i elegancka.', 
        cat: 'Design / Minimalizm', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '30 dB (min)', 
        filter: 'Filtry z jonami srebra (standardowo: enzymatyczny/nano)', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      },
      { 
        name: 'Haier Flexis Plus (Black Matt) 7.1kW', 
        desc: 'Jedna z niewielu czarnych jednostek o tak dużej mocy w macie. Pozwala zachować spójny design nawet w bardzo dużych salonach.', 
        cat: 'Design / Mat', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '33 dB (min)', 
        filter: 'Sterylizacja UV-C, Self-Clean', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -20°C, Chłodzenie: do +43°C' 
      },
      { 
        name: 'LG Artcool Mirror 6.6kW', 
        desc: 'Ekskluzywna moc. Rozwiązanie dla prestiżowych, dużych wnętrz. Pamiętaj jednak, że tak duża czarna tafla będzie dominować w pokoju.', 
        cat: 'Design / Połysk', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '31 dB (min)', 
        filter: 'UVnano, Jonizator', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +48°C' 
      },
      { 
        name: 'Daikin Stylish (Black Wood) 7.0kW', 
        desc: 'Unikalna faktura "czarnego drewna". Niezwykle cienka obudowa jak na 7kW mocy. Łączy surowość natury z najwyższą technologią.', 
        cat: 'Design / Premium Wood', 
        energy_class: 'Chłodzenie: A++ / Grzanie: A+', 
        noise: '24 dB (min)', 
        filter: 'Flash Streamer', 
        wifi: 'Tak (wbudowane)', 
        range: 'Grzanie: do -15°C, Chłodzenie: do +46°C' 
      }
    ]
  }
};

// ==========================================
// 5. TREŚCI PRZEJŚCIOWE (STEP 4 - WYNIKI)
// ==========================================
export const transitionContent = {
  'ogrzewanie': { 
      headline: 'Przeprowadziliśmy analizę ROI. Teraz wybierzmy technologię grzewczą.', 
      subtext: 'Każdy z poniższych modeli wygeneruje podobne oszczędności finansowe. Różnica polega na <strong>wydajności przy ekstremalnych mrozach</strong> oraz gwarancji ciągłości pracy.' 
  },
  'komfort': { 
      headline: 'Oszczędność to bonus. Kluczem jest natychmiastowa ulga w upały.', 
      subtext: 'Wszystkie modele świetnie chłodzą, ale wyższe warianty oferują <strong>inteligentny nawiew 4D</strong>, który błyskawicznie obniża temperaturę i chroni przed efektem "przewiania".' 
  },
  'zdrowie': { 
      headline: 'Zysk finansowy jest ważny, ale Twoje zdrowie najważniejsze.', 
      subtext: 'Zużycie prądu będzie zbliżone. Główna różnica tkwi w <strong>zaawansowanej filtracji</strong>. Modele Smart i Premium to w praktyce profesjonalne oczyszczacze powietrza.' 
  },
  'cisza': { 
      headline: 'Liczby mówią głośno, ale urządzenie musi szeptać.', 
      subtext: 'Każdy z tych modeli jest energooszczędny, jednak w sypialni liczy się każdy decybel. Modele wyższej klasy zapewniają <strong>absolutną dyskrecję pracy nocnej</strong> (poniżej 20dB).' 
  },
  'design': { 
      headline: 'Wyniki są jasne. Teraz dopasujmy sprzęt do Twojego wnętrza.', 
      subtext: 'Oszczędności masz jak w banku. Różnica polega na wykończeniu – modele Premium oferują <strong>unikalne wzornictwo, matowe tekstury</strong> i smukłe linie, stając się ozdobą salonu.' 
  }
};