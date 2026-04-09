// src/utils/searchIndex.js

import { getCollection } from 'astro:content';
import { knowledgeData } from '../data/knowledgeData';

const stripHtml = (html) => html?.replace(/<[^>]*>?/gm, '') || '';

// [SENIOR]: Ta funkcja jest kluczowa. Musi być identyczna tutaj i w komponencie!
const normalizeText = (text) => 
  text?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Usuwa ogonki (ą -> a, ó -> o)
    .replace(/\s+/g, ' ')
    .trim() || '';

export async function getGlobalSearchIndex() {
  const [blogPosts, caseStudies] = await Promise.all([
    getCollection('blog'),
    getCollection('cases')
  ]);
  
  const manualFaq = knowledgeData;

  // 1. BLOG (Bez zmian, działa dobrze)
  const blogEntries = blogPosts.flatMap(post => {
    const articleEntry = {
      id: post.slug,
      title: post.data.title,
      type: 'artykul',
      category: post.data.category,
      url: `/blog/${post.slug}`,
      excerpt: post.data.excerpt,
      searchContent: normalizeText(`${post.data.title} ${post.data.excerpt} ${post.data.category} ${post.data.keyTakeaways?.join(' ') || ''}`)
    };
    const faqFromBlog = (post.data.faq || []).map((q, index) => ({
      id: `${post.slug}-faq-${index}`,
      title: q.question,
      type: 'faq',
      category: post.data.category,
      url: `/blog/${post.slug}#faq-${index}`,
      excerpt: stripHtml(q.answer).substring(0, 160) + '...',
      searchContent: normalizeText(`${q.question} ${q.answer}`)
    }));
    return [articleEntry, ...faqFromBlog];
  });

  // 2. [POPRAWIONE]: STUDIA PRZYPADKU (Deep Scan + Tech Data)
  const caseEntries = caseStudies.map(entry => {
    const d = entry.data;
    const tech = d.content?.technology || {};
    
    // Zbieramy wszystkie parametry techniczne do jednego wora
    const techDetails = [
      tech.brand,
      tech.system,
      tech.refrigerant,
      tech.cooling_kw ? `${tech.cooling_kw}kW` : '',
      tech.heating_kw ? `${tech.heating_kw}kW` : '',
      tech.scop ? `scop ${tech.scop}` : '',
      tech.energy_class_heating,
      d.location, // MIASTO!
      d.category
    ].filter(Boolean).join(' ');

    const marketingContent = `${d.tile_data?.problem_short || ''} ${d.tile_data?.solution_short || ''} ${d.tile_data?.excerpt || ''}`;
    const fullDescription = `${d.content?.problem?.description || ''} ${d.content?.solution?.description || ''} ${d.content?.effect?.description || ''}`;

    return {
      id: entry.slug,
      title: d.title,
      type: 'case',
      category: d.category || 'realizacje',
      url: `/studia-przypadkow/${entry.slug}`,
      location: d.location,
      excerpt: d.tile_data?.excerpt || d.tile_data?.problem_short || '',
      // [KLUCZ]: Łączymy wszystko w jeden znormalizowany ciąg
      searchContent: normalizeText(`${d.title} ${d.location} ${techDetails} ${marketingContent} ${fullDescription} ${d.tags?.join(' ') || ''}`)
    };
  });

  // 3. MANUALNE FAQ (Bez zmian)
  const manualFaqEntries = manualFaq.map(faq => ({
    id: faq.id,
    title: faq.title,
    type: 'faq',
    category: faq.category,
    url: faq.url,
    excerpt: stripHtml(faq.answer).substring(0, 160) + '...',
    searchContent: normalizeText(`${faq.title} ${faq.answer} ${faq.tags?.join(' ') || ''}`)
  }));

  return [...blogEntries, ...caseEntries, ...manualFaqEntries];
}