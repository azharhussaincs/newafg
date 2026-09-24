/**
 * Afghan Geographic Names - English Transliteration & Semantic Formatter
 * Provides accurate Romanized city/district and province names alongside
 * native Dari/Pashto script for optimal readability and data presentation.
 */

export const PROVINCE_EN_MAP: Record<string, string> = {
  'کابل': 'Kabul',
  'هرات': 'Herat',
  'کندهار': 'Kandahar',
  'بلخ': 'Balkh',
  'ننگرهار': 'Nangarhar',
  'کندز': 'Kunduz',
  'غزنی': 'Ghazni',
  'پروان': 'Parwan',
  'تخار': 'Takhar',
  'بغلان': 'Baghlan',
  'پکتیا': 'Paktia',
  'بامیان': 'Bamyan',
  'لغمان': 'Laghman',
  'کاپیسا': 'Kapisa',
  'لوگر': 'Logar',
  'وردک': 'Wardak',
  'میدان وردک': 'Wardak',
  'سرپل': 'Sar-e Pol',
  'جوزجان': 'Jawzjan',
  'فاریاب': 'Faryab',
  'هلمند': 'Helmand',
  'بدخشان': 'Badakhshan',
  'خوست': 'Khost',
  'پکتیکا': 'Paktika',
  'کنر': 'Kunar',
  'سمنگان': 'Samangan',
  'فراه': 'Farah',
  'غور': 'Ghor',
  'بادغیس': 'Badghis',
  'دایکندی': 'Daykundi',
  'زابل': 'Zabul',
  'نیمروز': 'Nimruz',
  'ارزگان': 'Uruzgan',
  'پنجشیر': 'Panjshir',
  'نورستان': 'Nuristan',
  'کوچی': 'Kuchi (Nomadic)'
};

export const DISTRICT_EN_MAP: Record<string, string> = {
  'کابل': 'Kabul City',
  'انجیل': 'Injil',
  'قندهار': 'Kandahar City',
  'مرکز (هرات)': 'Herat City',
  'مرکز (غزنی)': 'Ghazni City',
  'مرکز (کندز)': 'Kunduz City',
  'چاریکار': 'Charikar',
  'گذره': 'Guzara',
  'تالقان': 'Taloqan',
  'سرخرود': 'Surkh Rod',
  'مرکز (مزار شریف)': 'Mazar-i-Sharif',
  'جاغوری': 'Jaghori',
  'سپین بولدک': 'Spin Boldak',
  'خوگیانی': 'Khogyani',
  'گردیز': 'Gardez',
  'پغمان': 'Paghman',
  'امام صاحب': 'Imam Sahib',
  'مرکز (مهترلام)': 'Mehtarlam',
  'مرکز (بامیان)': 'Bamyan Center',
  'شیندند': 'Shindand',
  'رستاق': 'Rustaq',
  'مرکز (محمود راقی)': 'Mahmud Raqi',
  'خان آباد': 'Khan Abad',
  'مرکز (پل علم)': 'Pul-i-Alam',
  'بهسود (مرکز بهسود)': 'Markaz Behsud',
  'مرکز (میدان)': 'Maydan Shahr',
  'بغلان جدید': 'Baghlan Jadid',
  'مرکز (سرپل)': 'Sar-e Pol City',
  'مرکز (شبرغان)': 'Sheberghan',
  'غوریان': 'Ghorian',
  'بهسود': 'Behsud',
  'دند': 'Dand',
  'رودات': 'Rodat',
  'قرغه ئی': 'Qarghayi',
  'بلخ': 'Balkh District',
  'مرکز (فیض آباد)': 'Fayzabad',
  'مرکز (ایبک)': 'Aybak',
  'نهر سراج': 'Nahr-i-Saraj',
  'مرکز (متون)': 'Matun (Khost)',
  'پلخمری': 'Pul-i-Khumri',
  'دولت آباد': 'Dawlat Abad',
  'کامه': 'Kama',
  'بگرام': 'Bagram',
  'غوربند': 'Ghorband',
  'سانچارک': 'Sangcharak',
  'نادعلی': 'Nad Ali',
  'شولگره': 'Sholgara',
  'مرکز (چغچران)': 'Firozkoh (Chaghcharan)',
  'پنجوایی': 'Panjwayi',
  'مرکز (لشکرگاه)': 'Lashkargah',
  'ارغنداب': 'Arghandab',
  'اندر': 'Andar',
  'ناهور': 'Nahor',
  'ده یک': 'Dih Yak',
  'چاه آب': 'Chah Ab',
  'فرخار': 'Farkhar',
  'اشکمش': 'Ishkamish',
  'کوز کنر': 'Kuz Kunar',
  'ده سبز': 'Deh Sabz',
  'بگرامی': 'Bagrami',
  'قره باغ': 'Qarabagh',
  'شکردره': 'Shakar Dara',
  'کلکان': 'Kalakan',
  'استالف': 'Istalif',
  'چهارآسیاب': 'Char Asiab',
  'فرزه': 'Farza',
  'میربچه کوت': 'Mir Bacha Kot',
  'موسهی': 'Mussahi',
  'کلدار': 'Kaldar',
  'خلم': 'Kholm',
  'دوشی': 'Dushi',
  'خنجان': 'Khinjan',
  'اندراب': 'Andarab',
  'تاله و برفک': 'Tala wa Barfak',
  'کشم': 'Kishim',
  'جرم': 'Jurm',
  'یاوان': 'Yawan',
  'بهارک': 'Baharak',
  'شهربزرگ': 'Shahr-e Buzurg',
  'راغستان': 'Raghistan',
  'کوف آب': 'Kuf Ab',
  'درایم': 'Darayim',
  'خواهان': 'Khwahan',
  'کوهستان': 'Kohistan',
  'جبل السراج': 'Jabal Saraj',
  'سیدخیل': 'Sayed Khel',
  'سالنگ': 'Salang',
  'شینواری': 'Shinwari',
  'سیاه گرد': 'Siah Gird',
  'سرخی پارسا': 'Surkhi Parsa',
  'کوهبند': 'Kohband',
  'حصه اول کوهستان': 'Hisa-e-Awal Kohistan',
  'حصه دوم کوهستان': 'Hisa-e-Duwum Kohistan',
  'نجراب': 'Nijrab',
  'تگاب': 'Tagab',
  'الاه سای': 'Alasay',
  'برکی برک': 'Baraki Barak',
  'چرخ': 'Charkh',
  'خروار': 'Kharwar',
  'محمدآغه': 'Mohammad Agha',
  'ازره': 'Azra',
  'پشتون زرغون': 'Pashtun Zarghun',
  'کرخ': 'Karrukh',
  'کشک': 'Kushk',
  'کشک کهنه': 'Kushk-e-Kuhna',
  'کهسان': 'Kohsan',
  'زنده جان': 'Zinda Jan',
  'ادرسکن': 'Adraskan',
  'فارسی': 'Farsi',
  'اوبه': 'Obe',
  'چشت شریف': 'Chishti Sharif'
};

