const SPECIALITIES: Record<string, string> = {
  'generaliste': 'طبيب أخصائي في الطب العام',
  'medecin generaliste': 'طبيب أخصائي في الطب العام',
  'generale': 'الطب العام',
  'cardiologue': 'أخصائي في أمراض القلب والشرايين',
  'cardiologie': 'أمراض القلب والشرايين',
  'pediatre': 'أخصائي في طب الأطفال والرضع',
  'pediatrie': 'طب الأطفال والرضع',
  'dermatologue': 'أخصائي في أمراض الجلد والجلدية والتجميل',
  'dermatologie': 'أمراض الجلد والتجميل',
  'gynecologue': 'أخصائي في أمراض النساء والتوليد وعلاج العقم',
  'gynecologie': 'أمراض النساء والتوليد وعلاج العقم',
  'ophtalmologue': 'أخصائي في طب وجراحة العيون',
  'ophtalmologie': 'طب وجراحة العيون',
  'dentiste': 'طبيب أخصائي في طب وجراحة الأسنان',
  'chirurgien dentiste': 'طبيب جراح أخصائي في جراحة الفم والأسنان',
  'dentaire': 'طب وجراحة الأسنان',
  'orthopediste': 'أخصائي في جراحة العظام والمفاصل والعمود الفقري',
  'orthopedie': 'جراحة العظام والمفاصل',
  'neurologue': 'أخصائي في أمراض الدماغ والأعصاب',
  'neurologie': 'أمراض الدماغ والأعصاب',
  'psychiatre': 'أخصائي في الأمراض النفسية والعصبية والعقلية',
  'psychiatrie': 'الأمراض النفسية والعقلية',
  'urologue': 'أخصائي في جراحة الكلى والمسالك البولية والتناسلية',
  'urolique': 'أخصائي في جراحة الكلى والمسالك البولية والتناسلية',
  'urologie': 'جراحة الكلى والمسالك البولية',
  'orl': 'أخصائي في جراحة الأذن والأنف والحنجرة',
  'oto-rhino-laryngologie': 'جراحة الأذن والأنف والحنجرة',
  'gastro-enterologue': 'أخصائي في أمراض الجهاز الهضمي والكبد',
  'gastro': 'أمراض الجهاز الهضمي والكبد',
  'endocrinologue': 'أخصائي في أمراض الغدد الصماء والسكري',
  'endocrinologie': 'أمراض الغدد الصماء والسكري',
  'rhumatologue': 'أخصائي في أمراض المفاصل والروماتيزم',
  'rhumatologie': 'أمراض المفاصل والروماتيزم',
  'nephrologue': 'أخصائي في أمراض وغسيل الكلى',
  'nephrologie': 'أمراض وغسيل الكلى',
  'pneumologue': 'أخصائي في أمراض الجهاز التنفسي والربو والحساسية',
  'pneumologie': 'أمراض الجهاز التنفسي والربو والحساسية',
  'radiologue': 'أخصائي في الفحص بالأشعة والسونار والرنين المغناطيسي',
  'radiologie': 'الأشعة الطبية والفحوصات',
  'chirurgien': 'طبيب جراح أخصائي في الجراحة العامة والمنظار',
  'chirurgie': 'الجراحة العامة والمناظير',
  'nutritionniste': 'أخصائي في التغذية الطبية والحمية العلاجية',
  'oncologue': 'أخصائي في علاج الأورام وأمراض السرطان',
  'anesthesiste': 'أخصائي في التخدير والإنعاش وإدارة الألم',
  'dossier': 'الملف الطبي',
  'dossiers': 'الملفات الطبية',
  'dossier medical': 'الملف الطبي الكامل',
  'dossiers patients': 'ملفات المرضى الطبية',
};

