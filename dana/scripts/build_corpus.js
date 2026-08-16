import fs from 'fs/promises';
import path from 'path';

const WIKI_API = 'https://fa.wikipedia.org/api/rest_v1/page/html/';
const WIKI_URL = 'https://fa.wikipedia.org/wiki/';
const LICENSE = 'CC BY-SA 4.0';
const LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/';

const ARTICLES = [
  // Nature
  { title: 'یوزپلنگ_آسیایی', course: 'nature' },
  { title: 'پلنگ_ایرانی', course: 'nature' },
  { title: 'کاراکال', course: 'nature' },
  { title: 'فک_خزری', course: 'nature' },
  { title: 'جنگل‌های_هیرکانی', course: 'nature' },
  { title: 'پارک_ملی_گلستان', course: 'nature' },
  { title: 'فلامینگو', course: 'nature' },
  { title: 'دریاچه_ارومیه', course: 'nature' },
  // Digital Literacy
  { title: 'اخبار_جعلی', course: 'digital-literacy' },
  { title: 'حریم_خصوصی_در_اینترنت', course: 'digital-literacy' },
  { title: 'جعل_عمیق', course: 'digital-literacy' },
  // Mathematics
  { title: 'محمد_بن_موسی_خوارزمی', course: 'mathematics' },
  { title: 'تخته‌نرد', course: 'mathematics' },
  { title: 'گره‌چینی', course: 'mathematics' }
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchArticleWithRetry(title, course, retries = 4, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Fetching: ${title} (Attempt ${i + 1}/${retries})`);
      const res = await fetch(`${WIKI_API}${encodeURIComponent(title)}`, {
        headers: {
          'User-Agent': 'Dana/0.1.0 (https://github.com/MishaelJulian/dana; example@example.com) NodeFetch'
        }
      });
      
      if (res.status === 429) {
        console.warn(`[429] Rate limited on ${title}. Backing off...`);
        await sleep(delay * (i + 2)); // Exponential backoff
        continue;
      }
      
      if (!res.ok) {
        console.warn(`Failed to fetch ${title}: ${res.status}`);
        return null;
      }
      
      let html = await res.text();
      
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        html = bodyMatch[1];
      }
      
      html = html.replace(/<img[^>]*>/g, '<div class="offline-img-placeholder">[تصویر در حالت آفلاین در دسترس نیست]</div>');
      html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      html = html.replace(/<link[^>]*>/g, '');
      html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

      return {
        id: title, // Explicit corpus ID
        title: title.replace(/_/g, ' '),
        course: course,
        source: 'Wikipedia (FA)',
        sourceUrl: `${WIKI_URL}${encodeURIComponent(title)}`,
        license: LICENSE,
        licenseUrl: LICENSE_URL,
        html: html,
        text: title.replace(/_/g, ' ')
      };
    } catch (err) {
      console.error(`Error fetching ${title}:`, err);
      if (i === retries - 1) return null;
      await sleep(delay);
    }
  }
  return null;
}

async function buildCorpus() {
  const corpus = [];
  for (const a of ARTICLES) {
    const article = await fetchArticleWithRetry(a.title, a.course);
    if (article) {
      corpus.push(article);
    }
    // Static delay between every request to avoid triggering 429 in the first place
    await sleep(1500);
  }

  const outPath = path.resolve('public', 'corpus.json');
  await fs.writeFile(outPath, JSON.stringify(corpus, null, 2), 'utf-8');
  console.log(`Corpus built with ${corpus.length} articles saved to ${outPath}`);
}

buildCorpus().catch(console.error);
