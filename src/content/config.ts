import { defineCollection, z } from 'astro:content';

// Definicja dla Bloga 
const blogCollection = defineCollection({
  type: 'content', 
  schema: z.object({
    
    title: z.string(),           // Tytuł artykułu
    pubDate: z.date(),           // Data publikacji
    image: z.string(),           // Ścieżka do zdjęcia
    category: z.string(),        // Kategoria
    author: z.string(),          // Autor
    readingTime: z.string(),     // np. "7 min"
    featured: z.boolean(),       // Wyróżnienie na górze
    excerpt: z.string(),         // Krótki opis
    keyTakeaways: z.array(z.string()).optional(), // Wnioski

    // Sekcja meta dla SEO
    meta: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
    }).optional(),

    // Sekcja FAQ
    faq: z.array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    ).optional(),

    // 1. Data aktualizacji (opcjonalna) - wyświetli się komunikat, jeśli podasz
    updatedDate: z.date().optional(),
    
    // 2. Włącznik Spisu Treści (opcjonalny, domyślnie wyłączony)
    showTOC: z.boolean().optional().default(false),
  }),
});

/**
 * KOLEKCJA: CASES (Studia Przypadków)
 * Tutaj uwzględniliśmy wszystkie parametry techniczne jako opcjonalne.
 */
const casesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    caseId: z.string().or(z.number()),   // Numer porządkowy (np. 1)
    title: z.string(), // Pełny tytuł raportu, główny tytuł na stronie (H1)
    location: z.string(), // Miasto realizacji (np. Kraków)
    image: z.string(), // Główne zdjęcie (ogromne znaczenie dla SEO obrazów)
    category: z.string(), // Kategoria: finanse | zdrowie | technologia
    tags: z.array(z.string()), // Tagi dla wyszukiwarki

     // Sekcja: tile_data (dane widoczne na liście i w sliderach)
    tile_data: z.object({
      title_tile: z.string().optional(), // Tytuł marketingowy na kafelek (jeśli pusty, użyjemy głównego)
      problem_short: z.string(), // Streszczenie problemu (np. rachunki 900 zł)
      solution_short: z.string(), // Streszczenie rozwiązania (np. System Multi-Split)
      result_short: z.string(), // "Wisienka na torcie" (np. oszczędność 3000 zł)
      excerpt: z.string(), // Tekst marketingowy na zachętę
    }),

    // Sekcja: roi_dashboard
    roi_dashboard: z.object({
      value: z.string(), // Wartość oszczędności do dużego boxu
      roi_label: z.string().optional().default("Roczna oszczędność"), // Podpis pod wartością na dashboardzie
      time: z.string(), // Czas zwrotu inwestycji
      time_label: z.string().optional().default("Czas zwrotu"),   // Podpis pod wartością na dashboardzie
    // SEKCJA CTA (DOLNA)
      ctaHeadline: z.string().optional().default("Chcesz osiągnąć podobny wynik?"),  // 1. Pytanie nad przyciskiem
      ctaButtonText: z.string().optional().default("ZAMÓW BEZPŁATNĄ ANALIZĘ"), // 2. Tekst na przycisku
      ctaButtonLink: z.string().optional().default("/kontakt"), // 3. Link przycisku - domyślnie kontakt
    }),

    // SEO (Metatagi dla Google)
    seo: z.object({
      meta_title: z.string().optional(),
      meta_description: z.string().optional(),
    }).optional(),

    // Sekcja: content (CAŁA TREŚĆ RAPORTU)
    content: z.object({
      problem: z.object({ 
      heading: z.string(), // tytuł Problem: treść...
      description: z.string(), // opis
      quote: z.string().optional(), // treść wpisana w cytat
      }),
      solution: z.object({
      heading: z.string(), // tytuł Rozwiązanie: treść...
      description: z.string(), // opis
      }),

      // SEKCJA TECHNOLOGII: Wszystko co może się pojawić w tabelce parametrów
      technology: z.object({
        heading: z.string().optional().default ("Zastosowana technologia (Parametry)"),
        brand: z.string().optional(),        // Producent i model
        system: z.string().optional(),       // Np. Multi-Split / Split
        refrigerant: z.string().optional(),  // Rodzaj gazu w układzie. Obecnie standardem jest R32
        cooling_kw: z.number().or(z.string()).optional(), // Moc chłodnicza. Możesz wpisać samą liczbę (np. 7.1) lub tekst ("7.1 kW"
        heating_kw: z.number().or(z.string()).optional(), // Moc grzewcza. Analogicznie: liczba lub tekst (np. 8.5 lub "8.5 kW")
        scop: z.number().or(z.string()).optional(), // Sezonowy współczynnik wydajności grzania (np. 4.6). Im wyższy, tym mniej prądu zużywa urządzenie.
        seer: z.number().or(z.string()).optional(), // Sezonowy współczynnik wydajności chłodzenia (np. 7.1).
        energy_class_heating: z.string().optional(), // Klasa energetyczna dla grzania (np. A++ lub A+++
        energy_class_cooling: z.string().optional(), // Klasa energetyczna dla chłodzenia (np. A++)
        working_range: z.string().optional(),  // Opis zakresu temperatur, w jakich urządzenie może pracować (np. "Pełna wydajność do -22°C")
        noise_level_min: z.string().optional(),  // Najniższy poziom hałasu jednostki wewnętrznej, ważny w sypialniach (np. "19 dB(A)")
        wifi_control: z.boolean().optional(),  // Tutaj wpisujesz tylko true (jeśli ma Wi-Fi) lub false (jeśli nie ma).
        air_purification: z.string().optional(), // Opis filtrów lub technologii czyszczenia powietrza (np. "Jonizator plazmowy i filtr węglowy")
      }).optional(),
      effect: z.object({ 
        heading: z.string(), // np Efekt: Pełna kontrola i mierzalne oszczędności
        description: z.string(), // Po pierwszym pełnym sezonie grzewczym średni miesięczny koszt ogrzewania spadł do poziomu ~350 zł.
            }),
    }),
  }),
});

// Eksportujemy kolekcje
export const collections = {
  'blog': blogCollection,
  'cases': casesCollection,
};