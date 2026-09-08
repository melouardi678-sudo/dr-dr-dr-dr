import { UltrasoundTemplate, UltrasoundReport, UltrasoundType } from '../types';

export const DEFAULT_ULTRASOUND_TEMPLATES: UltrasoundTemplate[] = [
  {
    id: 'tpl_us_abdominal',
    name: 'Échographie Abdominale Complète',
    examType: 'abdominal',
    examTypeName: 'Échographie Abdominale Complète',
    indication: 'Bilan de douleurs abdominales / Bilan hépatique perturbé',
    equipment: 'Échographe Haute Définition - Sonde convexe multifréquence 3.5 MHz',
    findings: `FOIE :
De taille normale (flèche hépatique mesurée à 135 mm), contours réguliers, échostructure parenchymateuse homogène sans lésion focale kystique ou tissulaire décelable.

VOIES BILIAIRES & VÉSICULE :
Vésicule biliaire bien visualisée, à parois fines et régulières (< 3 mm), alithiasique, sans signe de Murphy échographique.
Absence de dilatation des voies biliaires intra-hépatiques et de la voie biliaire principale (VBP mesurée à 4 mm).

PANCRÉAS :
Bien visualisé dans sa totalité, d'échogénicité et de morphologie normales, sans masse focalisée ni dilatation du canal de Wirsung.

RATE :
Homogène, de taille normale (grand axe < 110 mm), sans splénomégalie ni anomalie parenchymateuse.

REINS :
Reins droit et gauche en place, de taille normale et de contours réguliers. Bonne différenciation cortico-médullaire. Absence de dilatation des cavités pyélocalicielles ni d'image lithiasique individualisable.

AORTE ABDOMINALE & PÉRITOINE :
Aorte abdominale de calibre régulier (< 20 mm).
Absence d'adénomégalie rétropéritonéale décelable.
Absence d'épanchement liquidien intra-péritonéal libre ou cloisonné.`,
    conclusion: `Examen échographique abdominal sans anomalie morphologique décelable ce jour.
- Foie homogène sans lésion focale
- Vésicule biliaire alithiasique et voies biliaires non dilatées
- Pancréas, rate et reins d'aspect échographique normal`,
    recommendations: 'Poursuite de la prise en charge clinique habituelle.',
    quickSnippets: [
      'Foie de taille et morphologie normales sans lésion focale',
      'Vésicule alithiasique à paroi fine sans signe de Murphy',
      'Voies biliaires non dilatées (VBP < 5mm)',
      'Pancréas homogène sans dilatation du canal de Wirsung',
      'Rate homogène de taille normale sans splénomégalie',
      'Absence d’épanchement liquidien intra-péritonéal',
      'Absence de calcul ni d’ectasie pyélocalicielle',
    ],
  },
  {
    id: 'tpl_us_pelvic',
    name: 'Échographie Pelvienne Gynécologique',
    examType: 'pelvic',
    examTypeName: 'Échographie Pelvienne & Gynécologique',
    indication: 'Métrorragies / Douleurs pelviennes / Bilan gynécologique',
    equipment: 'Sonde sus-pubienne convexe 3.5 MHz & sonde endocavitaire 6.5 MHz',
    findings: `UTÉRUS :
En antéversion, de morphologie et de volume normaux (mesuré à 75 x 42 x 38 mm).
Myomètre d'échostructure régulière et homogène, sans formation myomateuse visible.

ENDOMÈTRE :
Régulier, bien centré, d'épaisseur physiologique adaptée à la phase du cycle (mesuré à 7.2 mm). Cavité utérine libre et bien coaptée.

OVAIRE DROIT :
De situation et morphologie normales (mesuré à 29 x 18 mm), présentant une répartition folliculaire physiologique sans formation kystique anormale.

OVAIRE GAUCHE :
De morphologie et taille normales (mesuré à 27 x 17 mm), sans masse solide ou kystique suspecte.

CUL-DE-SAC DE DOUGLAS :
Libre, absence d'épanchement liquidien péritonéal ou d'anomalie des culs-de-sac.`,
    conclusion: `Échographie pelvienne sans anomalie décelable.
- Utérus de taille normale, myomètre homogène sans myome
- Endomètre fin et régulier
- Ovaires d'aspect fonctionnel sans lésion kystique
- Absence d'épanchement du Douglas`,
    recommendations: 'Contrôle gynécologique de routine.',
    quickSnippets: [
      'Utérus en antéversion de morphologie et volume normaux',
      'Myomètre homogène sans lésion myomateuse décelable',
      'Endomètre régulier et homogène adapté au cycle',
      'Ovaires de taille normale porteurs de follicules physiologiques',
      'Cul-de-sac de Douglas libre sans épanchement',
      'Stérilet (DIU) en place bien centré dans la cavité utérine',
    ],
  },
  {
    id: 'tpl_us_obstetric_t1',
    name: 'Échographie Obstétricale T1 (Datation)',
    examType: 'obstetric',
    examTypeName: 'Échographie Obstétricale T1 (Datation & Morphologie Précoce)',
    indication: 'Datation et évaluation de la vitalité fœtale au 1er trimestre',
    equipment: 'Échographe Doppler - Sonde convexe 3.5 MHz',
    findings: `SAC GESTATIONNEL :
Intra-utérin, unique, bien tonique et implanté au fond utérin.

EMBRYON / FŒTUS :
- Nombre : Grossesse mono-fœtale évolutive.
- Activité cardiaque fœtale : Présente et régulière, enregistrée à 156 bpm.
- Mouvements embryonnaires / fœtaux : Présents et spontanés.

BIOMÉTRIE T1 :
- Longueur Cranio-Caudale (LCC) : conforme pour l'âge gestationnel.
- Clarté nucale (CN) : mesurée fine à 1.2 mm (normale < 3 mm).
- Diamètre Bipariétal (BIP) : concordant.

ANNEXES & UTERUS :
- Vésicule vitelline visualisée de taille et morphologie normales.
- Trophoblaste / futur placenta d'insertion normale, sans décollement.
- Myomètre utérin sans anomalie, ovaires visualisés sans kyste pathologique.`,
    conclusion: `Grossesse intra-utérine mono-fœtale évolutive de terme concordant avec la date des dernières règles.
- Vitalité fœtale satisfaisante (ACF +).
- Clarté nucale fine et dans les limites de la normale.`,
    recommendations: 'Programmer l’échographie morphologique du 2ème trimestre entre 22 et 24 SA.',
    quickSnippets: [
      'Grossesse intra-utérine mono-fœtale évolutive',
      'Activité cardiaque fœtale positive et régulière (> 140 bpm)',
      'Mouvements actifs spontanés bien visualisés',
      'Clarté nucale fine et physiologique (< 2 mm)',
      'Absence d’hématome péri-ovulaire ou de décollement trophoblastique',
    ],
  },
  {
    id: 'tpl_us_obstetric_t2',
    name: 'Échographie Obstétricale T2 (Morphologique)',
    examType: 'obstetric',
    examTypeName: 'Échographie Obstétricale T2 (Morphologie & Biométrie)',
    indication: 'Échographie morphologique de dépistage du 2ème trimestre (22 SA)',
    equipment: 'Échographe Haute Définition - Sonde convexe multifréquence 3.5 - 5 MHz',
    findings: `VITALITÉ FŒTALE :
Fœtus unique, en présentation céphalique. Activité cardiaque fœtale régulière à 145 bpm. Mouvements fœtaux actifs bien perçus.

BIOMÉTRIE FŒTALE :
- Diamètre Bipariétal (BIP) : dans la moyenne du terme (50e percentile).
- Périmètre Crânien (PC) : concordant.
- Diamètre Abdominal Transverse (DAT) / Périmètre Abdominal (PA) : régulier.
- Longueur Fémorale (LF) : harmonieuse.
- Estimation du Poids Fœtal (EPF) : au 50ème percentile.

EXAMEN MORPHOLOGIQUE DÉTAILLÉ :
- Pôle céphalique : Boîte crânienne ovale et continue, ligne médiane centrée, carrefours ventriculaires fins, cervelet et fosse postérieure normaux.
- Massif facial : Profil fœtal régulier avec os propre du nez présent, intégrité de la lèvre supérieure sans fente labiale décelable.
- Thorax & Cœur : Coupe 4 cavités équilibrée, croisement régulier des gros vaisseaux, rythme régulier.
- Abdomen : Estomac en place à gauche, vessie visualisée en position pelvienne, paroi abdominale antérieure intègre.
- Reins & Rachis : Deux reins en place sans hydronéphrose, rachis continu et régulier sur toute sa hauteur.
- Membres : 4 membres visualisés à 3 segments avec mobilité physiologique des mains et pieds.

ANNEXES :
- Placenta : Inséré à la face postérieure, haut situé, non prævia, grade I de maturation.
- Liquide amniotique : En quantité normale (plus grande citerne à 48 mm).
- Cordon ombilical : Visualisation de 3 vaisseaux (2 artères, 1 veine).`,
    conclusion: `Grossesse fœtale unique évolutive de terme concordant.
- Biométrie fœtale harmonieuse au 50ème percentile.
- Examen morphologique fœtal satisfaisant sans anomalie décelable.
- Placenta haut inséré, liquide amniotique en quantité normale.`,
    recommendations: 'Poursuite de la surveillance obstétricale habituelle. Échographie T3 prévue vers 32 SA.',
    quickSnippets: [
      'Activité cardiaque fœtale régulière et mouvements fœtaux amples',
      'Biométrie fœtale harmonieuse concordante avec le terme',
      'Étude morphologique fœtale complète sans anomalie décelable',
      'Coupe des 4 cavités cardiaques normale et gros vaisseaux réguliers',
      'Placenta haut inséré, non prævia',
      'Quantité de liquide amniotique normale',
    ],
  },
  {
    id: 'tpl_us_thyroid',
    name: 'Échographie Thyroïdienne',
    examType: 'thyroid',
    examTypeName: 'Échographie Thyroïdienne & Cervicale',
    indication: 'Bilan de nodule palpable / Dysthyroïdie / Contrôle',
    equipment: 'Sonde linéaire haute fréquence 7.5 - 12 MHz',
    findings: `LOBE DROIT :
Mesuré à 46 x 17 x 15 mm. Parenchyme d'échostructure glandulaire homogène, isoéchogène, sans nodule solide ni kystique individualisable.

LOBE GAUCHE :
Mesuré à 44 x 16 x 14 mm. Parenchyme d'échogénicité normale et symétrique, contours réguliers sans anomalie focale.

ISTHME THYROÏDIEN :
Fin et régulier, d'épaisseur normale mesurée à 2.8 mm.

ÉTUDE DOPPLER COULEUR :
Vascularisation glandulaire symétrique et homogène, sans hyperémie diffuse (absence de "thyroid inferno").

AIRES GANGLIONNAIRES CERVICALES :
Absence d'adénopathie jugulo-carotidienne ou sus-claviculaire suspecte décelable bilatéralement.`,
    conclusion: `Glande thyroïde de volume et morphologie normaux.
- Parenchyme thyroïdien homogène sans nodule individualisable (EU-TIRADS 1).
- Absence d'hypervascularisation Doppler ni d'adénopathie cervicale suspecte.`,
    recommendations: 'Surveillance biologique habituelle.',
    quickSnippets: [
      'Lobe droit et lobe gauche de taille et volume normaux',
      'Parenchyme thyroïdien homogène et normo-échogène',
      'Isthme thyroïdien fin d’épaisseur normale (< 3 mm)',
      'Absence de nodule thyroïdien individualisable (EU-TIRADS 1)',
      'Absence d’hypervascularisation au Doppler couleur',
      'Aires ganglionnaires cervicales libres',
    ],
  },
  {
    id: 'tpl_us_renal',
    name: 'Échographie Rénale & Vésico-Prostatique',
    examType: 'renal_urinary',
    examTypeName: 'Échographie de l’Appareil Urinaire (Reins & Vessie)',
    indication: 'Bilan de colique néphrétique / Hématurie / Troubles mictionnels',
    equipment: 'Sonde convexe 3.5 MHz',
    findings: `REIN DROIT :
De situation et taille normales (mesuré à 112 x 46 mm), contours réguliers. Épaisseur corticale normale (16 mm) avec bonne différenciation cortico-médullaire. Absence de dilatation des cavités pyélocalicielles ni d'obstacle lithiasique visible.

REIN GAUCHE :
De morphologie et situation normales (mesuré à 116 x 48 mm), bonne différenciation cortico-médullaire. Absence d'ectasie cavitaire ni d'image de lithiase.

VESSIE :
En réplétion satisfaisante, à parois fines et régulières (< 3 mm). Contenu anéchogène homogène sans image de calcul endo-vésical ni lésion végétante pariétale.

RÉSIDU POST-MICTIONNEL :
Évalué après miction : vidange vésicale satisfaisante avec résidu post-mictionnel nul ou non significatif (< 15 ml).`,
    conclusion: `Appareil urinaire sans anomalie échographique décelable ce jour.
- Reins de taille normale, sans lithiase ni dilatation pyélocalicielle
- Vessie saine à parois fines
- Vidange vésicale complète sans résidu significatif`,
    recommendations: 'Poursuite de l’hydratation abondante.',
    quickSnippets: [
      'Reins de dimensions et situation normales, contours réguliers',
      'Bonne différenciation cortico-médullaire bilatérale',
      'Absence de dilatation des cavités pyélocalicielles',
      'Absence d’image lithiasique ou de lésion suspecte',
      'Vessie à parois fines et régulières sans lésion pariétale',
      'Résidu post-mictionnel non significatif (< 20 ml)',
    ],
  },
  {
    id: 'tpl_us_breast',
    name: 'Échographie Mammaire / Sénologique',
    examType: 'breast',
    examTypeName: 'Échographie Mammaire Bilatérale',
    indication: 'Bilan sénologique de dépistage / Mastodynies',
    equipment: 'Sonde linéaire haute résolution 10 - 14 MHz',
    findings: `SEIN DROIT :
Parenchyme glandulaire d'échostructure homogène, sans anomalie architecturale. Absence de formation nodulaire solide ou kystique individualisable. Tissu adipeux sous-cutané et rétromammaire réguliers.

SEIN GAUCHE :
Échostructure symétrique, parenchyme d'aspect normal sans masse décelable, sans atténuation acoustique postérieure suspecte.

AIRES GANGLIONNAIRES AXILLAIRES :
Absence d'adénopathie axillaire suspecte bilatérale (présence de ganglions physiologiques d'allure bénigne avec hile graisseux conservé).`,
    conclusion: `Échographie mammaire bilatérale normale.
- Absence d'anomalie focale, de kyste ou de masse solide décelable.
- Classification ACR / BI-RADS : Score ACR 1 (Examen normal).`,
    recommendations: 'Poursuite du suivi sénologique régulier.',
    quickSnippets: [
      'Tissu fibro-glandulaire d’échostructure normale et symétrique',
      'Absence d’anomalie focale, masse ou distorsion architecturale',
      'Absence de lésion kystique ou solide individualisable',
      'Aires ganglionnaires axillaires libres sans adénopathie suspecte',
      'Classification ACR BI-RADS 1 : Examen normal',
    ],
  },
];

