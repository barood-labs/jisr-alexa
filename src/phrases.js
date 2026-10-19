// Hand-checked survival phrasebook for Arabic-speaking newcomers (EN <-> AR), voice-friendly.
export const PHRASES = {
  sick_child: { en: 'My son is sick. He needs to see a doctor today.', ar: 'ابني مريض. يحتاج أن يرى طبيبًا اليوم.' },
  doctor: { en: 'I need to see a doctor. Is there a clinic nearby?', ar: 'أحتاج أن أرى طبيبًا. هل توجد عيادة قريبة؟' },
  pharmacy: { en: 'Where is the nearest pharmacy?', ar: 'أين أقرب صيدلية؟' },
  halal: { en: 'Is this halal? Does it contain pork or alcohol?', ar: 'هل هذا حلال؟ هل يحتوي على لحم خنزير أو كحول؟' },
  bus: { en: 'Does this bus go downtown? How much is the fare?', ar: 'هل تذهب هذه الحافلة إلى وسط المدينة؟ كم الأجرة؟' },
  school: { en: 'I want to register my child for school.', ar: 'أريد تسجيل طفلي في المدرسة.' },
  rent: { en: 'Is the apartment still available? Are utilities included?', ar: 'هل الشقة ما زالت متاحة؟ هل الفواتير مشمولة؟' },
  emergency: { en: 'Call 911. This is an emergency.', ar: 'اتصل بالرقم 911. هذه حالة طارئة.' },
  english: { en: 'Where can I take free English classes?', ar: 'أين يمكنني أخذ دروس إنجليزية مجانية؟' },
  job: { en: 'Are you hiring? I would like to apply.', ar: 'هل لديكم وظائف شاغرة؟ أود التقديم.' },
  thanks: { en: 'Thank you so much for your help.', ar: 'شكرًا جزيلًا على مساعدتك.' },
};
export function findPhrase(topic = '') {
  const t = topic.toLowerCase();
  const kid = /(son|daughter|child|kid|baby|ابني|ابنتي|بنتي|طفلي|ولدي)/.test(t) && /(sick|ill|fever|مريض|مريضة|حرارة)/.test(t);
  const key = (kid && 'sick_child') || Object.keys(PHRASES).find((k) => t.includes(k)) ||
    (/(sick|ill|hospital|مريض|طبيب)/.test(t) && 'doctor') || (/(medicine|دواء|صيدل)/.test(t) && 'pharmacy') ||
    (/(food|pork|حلال)/.test(t) && 'halal') || (/(apartment|house|شقة|ايجار)/.test(t) && 'rent') ||
    (/(work|hire|عمل|وظيف)/.test(t) && 'job') || (/(class|learn|انجليزي)/.test(t) && 'english') || null;
  return key ? { topic: key, ...PHRASES[key] } : null;
}
