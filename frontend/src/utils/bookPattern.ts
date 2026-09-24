/**
 * Afghan Civil Registry Official Book Types
 * Total: 51,834 Volumes across Afghanistan (Mutually Exclusive)
 * Proper Administrative Classification:
 * - All Books: 51,834 (31,164,973 records)
 * - Qalam Andaz (قلم انداز): 7,561 (1,835,086 records)
 * - Asas (اساس): 2,428 (320,866 records)
 * - Motafariqa (متفرقه): 1,694 (906,357 records)
 * - Births (تولدات): 29 (2,435 records)
 * - Kochi (کوچی): 508 (228,087 records)
 * - Other Registries (سایر دفاتر): 39,614 (27,872,142 records)
 * Sum: 7,561 + 2,428 + 1,694 + 29 + 508 + 39,614 = 51,834 (Zero mismatch)
 */

export interface BookTypeOption {
  id: string;
  name: string;
  nameEn: string;
  count: number;
  recordsCount: number;
  icon: string;
  subtitle: string;
  subtitleEn: string;
  definition: string;
  definitionEn: string;
  whyThisName: string;
  whyThisNameEn: string;
  legalBasis: string;
  legalBasisEn: string;
  color: string;
  bgColor: string;
  borderColor: string;
  match: (bookName: string) => boolean;
}

export function classifyBook(bookName: string, province?: string): string {
  if (province === 'کوچی' || province === 'Kochi') return 'kochi';
  if (!bookName) return 'other';
  const norm = bookName.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ');
  if (norm.includes('کوچی') || norm.includes('عشایر')) return 'kochi';
  if (norm.includes('اساس') || norm.includes('اصل ساس')) return 'asas';
  if (norm.includes('قلم انداز') || norm.includes('قلم‌انداز') || norm.includes('قلم اندز') || norm.includes('قلم اندار')) return 'qalam_andaz';
  if (norm.includes('متفرقه')) return 'motafariqa';
  if (norm.includes('تولدات')) return 'births';
  return 'other';
}

export function isBookCopy(bookName: string): boolean {
  if (!bookName) return false;
  return bookName.includes('نقل') || bookName.includes('کاپی');
}

export function isBookOriginal(bookName: string): boolean {
  if (!bookName) return false;
  return bookName.includes('اصل');
}

export function isBookPMU(bookName: string): boolean {
  if (!bookName) return false;
  return bookName.includes('پی ام یو') || bookName.includes('پی‌ام‌یو') || bookName.includes('PMU');
}

