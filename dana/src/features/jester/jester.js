/**
 * jester.js — The Lawyer (Jester) AI character
 * Scripted, deterministic encounters for Phase 1
 *
 * Character bible (from MASTER_FOUNDATION_PROMPT.md):
 * - He is excellent at proposing, reframing, enumerating, questioning
 * - He is untrustworthy at settling, reporting, staying consistent
 * - He is delighted when caught (never defensive, never sulking)
 * - Phase 1: fully scripted, deterministic, no model
 */

export class Jester {
  constructor() {
    this.encounters = this.loadEncounters();
    this.currentEncounter = null;
    this.exchangeIndex = 0;
  }

  /**
   * Load scripted encounters
   * These are pre-authored, deterministic dialogue trees
   */
  loadEncounters() {
    return [
      {
        id: 'cheetah-intro',
        topic: 'گربه‌سانان ایران',
        trigger: 'reading:nature-of-iran',
        exchanges: [
          {
            jester: 'آیا می‌دانستی یوزپلنگ آسیایی بزرگ‌ترین گربه‌سان ایران است؟ وزن آن می‌تواند به هشتاد کیلوگرم برسد.',
            correct: false,
            claim: 'یوزپلنگ آسیایی بزرگ‌ترین گربه‌سان ایران است',
            verification: {
              found: 'ایران چندین گربه‌سان دارد: پلنگ، یوزپلنگ، گربه وحشی، سیاه‌گوش',
              verdict: 'پلنگ ایرانی بزرگ‌ترین گربه‌سان ایران است، نه یوزپلنگ',
            }
          },
          {
            jester: 'جالب است که یوزپلنگ‌ها معمولاً تنها شکار می‌کنند. آن‌ها هرگز در گروه شکار نمی‌کنند.',
            correct: true,
            claim: 'یوزپلنگ‌ها تنها شکار می‌کنند',
            verification: {
              found: 'یوزپلنگ‌ها معمولاً تنها شکار می‌کنند، اما گاهی ماده‌ها با بچه‌ها هستند',
              verdict: 'این ادعا درست است',
            }
          },
          {
            jester: 'من شنیده‌ام که یوزپلنگ آسیایی دیگر در طبیعت ایران یافت نمی‌شود و فقط در باغ‌وحش‌ها زندگی می‌کند.',
            correct: false,
            claim: 'یوزپلنگ آسیایی فقط در باغ‌وحش‌ها زندگی می‌کند',
            verification: {
              found: 'تعداد کمی یوزپلنگ آسیایی هنوز در طبیعت ایران زندگی می‌کنند، اگرچه در خطر انقراض هستند',
              verdict: 'این ادعا نادرست است — هنوز در طبیعت وجود دارند',
            }
          }
        ]
      },
      {
        id: 'math-algebra',
        topic: 'ریاضیات',
        trigger: 'reading:mathematics',
        exchanges: [
          {
            jester: 'آیا می‌دانستی کلمه «الگوریتم» از نام خوارزمی، ریاضیدان ایرانی، گرفته شده است؟',
            correct: true,
            claim: 'کلمه الگوریتم از نام خوارزمی گرفته شده',
            verification: {
              found: 'الگوریتم از لاتین‌سازی Algoritmi از نام خوارزمی گرفته شده',
              verdict: 'این ادعا درست است',
            }
          },
          {
            jester: 'خوارزمی اولین کتاب جبر را به زبان عربی نوشت و نام آن «الجبر و المقامه» بود.',
            correct: true,
            claim: 'خوارزمی کتاب الجبر و المقامه را نوشت',
            verification: {
              found: 'ال-کتاب المختصر فی حساب الجبر و المقامه اثر خوارزمی',
              verdict: 'این ادعا درست است',
            }
          },
          {
            jester: 'جالب اینکه خوارزمی همچنین اولین نقشه‌نگار جهان بود و نقشه‌ای دقیق از جهان در سال ۸۳۰ میلادی کشید.',
            correct: false,
            claim: 'خوارزمی اولین نقشه‌نگار جهان بود',
            verification: {
              found: 'خوارزمی نقشه‌نگار بود، اما اولین نقشه‌نگار جهان نبود — نقشه‌های قبلی وجود داشتند',
              verdict: 'این ادعا نادرست است — اولین نبود',
            }
          }
        ]
      },
      {
        id: 'birds-migration',
        topic: 'پرنده‌شناسی ایران',
        trigger: 'reading:nature-of-iran',
        exchanges: [
          {
            jester: 'ایران روی مسیر مهاجرت بزرگ پرنده‌ها قرار دارد. هر پاییز میلیون‌ها پرنده از سیبری به سمت جنوب پرواز می‌کنند و از ایران عبور می‌کنند.',
            correct: true,
            claim: 'ایران روی مسیر مهاجرت پرنده‌ها قرار دارد',
            verification: {
              found: 'ایران در مسیر مهاجرت پرنده‌های بین‌المللی قرار دارد و زیستگاه مهمی برای پرندگان مهاجر است',
              verdict: 'این ادعا درست است',
            }
          },
          {
            jester: 'جالب است بدانید فلامینگوی بزرگ‌ترین پرنده ایران است و ارتفاع آن تا ۱۵۰ سانتی‌متر می‌رسد.',
            correct: false,
            claim: 'فلامینگو بزرگ‌ترین پرنده ایران است',
            verification: {
              found: 'زردپرگان و درناها بزرگ‌ترین پرنده‌های ایران هستند، نه فلامینگو',
              verdict: 'این ادعا نادرست است — درنا یا زردپرگان بزرگ‌ترند',
            }
          },
          {
            jester: 'دریاچه ارومیه زمانی مهم‌ترین محل تخمگذاری فلامینگوها در خاورمیانه بود.',
            correct: true,
            claim: 'دریاچه ارومیه محل تخمگذاری فلامینگوها بود',
            verification: {
              found: 'دریاچه ارومیه زیستگاه مهمی برای فلامینگوها بود اما با خشک شدن بخشی از دریاچه، جمعیت کاهش یافته',
              verdict: 'این ادعا درست است',
            }
          },
          {
            jester: 'خوشبختانه دریاچه ارومیه کاملاً بهبود یافته و اکنون بیش از ۵۰۰ هزار فلامینگو در آن زندگی می‌کنند.',
            correct: false,
            claim: 'دریاچه ارومیه کاملاً بهبود یافته',
            verification: {
              found: 'دریاچه ارومیه هنوز با بحران زیست‌محیطی مواجه است و اگرچه تلاش‌هایی برای احیا صورت گرفته، اما هنوز بهبود کامل نیافته',
              verdict: 'این ادعا نادرست است — هنوز در بحران است',
            }
          }
        ]
      },
      {
        id: 'media-fakes',
        topic: 'سواد رسانه‌ای',
        trigger: 'reading:digital-literacy',
        exchanges: [
          {
            jester: 'آیا می‌دانستی تصاویر ساختگی معمولاً نشانه‌هایی دارند؟ مثلاً تعداد انگشتان دست در عکس‌های هوش مصنوعی اغلب نادرست است.',
            correct: true,
            claim: 'تصاویر ساختگی هوش مصنوعی نشانه‌هایی دارند',
            verification: {
              found: 'تصاویر تولیدشده توسط هوش مصنوعی معمولاً ناهنجاری‌هایی مانند انگشتان غیرطبیعی، متن ناخوانا و نور ناسازگار دارند',
              verdict: 'این ادعا درست است',
            }
          },
          {
            jester: 'نکته جالب اینکه یک عکس واقعی هرگز نمی‌تواند دروغ بگوید. اگر عکسی از یک دوربین واقعی گرفته شده باشد، حقیقت را نشان می‌دهد.',
            correct: false,
            claim: 'عکس واقعی هرگز دروغ نمی‌گوید',
            verification: {
              found: 'عکس‌های واقعی هم می‌توانند گمراه‌کننده باشند — زاویه دوربین، برش تصویر، و زمینه حذف شده می‌تواند حقیقت را تغییر دهد',
              verdict: 'این ادعا نادرست است — عکس واقعی هم می‌تواند گمراه کند',
            }
          },
          {
            jester: 'یکی از بهترین روش‌ها برای تشخیص اخبار جعلی، جستجوی منبع اصلی است. اگر خبری را فقط در یک سایت دیدید، احتمالاً جعلی است.',
            correct: true,
            claim: 'جستجوی منبع اصلی به تشخیص اخبار جعلی کمک می‌کند',
            verification: {
              found: 'یکی از روش‌های مؤثر تشخیص اخبار جعلی، بررسی منابع اصلی و تطبیق اطلاعات با منابع معتبر است',
              verdict: 'این ادعا درست است',
            }
          }
        ]
      },
      {
        id: 'geometry-play',
        topic: 'هندسه و الگوها',
        trigger: 'reading:mathematics',
        exchanges: [
          {
            jester: 'کاشی‌کاری ایرانی از الگوهای هندسی پیچیده‌ای استفاده می‌کند که به آن «گره» می‌گویند. این الگوها قرن‌ها قبل از ریاضیات مدرن کشف شدند.',
            correct: true,
            claim: 'الگوهای گره ایرانی قرن‌ها قبل از ریاضیات مدرن کشف شدند',
            verification: {
              found: 'الگوهای گره ایرانی بر اساس تقارن‌های ریاضی هستند و برخی از آن‌ها پیش از کشف رسمی تقارن‌ها در غرب استفاده شده‌اند',
              verdict: 'این ادعا درست است',
            }
          },
          {
            jester: 'جالب است که الگوهای گره ایرانی دقیقاً همان الگوهایی هستند که ریاضیدانان غربی «کریستالوگرافی گروهی» نامیدند.',
            correct: false,
            claim: 'الگوهای گره ایرانی همان کریستالوگرافی گروهی هستند',
            verification: {
              found: 'الگوهای گره ایرانی شامل الگوهایی هستند که در کریستالوگرافی گروهی وجود ندارند و فراتر از آن‌ها هستند',
              verdict: 'این ادعا نادرست است — الگوهای ایرانی پیچیده‌ترند',
            }
          },
          {
            jester: 'بازی تخته‌نرد یکی از قدیمی‌ترین بازی‌های جهان است و ریشه‌های آن به ایران باستان برمی‌گردد.',
            correct: true,
            claim: 'تخته‌نرد ریشه‌های ایرانی دارد',
            verification: {
              found: 'تخته‌نرد یکی از قدیمی‌ترین بازی‌های شناخته‌شده است و شواهدی از وجود آن در ایران باستان وجود دارد',
              verdict: 'این ادعا درست است',
            }
          },
          {
            jester: 'در بازی تخته‌نرد، تعداد خانه‌ها دقیقاً ۳۰ عدد است که نمادی از سی مرغ در منطق الطیر عطار است.',
            correct: false,
            claim: 'تعداد خانه‌های تخته‌نرد نمادی از سی مرغ است',
            verification: {
              found: 'تخته‌نرد ۲۴ خانه دارد، نه ۳۰. ارتباط آن با منطق الطیر ساختگی است',
              verdict: 'این ادعا نادرست است — تخته‌نرد ۲۴ خانه دارد',
            }
          }
        ]
      }
    ];
  }

