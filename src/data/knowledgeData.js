/**
 * [SENIOR CONFIG]: Stałe kategorii FAQ. 
 * Zapobiegają literówkom i ułatwiają filtrowanie w UI.
 */
export const FAQ_CATEGORIES = {
  FINANSE: 'finanse',
  MONTAZ: 'montaz',
  OGOLNE: 'ogolne',
  ZDROWIE: 'zdrowie'
};

const BASE_FAQ_URL = '/baza-wiedzy';

/**
 * [DATA]: Surowe dane FAQ.
 * Każdy element posiada 'tags' - to paliwo dla Twojej wyszukiwarki (searchIndex.js).
 */
const rawKnowledgeData = [
  // --- FINANSE ---
  {
    id: 'oplaty-gaz-vs-klima',
    title: 'Czy ogrzewanie klimatyzacją opłaca się bardziej niż gazem?',
    answer: 'Spójrzmy na liczby. Nowoczesny klimatyzator to pompa ciepła powietrze-powietrze. Kluczem jest współczynnik SCOP.<br><br><strong>Kocioł gazowy:</strong> Z 1 kWh paliwa wytwarza 1 kWh ciepła.<br><strong>Klimatyzacja:</strong> Z 1 kWh prądu wytwarza 3-4,5 kWh ciepła.<br><br>Nawet jeśli prąd jest droższy od gazu, 4-krotna przewaga efektywności sprawia, że finalny koszt jest często niższy.',
    category: FAQ_CATEGORIES.FINANSE,
    tags: ['koszty', 'oszczędności', 'gaz', 'rachunki', 'pieniądze', 'opłacalność']
  },
  {
    id: 'koszt-miesieczny-100m2',
    title: 'Ile dokładnie zapłacę miesięcznie za ogrzewanie domu 100m²?',
    answer: 'To zależy od izolacji budynku (standard energetyczny).<br><br><strong>Dom nowy / po termomodernizacji:</strong> Zapotrzebowanie niskie (~6000 kWh/rok). Średni koszt: <strong>150 – 250 zł/mc</strong>.<br><strong>Dom starszy / słabo ocieplony:</strong> Zapotrzebowanie wysokie (~12 000 kWh/rok). Średni koszt: <strong>450 – 700 zł/mc</strong>.<br><br>Pamiętaj: to średnia z sezonu. W styczniu rachunek będzie wyższy, w październiku niższy.',
    category: FAQ_CATEGORIES.FINANSE,
    tags: ['cena', 'dom 100m2', 'ogrzewanie', 'wydatki', 'zapotrzebowanie']
  },
  {
    id: 'zuzycie-pradu-grzanie',
    title: 'Ile prądu zużywa grzanie klimatyzacją?',
    answer: 'Dla standardowej jednostki 3,5 kW (pokój ok. 35 m²):<br><strong>Moc grzewcza:</strong> 3,5 kW (tyle ciepła daje).<br><strong>Maksymalny pobór prądu:</strong> 0,8 – 1,0 kW (tylko przy starcie).<br><strong>Średni pobór:</strong> ok. 0,3 – 0,5 kW.<br><br>Dzięki technologii inwerterowej urządzenie nie wyłącza się, lecz "zwalnia", pobierając śladowe ilości energii.',
    category: FAQ_CATEGORIES.FINANSE,
    tags: ['prąd', 'zużycie', 'energia', 'kilowaty', 'kWh', 'inwerter']
  },
  {
    id: 'zwrot-z-inwestycji-roi',
    title: 'Kiedy zwróci mi się ta inwestycja?',
    answer: '<strong>Modernizacja (zamiast grzejników elektrycznych):</strong> Zwrot w 2–3 sezony grzewcze (klimatyzacja jest 4x tańsza w eksploatacji).<br><strong>Nowy dom:</strong> Zyskujesz już przy zakupie. System Multi-Split jest o połowę tańszy niż budowa kotłowni gazowej czy pompy ciepła z podłogówką.<br><br>Dodatkowy zysk: Funkcję chłodzenia masz w cenie.',
    category: FAQ_CATEGORIES.FINANSE,
    tags: ['zwrot', 'opłacalność', 'inwestycja', 'roi', 'zysk']
  },

  // --- MONTAŻ ---
  {
    id: 'montaz-a-remont',
    title: 'Czy montaż oznacza kucie ścian i generalny remont?',
    answer: 'Nie. Przed pracą zabezpieczamy meble folią. Wykonujemy jeden przewiert przez ścianę (używając odkurzaczy przemysłowych). Instalacje wewnątrz zazwyczaj ukrywamy w estetycznych korytach maskujących, co eliminuje kucie tynków. Po pracy sprzątamy i zabieramy gruz.',
    category: FAQ_CATEGORIES.MONTAZ,
    tags: ['brud', 'kucie', 'remont', 'instalacja', 'czystość']
  },
  {
    id: 'czas-trwania-montazu',
    title: 'Jak długo trwa montaż klimatyzacji?',
    answer: '<strong>Standardowy split:</strong> 4 do 8 godzin (jeden dzień roboczy).<br><strong>Systemy Multi-Split:</strong> Od 2 dni - w zależności od ilości jednostek wewnętrznych.<br><br>W tym czasie wykonujemy montaż, próby szczelności i szkolenie z obsługi.',
    category: FAQ_CATEGORIES.MONTAZ,
    tags: ['czas', 'godziny', 'ile trwa', 'montaż']
  },
  {
    id: 'przygotowanie-mieszkania',
    title: 'Jak przygotować przestrzeń do montażu?',
    answer: 'Potrzebujemy dostępu do ściany (odsuń meble na 1,5 metra). Zdejmij obrazy i delikatną elektronikę. Upewnij się, że mamy dostęp do prądu.',
    category: FAQ_CATEGORIES.MONTAZ,
    tags: ['przygotowanie', 'meble', 'miejsce', 'dostęp']
  },
  {
    id: 'estetyka-elewacji',
    title: 'Czy instalacja oszpeci moją elewację lub wnętrze?',
    answer: 'Nie uznajemy "wiszących kabli". Na elewacji przewody prowadzimy w korytach odpornych na UV (często przy rynnach). Wewnątrz stosujemy minimalistyczne maskownice. Trasę ustalamy wspólnie przed wierceniem.',
    category: FAQ_CATEGORIES.MONTAZ,
    tags: ['wygląd', 'elewacja', 'estetyka', 'koryta', 'maskownice']
  },

  // --- OGÓLNE / TECHNOLOGIA ---
  {
    id: 'zgoda-spoldzielni',
    title: 'Czy muszę mieć zgodę spółdzielni na montaż w mieszkaniu?',
    answer: '<strong>Na elewacji:</strong> Tak, zgoda jest wymagana (naruszenie części wspólnej).<br><strong>Na balkonie:</strong> Zazwyczaj formalność, jeśli jednostka stoi na posadzce ("w obrysie").<br><br>Dostarczamy pełną specyfikację techniczną (głośność), co przyspiesza zgodę administracji.',
    category: FAQ_CATEGORIES.OGOLNE,
    tags: ['zgoda', 'spółdzielnia', 'blok', 'prawo', 'mieszkanie', 'balkon']
  },
  {
    id: 'halas-jednostki-zewnetrznej',
    title: 'Czy jednostka zewnętrzna jest głośna?',
    answer: 'Generuje 45-50 dB (szum nowoczesnej lodówki). Z odległości kilku metrów dźwięk zlewa się z otoczeniem. Urządzenia spełniają normy hałasu. Tryb nocny "Silent" dodatkowo wycisza pracę.',
    category: FAQ_CATEGORIES.OGOLNE,
    tags: ['hałas', 'głośność', 'decbele', 'szum', 'cisza', 'noc']
  },
  {
    id: 'grzanie-przy-mrozach',
    title: 'Czy klimatyzacja poradzi sobie jako jedyne źródło ciepła przy -20°C?',
    answer: 'Tak, jeśli dobierzemy model z <strong>pakietem zimowym</strong> (grzałki tacy ociekowej, sprężarki). Stosujemy też zasadę przewymiarowania mocy, aby nawet przy -25°C urządzenie dostarczało tyle ciepła, ile potrzebuje Twój dom.',
    category: FAQ_CATEGORIES.OGOLNE,
    tags: ['mróz', 'zima', 'minus', 'wydajność', 'pakiety zimowe']
  },
  {
    id: 'sterowanie-wi-fi',
    title: 'Czy mogę sterować ogrzewaniem z telefonu?',
    answer: 'Tak. Większość naszych urządzeń ma wbudowane Wi-Fi. Możesz obniżyć temperaturę wychodząc do pracy i podnieść ją godzinę przed powrotem. Masz pełny podgląd zużycia i temperatury z dowolnego miejsca.',
    category: FAQ_CATEGORIES.OGOLNE,
    tags: ['aplikacja', 'wifi', 'telefon', 'sterowanie', 'zdalnie', 'smart home']
  },

  // --- ZDROWIE ---
  {
    id: 'klimatyzacja-a-alergia',
    title: 'Czy klimatyzacja jest dobra dla alergików?',
    answer: 'Zdecydowanie tak. Działa jak tarcza odcinająca pyłki z zewnątrz. Zaawansowane filtry i jonizacja neutralizują wirusy i zarodniki pleśni. Warunkiem jest coroczny przegląd i odgrzybianie.',
    category: FAQ_CATEGORIES.ZDROWIE,
    tags: ['alergia', 'zdrowie', 'filtry', 'powietrze', 'jonizacja', 'pyłki', 'pleśń']
  }
];

/**
 * [SENIOR LOGIC]: Automatyczna generacja finalnej listy.
 * Dodaje typ 'faq' i dynamiczny URL na podstawie ID.
 */
export const knowledgeData = rawKnowledgeData.map(item => ({
  ...item,
  type: 'faq',
  url: `${BASE_FAQ_URL}#${item.id}`
}));