import { getCollection } from 'astro:content';
import { knowledgeData } from '../data/knowledgeData';

// Ta funkcja pobiera i łączy wszystkie dane z całej strony
export async function getGlobalSearchIndex() {
  
  // 1. Pobierz ręczne dane (Studia Przypadków, Globalne FAQ)
  // Filtrujemy, żeby nie dublować artykułów, jeśli masz jakieś "zaślepki" w pliku JS
  const manualData = knowledgeData.filter(item => item.type !== 'artykul'); 

  // 2. Pobierz automatycznie wszystkie artykuły z Bloga (.md)
  const blogPosts = await getCollection('blog');
  
  // 3. Przerób artykuły na format wyszukiwarki
  const blogEntries = blogPosts.flatMap(post => {
    
    // A. Główny wpis (Sam artykuł)
    const articleEntry = {
        id: post.slug,
        title: post.data.title,
        type: 'artykul',
        category: post.data.category,
        tags: ['blog', post.data.category],
        url: `/blog/${post.slug}#faq-${index}`,
        image: post.data.image,
        excerpt: post.data.excerpt
    };

    // B. Pytania FAQ z tego artykułu (wyciągamy je jako osobne wyniki!)
    // Jeśli ktoś wpisze pytanie, znajdzie je i zostanie przeniesiony do artykułu
    const faqEntries = (post.data.faq || []).map((q, index) => ({
        id: `${post.slug}-faq-${index}`,
        title: q.question, // Pytanie jako Tytuł w wyszukiwarce
        type: 'faq',
        category: post.data.category,
        tags: ['faq', 'pytanie', 'odpowiedź'],
        url: `/blog/${post.slug}`, // Kliknięcie otwiera artykuł
        excerpt: q.answer // Odpowiedź jako opis w wyszukiwarce
    }));

    return [articleEntry, ...faqEntries];
  });

  // 4. Zwróć połączoną super-listę
  return [...manualData, ...blogEntries];
}