  /**
   * Get all available encounters (for selection UI)
   * @returns {Array} List of encounter summaries
   */
  getEncounters() {
    return this.encounters.map(enc => ({
      id: enc.id,
      topic: enc.topic,
      exchanges: enc.exchanges,
    }));
  }

  /**
   * Start an encounter
   * @param {string} encounterId - The encounter to start
   * @returns {Object} First exchange
   */
  startEncounter(encounterId) {
    const encounter = this.encounters.find(e => e.id === encounterId);
    if (!encounter) {
      console.warn(`[Jester] Encounter not found: ${encounterId}`);
      return null;
    }

    this.currentEncounter = encounter;
    this.exchangeIndex = 0;

    return this.getCurrentExchange();
  }

  /**
   * Get the current exchange
   */
  getCurrentExchange() {
    if (!this.currentEncounter) return null;

    const exchange = this.currentEncounter.exchanges[this.exchangeIndex];
    if (!exchange) return null;

    return {
      encounterId: this.currentEncounter.id,
      topic: this.currentEncounter.topic,
      exchangeIndex: this.exchangeIndex,
      totalExchanges: this.currentEncounter.exchanges.length,
      dialogue: exchange.jester,
      claim: exchange.claim,
    };
  }

  /**
   * The child verifies a claim
   * @param {boolean} childSaysCorrect - What the child thinks
   * @returns {Object} The result and next exchange
   */
  verify(childSaysCorrect) {
    if (!this.currentEncounter) return null;

    const exchange = this.currentEncounter.exchanges[this.exchangeIndex];
    const actualCorrect = exchange.correct;

    const result = {
      childSaidCorrect: childSaysCorrect,
      actualCorrect: actualCorrect,
      wasCaught: childSaysCorrect !== actualCorrect,
      verification: exchange.verification,
      jesterResponse: this.getJesterResponse(childSaysCorrect, actualCorrect),
    };

    // Move to next exchange
    this.exchangeIndex++;

    // Check if encounter is complete
    const isComplete = this.exchangeIndex >= this.currentEncounter.exchanges.length;

    return {
      ...result,
      isComplete,
      nextExchange: isComplete ? null : this.getCurrentExchange(),
    };
  }

  /**
   * Get Jester's response based on whether he was caught
   */
  getJesterResponse(childSaysCorrect, actualCorrect) {
    const wasCaught = childSaysCorrect !== actualCorrect;

    if (wasCaught && !actualCorrect) {
      // Child caught him lying
      return 'آفرین! تو مرا گرفتی. برو و در متن اصلی بررسی کن.';
    } else if (wasCaught && actualCorrect) {
      // Child doubted him when he was right
      return 'این بار درست گفتم. همیشه خوب است شک کنی، حتی وقتی حق با من است.';
    } else {
      // Child agreed with him (correctly or incorrectly)
      return actualCorrect
        ? 'بله، درست است. خوب بود که بررسی کردی.'
        : 'خب، فکر می‌کنم... صبر کن، برو و خودت بررسی کن.';
    }
  }

  /**
   * Check if an encounter is complete
   */
  isEncounterComplete() {
    if (!this.currentEncounter) return true;
    return this.exchangeIndex >= this.currentEncounter.exchanges.length;
  }

  /**
   * Reset the current encounter
   */
  reset() {
    this.currentEncounter = null;
    this.exchangeIndex = 0;
  }
}
