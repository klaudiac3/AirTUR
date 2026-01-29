// src/data/companyConfig.js

export const companyConfig = {
  name: "AirTUR",
  fullName: "F. H. U. Krzysztof Turek",
  nip: "123-456-78-90", // Tutaj wpisz swój prawdziwy NIP
  regon: "123456789",   // Tutaj wpisz swój prawdziwy REGON
  
  address: {
    street: "Zarzecze 9", // Do uzupełnienia
    postCode: "33-390",
    city: "Łącko",
    full: "Zarzecze 9, 33-390 Łącko"
  },

  contact: {
    phone: "508 485 790",
    phoneFull: "+48 508 485 790",
    phoneLink: "tel:+48508485790",
    email: "kontakt@airtur.pl",
    emailLink: "mailto:kontakt@airtur.pl"
  },

  workingHours: {
    weekdays: "8:00 – 17:00",
    saturday: "10:00 – 12:00",
    sunday: "nieczynne",
  },

  // Obszar działania z podziałem na regiony (używane w Kontakcie i Stopce)
  serviceAreas: [
    {
      region: "Kraków i Północ",
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
        { label: "Tarnów i okolice", desc: "Wojnicz, Tuchów, Żabno" },
        { label: "Powiat Gorlicki", desc: "Gorlice, Biecz" },
        { label: "Szerszy zasięg", desc: "Wadowice, Oświęcim, a także wybrane lokalizacje na Śląsku i Podkarpaciu" }
      ]
    }
  ],

  links: {
    privacyPolicy: "/polityka-prywatnosci",
  }
};