const CITIES: Record<string, string> = {
  'casablanca': 'الدار البيضاء',
  'rabat': 'الرباط',
  'marrakech': 'مراكش',
  'tanger': 'طنجة',
  'fes': 'فاس',
  'meknes': 'مكناس',
  'oujda': 'وجدة',
  'agadir': 'أكادير',
  'kenitra': 'القنيطرة',
  'tetouan': 'تطوان',
  'safi': 'أسفي',
  'temara': 'تمارة',
  'sale': 'سلا',
  'mohammedia': 'المحمدية',
  'nador': 'الناضور',
  'khouribga': 'خريبكة',
  'beni mellal': 'بني ملال',
  'el jadida': 'الجديدة',
  'taza': 'تازة',
  'ouarzazate': 'ورزازات',
  'laayoune': 'العيون',
  'dakhla': 'الداخلة',
  'taroudant': 'تارودانت',
  'guelmim': 'كلميم',
  'errachidia': 'الرشيدية',
  'berkane': 'بركان',
  'al hoceima': 'الحسيمة',
};

const ADDRESS_WORDS: Record<string, string> = {
  'boulevard': 'شارع',
  'bd': 'شارع',
  'avenue': 'شارع',
  'av': 'شارع',
  'rue': 'زنقة',
  'n°': 'رقم',
  'n': 'رقم',
  'numero': 'رقم',
  'numéro': 'رقم',
  'immeuble': 'عمارة',
  'imm': 'عمارة',
  'etage': 'الطابق',
  'étage': 'الطابق',
  'appartement': 'شقة',
  'appt': 'شقة',
  'residence': 'إقامة',
  'résidence': 'إقامة',
  'res': 'إقامة',
  'quartier': 'حي',
  'qrt': 'حي',
  'qt': 'حي',
  'secteur': 'قطاع',
  'sect': 'قطاع',
  'zone': 'منطقة',
  'ville': 'مدينة',
  'maroc': 'المغرب',
  'cabinet': 'عيادة',
  'clinique': 'مصحة',
  'centre': 'مركز',
  'medical': 'طبية',
  'médical': 'طبية',
  'v': 'الخامس',
  'iv': 'الرابع',
  'vi': 'السادس',
};

const NAMES: Record<string, string> = {
  'dr.': 'د.',
  'dr': 'د.',
  'docteur': 'الدكتور',
  'pr.': 'أ.',
  'pr': 'أ.',
  'professeur': 'البروفيسور',
  'karim': 'كريم',
  'amine': 'أمين',
  'amin': 'أمين',
  'youssef': 'يوسف',
  'yousef': 'يوسف',
  'mohamed': 'محمد',
  'mohammed': 'محمد',
  'mourad': 'مراد',
  'ahmed': 'أحمد',
  'ali': 'علي',
  'omar': 'عمر',
  'khalid': 'خالد',
  'halid': 'خالد',
  'rachid': 'رشيد',
  'mustapha': 'مصطفى',
  'mostafa': 'مصطفى',
  'said': 'سعيد',
  'saïd': 'سعيد',
  'hassan': 'حسن',
  'hasan': 'حسن',
  'houssine': 'حسين',
  'hussein': 'حسين',
  'hicham': 'هشام',
  'yassine': 'ياسين',
  'yassin': 'ياسين',
  'anass': 'أنس',
  'anas': 'أنس',
  'samir': 'سمير',
  'adil': 'عادل',
  'adel': 'عادل',
  'fouad': 'فؤاد',
  'tariq': 'طارق',
  'tarek': 'طارق',
  'nabil': 'نبيل',
  'reda': 'رضا',
  'rida': 'رضا',
  'zakaria': 'زكرياء',
  'zakariya': 'زكرياء',
  'hamza': 'حمزة',
  'mehdi': 'المهدي',
  'othman': 'عثمان',
  'othmane': 'عثمان',
  'ayoub': 'أيوب',
  'imane': 'إيمان',
  'fatima': 'فاطمة',
  'fatym': 'فاطمة',
  'meryem': 'مريم',
  'meriem': 'مريم',
  'maryam': 'مريم',
  'sanaa': 'سناء',
  'sana': 'سناء',
  'khadija': 'خديجة',
  'laila': 'ليلى',
  'layla': 'ليلى',
  'salma': 'سلمى',
  'nisrine': 'نسرين',
  'nisrin': 'نسرين',
  'siham': 'سهام',
  'bouchra': 'بشرى',
  'najat': 'نجاة',
  'asmae': 'أسماء',
  'asma': 'أسماء',
  'chaimae': 'شيماء',
  'chaima': 'شيماء',
  'zineb': 'زينب',
  'benali': 'بنعلي',
  'alaoui': 'العلوي',
  'idrissi': 'الإدريسي',
  'filali': 'الفيلالي',
  'amrani': 'العمراني',
  'tazi': 'التازي',
  'daoudi': 'الداودي',
  'mansouri': 'المنصوري',
  'sabri': 'صبري',
  'naji': 'ناجي',
  'qadiri': 'القادري',
  'radi': 'الراضي',
  'jamil': 'جميل',
  'rami': 'رامي',
  'ben': 'بن',
  'ait': 'آيت',
  'bennani': 'بناني',
  'el': 'ال',
  'ouazzani': 'الوزاني',
  'chraibi': 'الشرايبي',
  'bennis': 'بنيس',
};