/**
 * Clean up native names by trimming, removing excessive brackets or duplicate province notes.
 */
export function getCleanNativeName(name?: string, province?: string): string {
  if (!name || !name.trim()) {
    return province ? `مرکز ولایت ${province}` : 'نامشخص';
  }
  let clean = name.trim();

  // If name is like 'مرکز (هرات)', simplify to 'مرکز هرات'
  const match = clean.match(/^مرکز\s*\(([^)]+)\)$/);
  if (match) {
    clean = `مرکز ${match[1]}`;
  }
  return clean;
}

/**
 * Get the English Romanized province name.
 */
export function getEnglishProvinceName(province?: string): string {
  if (!province || !province.trim()) return 'Unspecified';
  const trimmed = province.trim();
  return PROVINCE_EN_MAP[trimmed] || trimmed;
}

/**
 * Get the English Romanized district/city name.
 */
export function getEnglishDistrictName(district?: string, province?: string): string {
  if (!district || !district.trim()) {
    const provEn = getEnglishProvinceName(province);
    return `${provEn} Provincial`;
  }

  const trimmed = district.trim();

  // Direct lookup in our dictionary
  if (DISTRICT_EN_MAP[trimmed]) {
    return DISTRICT_EN_MAP[trimmed];
  }

  // Handle pattern 'مرکز (City)'
  const centerMatch = trimmed.match(/^مرکز\s*\(([^)]+)\)$/);
  if (centerMatch) {
    const inside = centerMatch[1].trim();
    const insideEn = DISTRICT_EN_MAP[inside] || PROVINCE_EN_MAP[inside] || inside;
    return `${insideEn} Center`;
  }

  // If district name matches province, designate as City
  if (province && trimmed === province.trim()) {
    return `${getEnglishProvinceName(province)} City`;
  }

  return trimmed;
}

export type DisplayMode = 'bilingual' | 'english' | 'dari';

/**
 * Formats a city/district name according to the selected display mode:
 * - 'bilingual': "Kabul • کابل" or "Injil • انجیل"
 * - 'english': "Kabul (Kabul)" or "Injil (Herat)"
 * - 'dari': "کابل" or "انجیل (هرات)"
 */
export function formatDistrictDisplay(
  district: string | undefined,
  province: string | undefined,
  mode: DisplayMode = 'bilingual'
): {
  primary: string;
  secondary: string;
  fullTag: string;
  provinceEn: string;
  provinceNative: string;
} {
  const cleanNative = getCleanNativeName(district, province);
  const englishName = getEnglishDistrictName(district, province);
  const provinceEn = getEnglishProvinceName(province);
  const provinceNative = (province || '').trim() || 'نامشخص';

  let primary = englishName;
  let secondary = cleanNative;

  if (mode === 'english') {
    primary = englishName;
    secondary = provinceEn !== englishName ? provinceEn : '';
  } else if (mode === 'dari') {
    primary = cleanNative;
    secondary = provinceNative !== cleanNative ? provinceNative : '';
  } else {
    // Bilingual mode
    primary = englishName;
    secondary = cleanNative;
  }

  const fullTag = `${englishName} • ${cleanNative}`;

  return {
    primary,
    secondary,
    fullTag,
    provinceEn,
    provinceNative
  };
}

/**
 * Formats large counts into human-readable compact strings, e.g. 804,848 -> 804.8K
 */
export function formatCompactNumber(val: number): string {
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(2)}M`;
  }
  if (val >= 10_000) {
    return `${(val / 1_000).toFixed(1)}K`;
  }
  if (val >= 1_000) {
    return `${(val / 1_000).toFixed(1)}K`;
  }
  return val.toLocaleString();
}
