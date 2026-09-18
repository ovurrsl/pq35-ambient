/**
 * Dört köşe, sabit sırayla. Scirocco 3 kapılıdır; "arka kapı" terimi kullanılmaz,
 * arka köşeler arka yan panellerin altındadır (CLAUDE.md §4).
 */
export const KOSE_IDS = ['onSol', 'onSag', 'arkaSol', 'arkaSag'] as const;
export type KoseId = (typeof KOSE_IDS)[number];

export const KOSE_ADLARI: Readonly<Record<KoseId, string>> = {
  onSol: 'Ön sol',
  onSag: 'Ön sağ',
  arkaSol: 'Arka sol',
  arkaSag: 'Arka sağ',
};

/** Hava sisteminin mavi kimlik rengi — bilgi taşıdığı yerde kullanılır. */
export const HAVA_RENGI = '#6FA0FF';