function transliterateWord(word: string): string {
  let w = word.toLowerCase();
  
  // Custom replacements for French/Moroccan phonetic groups
  w = w.replace(/ou/g, 'و');
  w = w.replace(/ch/g, 'ش');
  w = w.replace(/kh/g, 'خ');
  w = w.replace(/gh/g, 'غ');
  w = w.replace(/ph/g, 'ف');
  w = w.replace(/th/g, 'ث');
  w = w.replace(/sh/g, 'ش');
  w = w.replace(/ai/g, 'ي');
  w = w.replace(/ei/g, 'ي');
  w = w.replace(/ay/g, 'ي');
  w = w.replace(/ey/g, 'ي');
  w = w.replace(/au/g, 'و');
  w = w.replace(/eau/g, 'و');
  w = w.replace(/gu/g, 'ق');
  
  if (w.startsWith('a') || w.startsWith('e') || w.startsWith('i') || w.startsWith('o') || w.startsWith('u')) {
    w = 'أ' + w.substring(1);
  }
  
  let result = '';
  for (let i = 0; i < w.length; i++) {
    const char = w[i];
    if (['أ', 'و', 'ش', 'خ', 'غ', 'ف', 'ث', 'ي', 'ق'].includes(char)) {
      result += char;
      continue;
    }
    
    switch (char) {
      case 'b': result += 'ب'; break;
      case 't': result += 'ت'; break;
      case 'j': result += 'ج'; break;
      case 'h': result += 'ه'; break;
      case 'd': result += 'د'; break;
      case 'r': result += 'ر'; break;
      case 'z': result += 'ز'; break;
      case 's': result += 'س'; break;
      case 'c': result += (w[i+1] === 'e' || w[i+1] === 'i' || w[i+1] === 'y') ? 'س' : 'ك'; break;
      case 'f': result += 'ف'; break;
      case 'q': result += 'ق'; break;
      case 'k': result += 'ك'; break;
      case 'l': result += 'ل'; break;
      case 'm': result += 'م'; break;
      case 'n': result += 'ن'; break;
      case 'v': result += 'ف'; break;
      case 'w': result += 'و'; break;
      case 'x': result += 'كس'; break;
      case 'y': result += 'ي'; break;
      case 'a': result += 'ا'; break;
      case 'i': result += 'ي'; break;
      case 'o': result += 'و'; break;
      case 'u': result += 'و'; break;
      case 'e': 
        if (i === w.length - 1 && result.length > 2) {
          // silent at the end
        } else {
          result += 'ي';
        }
        break;
    }
  }
  
  result = result.replace(/اا+/g, 'ا');
  result = result.replace(/يي+/g, 'ي');
  result = result.replace(/وو+/g, 'و');
  
  return result;
}