export const BOOK_TYPES: BookTypeOption[] = [
  {
    id: 'all',
    name: 'همه کتاب‌ها (All)',
    nameEn: 'All Registry Volumes',
    count: 51834,
    recordsCount: 31164973,
    icon: '🌐',
    subtitle: 'مجموعه کامل ۵۱،۸۳۴ جلد ثبت احوال نفوس',
    subtitleEn: 'Complete national archive of 51,834 civil status ledgers across Afghanistan',
    definition: 'آرشیف عمومی و کامل تمامی دفاتر ثبت احوال نفوس افغانستان شامل دفاتر میدانی، سجل‌های دایمی، دفاتر متفرقه، وقایع حیاتی و دفاتر عشایر.',
    definitionEn: 'Complete national archive of all 51,834 civil registration ledgers across all 34 provinces of Afghanistan, encompassing field drafts, master baselines, supplemental records, vital birth registries, and nomadic tribe archives.',
    whyThisName: 'دیدگاه جامع به عنوان نمای کلی سیستم برای مرور آرشیف کامل بدون هیچ‌گونه فیلتر یا محدودیت طبقه‌بندی.',
    whyThisNameEn: 'Universal root view providing complete archive visibility without category constraints, representing 100% of all digitized national registers.',
    legalBasis: 'قانون ثبت احوال نفوس افغانستان و آرشیف ملی اداره ملی احصائیه و معلومات (NSIA)',
    legalBasisEn: 'Civil Registration Law of Afghanistan & Central Archive of NSIA',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800/60',
    match: () => true,
  },
  {
    id: 'qalam_andaz',
    name: 'قلم‌انداز (Qalam Andaz)',
    nameEn: 'Field Census Drafts',
    count: 7561,
    recordsCount: 1835086,
    icon: '📝',
    subtitle: 'دفاتر ثبت عمومی و میدانی نفوس',
    subtitleEn: 'Field census registers, local village enumeration & primary Tazkira distribution',
    definition: 'دفاتر اولیه و میدانی که توسط هیئت‌های سیار و کارمندان ثبت احوال نفوس مستقیماً در قریه‌جات، ولسوالی‌ها و نواحی با قلم روی کاغذ درج گردیده است. این دفاتر بدنه اصلی ثبت هویت نفوس افغانستان را تشکیل می‌دهند.',
    definitionEn: 'Field census and local enumeration registers compiled directly on-site in villages and districts by mobile census commissions.',
    whyThisName: 'واژه «قلم‌انداز» یک اصطلاح رسمی در اداره ثبت احوال نفوس است به معنای ثبت درجا و میدانی. این نام دقیقاً عنوان چاپی روی جلد فیزیکی این دفاتر در آرشیف است و در تذکره‌های صادره به نام دفتر قلم‌انداز ارجاع داده می‌شود.',
    whyThisNameEn: 'Official administrative term printed on physical ledger covers by NSIA. Signifies immediate on-site census enumeration by field teams.',
    legalBasis: 'طرزالعمل توزیع تذکره کاغذی و سرشماری‌های عمومی نفوس مصوب اداره ملی احصائیه و معلومات (NSIA)',
    legalBasisEn: 'Paper Tazkira Distribution Procedures & General Census Regulations (NSIA)',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800/60',
    match: (b: string) => classifyBook(b) === 'qalam_andaz',
  },
  {
    id: 'asas',
    name: 'اساس (Asas / اصل اساس)',
    nameEn: 'Master Baseline Ledgers',
    count: 2428,
    recordsCount: 320866,
    icon: '🏛️',
    subtitle: 'سجل و دفاتر دایمی اصلی',
    subtitleEn: 'Permanent master baseline civil registers (Sijil) & foundational identity records',
    definition: 'دفاتر مرجع و مادر هویت ملی افغانستان (سجل اصلی). طبق قانون ثبت احوال نفوس، هر تذکره رسمی صادره باید به شماره جلد، صفحه و ثبت در کتاب اساس ارجاع داشته باشد. این دفاتر در گاوصندوق‌های آرشیف مرکزی نگهداری می‌شوند.',
    definitionEn: 'Permanent master civil registers (Sijil). Legal foundation of all issued national identity papers; every authentic paper Tazkira references a volume, page, and entry number in the Asas ledger.',
    whyThisName: 'نام «اساس» به معنای بنیاد و پایه حقوقی ثبت احوال نفوس است. در نظام اداری افغانستان، این دفاتر به عنوان بالاترین سند حاکمیتی شناخته می‌شوند و هرگونه بررسی اصالت تابعیت مستلزم مطابقت با دفتر اساس است.',
    whyThisNameEn: 'Derived from "Foundation / Baseline". In Afghan jurisprudence, Asas is the highest legal proof of citizenship. Courts and embassies specifically mandate citizenship verification against the Asas master ledger.',
    legalBasis: 'ماده ۴ و ۵ قانون ثبت احوال نفوس افغانستان و آرشیف سرشماری عمومی سال ۱۳۵۳',
    legalBasisEn: 'Articles 4 & 5 of the Civil Registration Law of Afghanistan & Census Archive of 1353 SH',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800/60',
    match: (b: string) => classifyBook(b) === 'asas',
  },
  {
    id: 'motafariqa',
    name: 'متفرقه (Motafariqa)',
    nameEn: 'Supplemental Records',
    count: 1694,
    recordsCount: 906357,
    icon: '📑',
    subtitle: 'دفاتر متفرقه، الحاقی و مثنی',
    subtitleEn: 'Supplemental records, delayed registrants, returnees, annexes & duplicate Tazkiras',
    definition: 'دفاتری که برای افرادی که از سرشماری عمومی بازمانده بودند (تارکین ثبت)، مهاجرین بازگشته، موارد تغییر یا الحاق خانواده، و صدور مثنی تذکره باز گردیده است.',
    definitionEn: 'Supplemental registers for citizens who missed general censuses, returning refugees from Pakistan/Iran, annex family records, or duplicate (Mosanna) replacement Tazkiras.',
    whyThisName: 'از نظر فنی و بایگانی، دفاتر متفرقه به این نام ثبت شده‌اند چون تابع ترتیب مکانی یا زمانی یک سرشماری سراسری نیستند، بلکه پرونده‌های انفرادی و الحاقی در آنها ثبت شده است.',
    whyThisNameEn: 'Designated as "Motafariqa" (Supplemental / Annex) because entries were recorded individually outside the primary chronological censuses, preventing alteration of sealed master Asas books.',
    legalBasis: 'مقررات صدور تذکره مثنی و تارکین ثبت احوال نفوس',
    legalBasisEn: 'Regulations on Late Registration (Tarekin-e-Sabt) & Duplicate (Mosanna) Issuance',
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800/60',
    match: (b: string) => classifyBook(b) === 'motafariqa',
  },
  {
    id: 'births',
    name: 'تولدات (Births)',
    nameEn: 'Vital Birth Registries',
    count: 29,
    recordsCount: 2435,
    icon: '👶',
    subtitle: 'دفاتر ثبت ولادت‌ها و اطفال',
    subtitleEn: 'Dedicated vital statistics registries for infant births in provincial civil hospitals',
    definition: 'دفاتر ثبت وقایع حیاتی اطفال نوزاد که مستقیماً در شفاخانه‌های ملکی، زایشگاه‌ها و مراکز صحی ولایات برای صدور کارت تولد (تصدیق ولادت) ثبت شده است.',
    definitionEn: 'Vital birth statistics registries maintained in civil maternity hospitals and provincial health centers for issuing official birth certificates (Cart-e-Tawallod).',
    whyThisName: 'این دفاتر با تذکره‌های عمومی خانواده متفاوت‌اند؛ موضوع ثبت آنها صرفاً رویداد ولادت نوزاد و مشخصات والدین اوست، مطابق با فصل وقایع چهارگانه حیاتی در قانون ثبت احوال نفوس.',
    whyThisNameEn: 'Distinct from multi-generational family census books; specifically records newborn vital birth events under international vital statistics standards and Afghan Civil Law.',
    legalBasis: 'فصل وقایع حیاتی (ثبت ولادت و وفات) در قانون ثبت احوال نفوس افغانستان',
    legalBasisEn: 'Vital Statistics Chapter (Birth & Death Registration) of the Civil Registration Law',
    color: 'text-teal-700 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    borderColor: 'border-teal-200 dark:border-teal-800/60',
    match: (b: string) => classifyBook(b) === 'births',
  },
  {
    id: 'kochi',
    name: 'کوچی (Kochi)',
    nameEn: 'Nomadic Registries',
    count: 508,
    recordsCount: 228087,
    icon: '🏕️',
    subtitle: 'دفاتر اختصاصی عشایر و کوچی‌ها',
    subtitleEn: 'Dedicated civil registers for nomadic pastoralist tribes & seasonal migration clans',
    definition: 'دفاتر ویژه شهروندان کوچی و عشایر که سکونت دایمی در یک قریه یا ولسوالی مشخص ندارند و بر اساس مسیرهای ییلاق و قشلاق تحت نظارت ریاست مستقل انسجام کوچی‌ها ثبت شده‌اند.',
    definitionEn: 'Specialized civil ledgers for nomadic pastoralists (Kochi) who move seasonally across provincial boundaries, administered under the Independent Directorate of Nomadic Affairs.',
    whyThisName: 'جامعه کوچی در قانون اساسی (ماده ۱۴) و قانون ثبت احوال نفوس دارای ساختار اداری و سهمیه مشخص است. دفاتر آنها به دلیل عدم تعلق به جغرافیای روستایی ثابت، کدهای شناسایی و جلدهای مستقلی به نام «کوچی» دارند.',
    whyThisNameEn: 'Nomadic communities have dedicated constitutional and administrative recognition in Afghan law (Article 14). Their physical ledgers carry the explicit stamped designation "Kochi".',
    legalBasis: 'ماده ۱۴ قانون اساسی افغانستان و طرزالعمل ریاست انسجام امور کوچی‌ها',
    legalBasisEn: 'Article 14 of the Constitution of Afghanistan & Directorate of Nomadic Affairs Mandate',
    color: 'text-rose-700 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    borderColor: 'border-rose-200 dark:border-rose-800/60',
    match: (b: string) => classifyBook(b) === 'kochi',
  },
  {
    id: 'other',
    name: 'سایر دفاتر (Other)',
    nameEn: 'Special Admin Registries',
    count: 39614,
    recordsCount: 27872142,
    icon: '📚',
    subtitle: 'سایر جلدهای رسمی و آرشیف عمومی',
    subtitleEn: 'Archival ledger volumes and official indexed registers across all provinces',
    definition: 'شامل تمامی جلدهای رسمی شماره‌گذاری شده در آرشیف دیجیتال که کدهای ثبتی و صفحات آنها در سیستم ثبت احوال نفوس به صورت دیجیتالی ایندکس گردیده است. این دسته‌بندی برای تضمین عدم اتلاف حتی یک سند از کل سوابق کشور ایجاد شده است.',
    definitionEn: 'Digitized official ledger volumes with verified page indexes across all administrative directorates. Preserved to ensure zero data loss.',
    whyThisName: 'این دسته‌بندی برای ایجاد شفافیت و امانتداری کامل علمی است تا هیچ سندی از مجموع کل اسناد حذف یا تحریف نگردد.',
    whyThisNameEn: 'Guarantees 100% mathematical integrity and zero record loss, keeping all authentic citizen records fully searchable and accessible.',
    legalBasis: 'اصل جامعیت و حفظ اسناد عمومی اداره احصائیه',
    legalBasisEn: 'Universal Archival Preservation Standard ensuring zero data loss across all records',
    color: 'text-slate-700 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-950/30',
    borderColor: 'border-slate-200 dark:border-slate-800/60',
    match: (b: string) => classifyBook(b) === 'other',
  },
];

export const BOOK_PATTERNS = BOOK_TYPES.map(t => ({
  id: t.id,
  label: t.name,
  labelEn: t.nameEn,
  badge: t.name,
  count: t.count,
  icon: t.icon,
  description: t.subtitle,
  descriptionEn: t.nameEn,
  color: t.color,
  bgColor: t.bgColor,
  borderColor: t.borderColor,
  match: t.match
}));

export type BookPatternOption = BookTypeOption;

export function getBookPatternBadge(bookName: string): { label: string; color: string } {
  const cat = classifyBook(bookName);
  if (cat === 'kochi') {
    return { label: 'کوچی', color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' };
  }
  if (cat === 'motafariqa') {
    return { label: 'متفرقه', color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' };
  }
  if (cat === 'asas') {
    return { label: 'اساس', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
  }
  if (cat === 'births') {
    return { label: 'تولدات', color: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30' };
  }
  if (cat === 'other') {
    return { label: 'سایر', color: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30' };
  }
  return { label: 'قلم‌انداز', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' };
}