const ULTRASOUND_REPORTS_STORAGE_KEY = 'medicab_ultrasound_reports_v1';
const ULTRASOUND_TEMPLATES_STORAGE_KEY = 'medicab_ultrasound_templates_v1';

export function getStoredUltrasoundTemplates(): UltrasoundTemplate[] {
  try {
    const raw = localStorage.getItem(ULTRASOUND_TEMPLATES_STORAGE_KEY);
    if (!raw) return DEFAULT_ULTRASOUND_TEMPLATES;
    const customList: UltrasoundTemplate[] = JSON.parse(raw);
    const existingIds = new Set(customList.map((t) => t.id));
    const merged = [...customList];
    for (const def of DEFAULT_ULTRASOUND_TEMPLATES) {
      if (!existingIds.has(def.id)) {
        merged.push(def);
      }
    }
    return merged;
  } catch {
    return DEFAULT_ULTRASOUND_TEMPLATES;
  }
}

export function saveStoredUltrasoundTemplates(templates: UltrasoundTemplate[]): void {
  try {
    localStorage.setItem(ULTRASOUND_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('Error saving ultrasound templates:', e);
  }
}

export function getStoredUltrasoundReports(): UltrasoundReport[] {
  try {
    const raw = localStorage.getItem(ULTRASOUND_REPORTS_STORAGE_KEY);
    if (!raw) {
      // Return a sample report for demo if available
      return [
        {
          id: 'us_sample_1',
          patientId: 'pat_1',
          patientName: 'EL Amrani Omar',
          patientAge: 42,
          patientGender: 'M',
          date: new Date().toISOString().split('T')[0],
          doctorName: 'Dr. Karim BENALI',
          examType: 'abdominal',
          examTypeName: 'Échographie Abdominale Complète',
          indication: 'Bilan de douleurs abdominales diffuses et dyspepsie',
          equipment: 'Sonde convexe multifréquence 3.5 MHz',
          findings: DEFAULT_ULTRASOUND_TEMPLATES[0].findings,
          conclusion: DEFAULT_ULTRASOUND_TEMPLATES[0].conclusion,
          recommendations: 'Contrôle clinique dans 1 mois si récidive.',
          templateUsed: 'Échographie Abdominale Complète',
          createdAt: new Date().toISOString(),
        },
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredUltrasoundReports(reports: UltrasoundReport[]): void {
  try {
    localStorage.setItem(ULTRASOUND_REPORTS_STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Error saving ultrasound reports:', e);
  }
}
