// src/data/companyConfig.js

export const companyConfig = {
  name: "AirTUR",
  fullName: "F. H. U. Krzysztof Turek",
  nip: "7343503023", // [WPISZ TUTAJ]: Twój poprawny NIP
  regon: "363715700",   // [WPISZ TUTAJ]: Twój poprawny REGON

  address: {
    street: "Zarzecze 9",
    postCode: "33-390",
    city: "Łącko",
    full: "Zarzecze 9, 33-390 Łącko",
    // Współrzędne dla Map Google i Schema.org
    geo: {
      latitude: 49.555,
      longitude: 20.444
    }
  },

  contact: {
    phone: "508 485 790",
    phoneFull: "+48 508 485 790",
    phoneLink: "tel:+48508485790",
    email: "kontakt@airtur.pl",
    emailLink: "mailto:kontakt@airtur.pl"
  },

  socials: {
    facebook: "", // [UZUPEŁNIJ LUB ZOSTAW PUSTE]
    instagram: "",
  },

  workingHours: {
    weekdays: "8:00 – 17:00",
    saturday: "10:00 – 12:00",
    sunday: "nieczynne",
  },

  // Struktura dla UI (wykorzystasz ją w sekcji "Gdzie działamy")
  serviceAreas: [
    {
      region: "Małopolska - Kraków",
      places: [
        { label: "Kraków", desc: "Wszystkie dzielnice" },
        { label: "Powiat krakowski", desc: "Skawina, Wieliczka, Niepołomice, Zabierzów" },
        { label: "Okolice", desc: "Myślenice, Bochnia, Brzesko, Miechów, Olkusz" }
      ]
    },
    {
      region: "Południe i Góry",
      places: [
        { label: "Powiat Limanowski", desc: "Limanowa, Mszana Dolna, Tymbark" },
        { label: "Nowy Sącz i okolice", desc: "Stary Sącz, Krynica-Zdrój, Grybów" },
        { label: "Podhale", desc: "Nowy Targ, Zakopane, Rabka-Zdrój, Szczawnica" }
      ]
    },
{
      region: "Wschód i Zachód",
      places: [
        { label: "Powiat Tarnowski", desc: "Tarnów, Wojnicz, Tuchów, Żabno" },
        { label: "Powiat Gorlicki", desc: "Gorlice, Biecz" },
        { label: "Województwo Śląskie i Podkarpackie", desc: "Katowice, Przemyśl, Jasło" }

      ]
    }

  ],

  // Automatyczna płaska lista dla Schema.org (Google AreaServed)
  // [LOGIKA]: Mapujemy tablicę serviceAreas, aby wyciągnąć same nazwy miast dla SEO.
  get seoServiceArea() {
    return this.serviceAreas.flatMap(area => 
      area.places.map(p => p.label)
    );
  },

  links: {
    privacyPolicy: "/polityka-prywatnosci",
    regulamin: "/regulamin",
    cookies: "/polityka-cookies",
  },

  dates: {
    lastUpdateRegulamin: "2 marca 2026", // Synchronizacja z Twoim plikiem Regulaminu
    privacyPolicy: "2 marca 2026",
    cookies: "2 marca 2026",
  }
};