export function translateToArabic(text: string, type: 'name' | 'speciality' | 'address' | 'cabinet'): string {
  if (!text) return '';
  
  // If the text already has Arabic characters, return as is or strip French
  const hasArabic = (str: string) => /[\u0600-\u06FF]/.test(str);
  if (hasArabic(text)) {
    // If it has a slash, return the Arabic part
    const separators = ['/', '|', ' — '];
    for (const sep of separators) {
      if (text.includes(sep)) {
        const parts = text.split(sep);
        const part0 = parts[0].trim();
        const part1 = parts[1].trim();
        if (hasArabic(part1)) return part1;
        if (hasArabic(part0)) return part0;
      }
    }
    return text;
  }
  
  const cleanText = text.trim();
  const lowerText = cleanText.toLowerCase();

  // Smart Contextual Translations for specialties, cabinets, and clinical terms (to avoid literal or clumsy translations)
  if (type === 'speciality' || type === 'cabinet') {
    // Dentist / Dental / Oral surgery
    if (lowerText.includes('dentiste') || lowerText.includes('dentaire')) {
      if (lowerText.includes('cabinet') || lowerText.includes('centre') || lowerText.includes('clinique')) {
        return 'عيادة طب وجراحة الأسنان';
      }
      return 'طبيب أخصائي في طب وجراحة الأسنان';
    }
    // General practitioner / general medicine
    if (lowerText.includes('généraliste') || lowerText.includes('generaliste') || lowerText.includes('générale') || lowerText.includes('generale')) {
      if (lowerText.includes('cabinet') || lowerText.includes('centre') || lowerText.includes('clinique')) {
        return 'عيادة الطب العام';
      }
      return 'طبيب أخصائي في الطب العام';
    }
    // Cardiologist / Cardiology
    if (lowerText.includes('cardio')) {
      return 'أخصائي في أمراض القلب والشرايين';
    }
    // Pediatrician / Pediatrics
    if (lowerText.includes('pédiat') || lowerText.includes('pediat')) {
      return 'أخصائي في طب الأطفال والرضع';
    }
    // Gynecologist / Gynecology
    if (lowerText.includes('gynéco') || lowerText.includes('gyneco')) {
      return 'أخصائي في أمراض النساء والتوليد وعلاج العقم';
    }
    // Dermatologist / Dermatology
    if (lowerText.includes('derm')) {
      return 'أخصائي في أمراض الجلد والجلدية والتجميل';
    }
    // Ophthalmologist / Ophthalmology / Eyes
    if (lowerText.includes('ophtal')) {
      return 'أخصائي في طب وجراحة العيون';
    }
    // Orthopedist / Orthopedic Surgery
    if (lowerText.includes('orthop')) {
      return 'أخصائي في جراحة العظام والمفاصل والعمود الفقري';
    }
    // Neurologist / Neurology
    if (lowerText.includes('neuro')) {
      return 'أخصائي في أمراض الدماغ والأعصاب';
    }
    // Psychiatrist / Psychiatry
    if (lowerText.includes('psych')) {
      return 'أخصائي في الأمراض النفسية والعصبية والعقلية';
    }
    // Urologist / Urology / Renal Urology
    if (lowerText.includes('uro')) {
      return 'أخصائي في جراحة الكلى والمسالك البولية والتناسلية';
    }
    // ORL / ENT
    if (lowerText.includes('orl') || lowerText.includes('oto-rhino')) {
      return 'أخصائي في جراحة الأذن والأنف والحنجرة';
    }
    // Gastro / Gastroenterology
    if (lowerText.includes('gastro')) {
      return 'أخصائي في أمراض الجهاز الهضمي والكبد';
    }
    // Endocrinologist / Diabetes / Endocrinology
    if (lowerText.includes('endocrino') || lowerText.includes('diabét') || lowerText.includes('diabet')) {
      return 'أخصائي في أمراض الغدد الصماء والسكري';
    }
    // Rheumatologist / Rheumatology
    if (lowerText.includes('rhumato')) {
      return 'أخصائي في أمراض المفاصل والروماتيزم';
    }
    // Nephrologist / Nephrology
    if (lowerText.includes('néphro') || lowerText.includes('nephro')) {
      return 'أخصائي في أمراض وغسيل الكلى';
    }
    // Pneumologist / Pulmonology
    if (lowerText.includes('pneumo')) {
      return 'أخصائي في أمراض الجهاز التنفسي والربو والحساسية';
    }
    // Radiologist / Radiology
    if (lowerText.includes('radio')) {
      return 'أخصائي في الفحص بالأشعة والسونار والرنين المغناطيسي';
    }
    // Surgeon / General Surgery
    if (lowerText.includes('chirurg')) {
      return 'طبيب جراح أخصائي في الجراحة العامة والمنظار';
    }
    // Nutritionist / Dietetics
    if (lowerText.includes('nutri')) {
      return 'أخصائي في التغذية الطبية والحمية العلاجية';
    }
    // Oncologist / Cancer
    if (lowerText.includes('onco')) {
      return 'أخصائي في علاج الأورام وأمراض السرطان';
    }
    // Anesthesiologist / Intensive Care
    if (lowerText.includes('anesth')) {
      return 'أخصائي في التخدير والإنعاش وإدارة الألم';
    }
  }

  // Global clinical terms (like "dossier", "dossier patient")
  if (lowerText.includes('dossier')) {
    if (lowerText.includes('patient')) {
      return 'ملف المريض الطبي';
    }
    if (lowerText.includes('médical') || lowerText.includes('medical')) {
      return 'الملف الطبي الكامل';
    }
    return 'الملف الطبي';
  }
  
  // 1. Direct dictionary matches (mainly for specialties and cities)
  if (type === 'speciality' && SPECIALITIES[lowerText]) {
    return SPECIALITIES[lowerText];
  }
  if (type === 'cabinet' && SPECIALITIES[lowerText]) {
    return SPECIALITIES[lowerText];
  }
  if (CITIES[lowerText]) {
    return CITIES[lowerText];
  }
  
  // 2. Tokenize and translate word-by-word
  const tokens = cleanText.split(/(\s+|,|\.|\/|-|—|:)/);
  const translatedTokens = tokens.map(token => {
    const trimmed = token.trim();
    if (!trimmed) return token;
    
    // If it's punctuation or a number, keep as is
    if (/^[\s+,\.\/\-—:]+$/.test(trimmed) || /^[0-9]+$/.test(trimmed)) {
      return token;
    }
    
    const lowerToken = trimmed.toLowerCase();
    
    // Check Dictionaries
    if (CITIES[lowerToken]) return CITIES[lowerToken];
    if (SPECIALITIES[lowerToken]) return SPECIALITIES[lowerToken];
    if (ADDRESS_WORDS[lowerToken]) return ADDRESS_WORDS[lowerToken];
    if (NAMES[lowerToken]) return NAMES[lowerToken];
    
    // For words like "de", "du", "d'", "l'"
    if (lowerToken === 'de' || lowerToken === 'du') return 'ـ';
    if (lowerToken === 'la' || lowerToken === 'le') return 'ال';
    
    // Transliterate phonetically as fallback
    return transliterateWord(trimmed);
  });
  
  // Join back and clean extra spaces or weird punctuation
  let joined = translatedTokens.join('')
    .replace(/\s+/g, ' ')
    .replace(/\s+,\s*/g, '، ')
    .replace(/,\s*/g, '، ')
    .replace(/\s+-\s*/g, ' - ')
    .trim();
    
  return joined;
}
