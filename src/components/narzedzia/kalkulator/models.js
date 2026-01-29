// ==========================================
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
// 2. BAZA MODELI KLIMATYZATORÓW
// ==========================================

export const models = {
    'ogrzewanie': {
      '2.5': { name: 'Gree Amber Standard 2.7kW', desc: 'Wysoka wydajność grzewcza w kompaktowej obudowie. Idealny kompromis ceny do możliwości grzewczych w małych pomieszczeniach.', cat: 'Ogrzewanie' },
      '3.5': { name: 'Gree Amber Prestige 3.5kW', desc: 'Absolutny lider ogrzewania. Dwustopniowa sprężarka pozwala na wydajną pracę nawet przy -30°C, drastycznie obniżając koszty ogrzewania.', cat: 'Ogrzewanie Premium' },
      '5.0': { name: 'Gree Amber Prestige 5.3kW', desc: 'Potężna jednostka grzewcza o najwyższej klasie efektywności energetycznej A+++. Zastępuje tradycyjne ogrzewanie w dużych salonach.', cat: 'Ogrzewanie Premium' },
      '7.0': { name: 'Gree Amber Prestige 7.0kW', desc: 'Maksymalna moc grzewcza. To urządzenie to w praktyce pełnoprawna pompa ciepła powietrze-powietrze dla dużych otwartych przestrzeni.', cat: 'Ogrzewanie Premium' }
    },
    'komfort': {
      '2.5': { name: 'AUX J-Smart 2.7kW', desc: 'Jeden z najchętniej wybieranych modeli. Nowoczesny, matowy panel i niezawodna technologia inwerterowa zapewniająca szybki chłód.', cat: 'Standard' },
      '3.5': { name: 'AUX J-Smart 3.5kW', desc: 'Złoty środek. Funkcja szybkiego chłodzenia "Turbo" pozwala schłodzić pomieszczenie w kilka minut po powrocie z pracy.', cat: 'Standard' },
      '5.0': { name: 'AUX J-Smart 5.3kW', desc: 'Zwiększona wydajność dla wymagających pomieszczeń. Dzięki szerokiemu nawiewowi powietrze dociera do każdego zakamarka.', cat: 'Standard' },
      '7.0': { name: 'AUX J-Smart 7.0kW', desc: 'Jednostka do zadań specjalnych. Wysoka moc wentylatora gwarantuje skuteczną cyrkulację powietrza nawet na dużych powierzchniach.', cat: 'Standard' }
    },
    'zdrowie': {
      '2.5': { name: 'Panasonic Etherea Z 2.5kW', desc: 'Technologia Nanoe™ X aktywnie oczyszcza powietrze w małych sypialniach, neutralizując alergeny, bakterie i nieprzyjemne zapachy.', cat: 'Zdrowie / Alergik' },
      '3.5': { name: 'Panasonic Etherea Z 3.5kW', desc: 'Ochrona zdrowia całej rodziny. Wbudowany generator jonów działa nawet bez chłodzenia, pełniąc funkcję profesjonalnego oczyszczacza powietrza.', cat: 'Zdrowie / Alergik' },
      '5.0': { name: 'Panasonic Etherea Z 5.0kW', desc: 'Wydajność i higiena. Duża moc chłodnicza połączona z systemem, który hamuje rozwój pleśni i wirusów wewnątrz urządzenia i w pokoju.', cat: 'Zdrowie / Alergik' },
      '7.0': { name: 'Panasonic Etherea Z 7.1kW', desc: 'Kompleksowe rozwiązanie dla dużych przestrzeni dziennych. Zapewnia komfort termiczny i mikrobiologiczną czystość powietrza.', cat: 'Zdrowie / Alergik' }
    },
    'cisza': {
      '2.5': { name: 'Samsung WindFree Avant 2.5kW', desc: 'Idealny do sypialni. Technologia WindFree™ rozprasza powietrze przez tysiące mikrootworów, eliminując nieprzyjemny zimny podmuch.', cat: 'Cisza' },
      '3.5': { name: 'Samsung WindFree Avant 3.5kW', desc: 'Komfort bez hałasu. Tryb "Good Sleep" i głośność na poziomie szeptu (od 19 dB) gwarantują niezakłócony wypoczynek.', cat: 'Cisza' },
      '5.0': { name: 'Samsung WindFree Avant 5.0kW', desc: 'Cisza w dużym formacie. Mimo dużej mocy, urządzenie potrafi utrzymać temperaturę bez generowania hałasu typowego dla dużych klimatyzatorów.', cat: 'Cisza' },
      '7.0': { name: 'Samsung WindFree Avant 6.5kW', desc: 'Potężna moc bez przeciągów. Unikalna konstrukcja pozwala schłodzić duży salon, a następnie utrzymać chłód w trybie statycznym.', cat: 'Cisza' }
    },
    'design': {
      '2.5': { name: 'LG Artcool Mirror 2.5kW', desc: 'Biżuteria dla Twojego wnętrza. Front z czarnego szkła hartowanego sprawia, że urządzenie wygląda jak nowoczesny element dekoracyjny.', cat: 'Design' },
      '3.5': { name: 'LG Artcool Mirror 3.5kW', desc: 'Elegancja i technologia. Oprócz stylowego wyglądu, urządzenie oferuje wbudowane Wi-Fi i jonizator, łącząc piękno z funkcjonalnością.', cat: 'Design' },
      '5.0': { name: 'LG Artcool Mirror 5.0kW', desc: 'Dominujący akcent w salonie. Ciemna obudowa doskonale komponuje się z nowoczesnymi wnętrzami, telewizorami i ciemnymi meblami.', cat: 'Design' },
      '7.0': { name: 'LG Artcool Mirror 6.6kW', desc: 'Ekskluzywna moc. Rozwiązanie dla prestiżowych, dużych wnętrz, gdzie standardowa biała jednostka zaburzyłaby estetykę.', cat: 'Design' }
    }
  };