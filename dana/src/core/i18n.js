/**
 * i18n.js — Internationalization (Persian ↔ English)
 * All UI strings managed here for one-click language switching
 */

const translations = {
  fa: {
    // Nav
    'nav.back': 'بازگشت',
    'nav.menu': 'منو',
    'nav.title': 'دانا',

    // Landing
    'landing.library': 'کتابخانه',
    'landing.palace': 'کاخ ذهن',
    'landing.jester': 'وکیل',
    'landing.tagline': 'راه‌آموز',

    // Reading
    'reading.search': 'جستجو...',
    'reading.select': 'یک مقاله انتخاب کنید',
    'reading.source': 'ویکی‌پدیای فارسی',
    'reading.verify': 'بررسی کن',
    'reading.verify.all': 'بررسی همه ادعاها',

    // Course filters
    'course.all': 'همه',
    'course.nature': 'طبیعت',
    'course.digital': 'رسانه',
    'course.math': 'ریاضی',

    // Claims
    'claim.prefix': 'ادعا',
    'claim.correct': '✅ درست است',
    'claim.wrong': '❌ نادرست است',
    'claim.result': 'نتیجه',
    'claim.source': 'منبع',
    'claim.reward': '🎉 آفرین! تو درست تشخیص دادی!',
    'claim.prompt': 'آیا می‌توانی ادعاهای زیر را بررسی کنی؟',

    // Jester
    'jester.title': 'وکیل',
    'jester.subtitle': 'قدرت پیشنهاد، ضعف در پاسخ',
    'jester.select': 'موضوع گفتگو را انتخاب کن:',
    'jester.claim': 'ادعا',
    'jester.next': 'سوال بعدی',
    'jester.done': 'انتخاب موضوع دیگر',
    'jester.questions': 'سوال',
    'jester.yes': 'فکر می‌کنم درست است',
    'jester.no': 'فکر می‌کنم نادرست است',

    // Palace
    'palace.loading': 'در حال بارگذاری کاخ ذهن...',
    'palace.hint': 'بکشید برای چرخش، روی گره‌ها کلیک کنید',
    'palace.enter': 'ورود',

    // Hashtiyeh
    'hashtiyeh.label': 'حاشیه‌نویسی',

    // Onboarding
    'onboarding.welcome': 'به دانا خوش آمدی',
    'onboarding.name': 'نام تو چیست؟',
    'onboarding.age': 'چند سال داری؟',
    'onboarding.future': 'آینده‌ات چی می‌خواهی باشی؟',
    'onboarding.curiosity': 'چه چیزی تو را کنجکاو می‌کند؟',
    'onboarding.place': 'از کجا هستی؟',
    'onboarding.room': 'اتاق ذهن تو',
    'onboarding.done': 'بزن بریم!',
    'onboarding.next': 'بعدی',

    // Misc
    'lang.toggle': 'EN',
    'theme.toggle': '🌙',
  },

  en: {
    // Nav
    'nav.back': 'Back',
    'nav.menu': 'Menu',
    'nav.title': 'Dana',

    // Landing
    'landing.library': 'Library',
    'landing.palace': 'Mind Palace',
    'landing.jester': 'The Lawyer',
    'landing.tagline': 'Path-teacher',

    // Reading
    'reading.search': 'Search...',
    'reading.select': 'Select an article',
    'reading.source': 'Persian Wikipedia',
    'reading.verify': 'Verify',
    'reading.verify.all': 'Verify all claims',

    // Course filters
    'course.all': 'All',
    'course.nature': 'Nature',
    'course.digital': 'Media',
    'course.math': 'Math',

    // Claims
    'claim.prefix': 'Claim',
    'claim.correct': '✅ Correct',
    'claim.wrong': '❌ Wrong',
    'claim.result': 'Result',
    'claim.source': 'Source',
    'claim.reward': '🎉 Well done! You caught it!',
    'claim.prompt': 'Can you verify these claims?',

    // Jester
    'jester.title': 'The Lawyer',
    'jester.subtitle': 'Power of proposal, weakness of answer',
    'jester.select': 'Choose a topic:',
    'jester.claim': 'Claim',
    'jester.next': 'Next question',
    'jester.done': 'Choose another topic',
    'jester.questions': 'questions',
    'jester.yes': 'I think it\'s correct',
    'jester.no': 'I think it\'s wrong',

    // Palace
    'palace.loading': 'Loading Mind Palace...',
    'palace.hint': 'Drag to rotate, click nodes',
    'palace.enter': 'Enter',

    // Hashtiyeh
    'hashtiyeh.label': 'Marginalia',

    // Onboarding
    'onboarding.welcome': 'Welcome to Dana',
    'onboarding.name': 'What is your name?',
    'onboarding.age': 'How old are you?',
    'onboarding.future': 'What do you want to be when you grow up?',
    'onboarding.curiosity': 'What makes you curious?',
    'onboarding.place': 'Where are you from?',
    'onboarding.room': 'Your Mind Room',
    'onboarding.done': 'Let\'s go!',
    'onboarding.next': 'Next',

    // Misc
    'lang.toggle': 'فا',
    'theme.toggle': '☀️',
  }
};

let currentLang = localStorage.getItem('dana-lang') || 'fa';

export function t(key) {
  return translations[currentLang]?.[key] || translations.fa[key] || key;
}

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('dana-lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
}

export function toggleLang() {
  const newLang = currentLang === 'fa' ? 'en' : 'fa';
  setLang(newLang);
  return newLang;
}

export function initLang() {
  setLang(currentLang);
}
