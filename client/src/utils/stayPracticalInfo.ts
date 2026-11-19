export interface PracticalItem {
  key: 'access' | 'power' | 'signal' | 'meals';
  labelKey: string;
  valueKey: string;
  tone: 'easy' | 'note';
}

interface StayLike {
  name?: string;
  type?: string;
  location?: string;
  district?: string;
  description?: string;
  features?: string[];
  amenities?: string[];
}

/**
 * Derives honest, practical Chiang Dao "Know Before You Go" badges
 * based on village terrain, stay type, and listed amenities/features.
 */
export const getStayPracticalInfo = (stay: StayLike): PracticalItem[] => {
  const hay = [
    stay.name || '',
    stay.type || '',
    stay.location || '',
    stay.district || '',
    stay.description || '',
    ...(stay.features || []),
    ...(stay.amenities || []),
  ]
    .join(' ')
    .toLowerCase();

  const isNaLao = hay.includes('na lao') || hay.includes('นาเลา');
  const isMuangKong = hay.includes('muang kong') || hay.includes('เมืองคอง');
  const isMaeMae = hay.includes('mae mae') || hay.includes('แม่แมะ');
  const isHomestay = hay.includes('homestay') || hay.includes('โฮมสเตย์');
  const hasAC = hay.includes('a/c') || hay.includes('air conditioning') || hay.includes('แอร์');
  const hasBreakfast = hay.includes('breakfast') || hay.includes('อาหารเช้า');
  const hasDinner = hay.includes('dinner') || hay.includes('ขันโตก') || hay.includes('อาหารเย็น');

  // 1. Road access / Car type
  const access: PracticalItem =
    isNaLao || isMuangKong
      ? { key: 'access', labelKey: 'practical.accessLabel', valueKey: 'practical.accessHighClearance', tone: 'note' }
      : isMaeMae
        ? { key: 'access', labelKey: 'practical.accessLabel', valueKey: 'practical.accessSteepSedan', tone: 'note' }
        : { key: 'access', labelKey: 'practical.accessLabel', valueKey: 'practical.accessSedan', tone: 'easy' };

  // 2. Electricity / Power
  const power: PracticalItem =
    (isNaLao || isMuangKong) && isHomestay && !hasAC
      ? { key: 'power', labelKey: 'practical.powerLabel', valueKey: 'practical.powerSolar', tone: 'note' }
      : { key: 'power', labelKey: 'practical.powerLabel', valueKey: 'practical.powerGrid', tone: 'easy' };

  // 3. Mobile signal
  const signal: PracticalItem =
    isMuangKong || isMaeMae
      ? { key: 'signal', labelKey: 'practical.signalLabel', valueKey: 'practical.signalLimited', tone: 'note' }
      : { key: 'signal', labelKey: 'practical.signalLabel', valueKey: 'practical.signalFull', tone: 'easy' };

  // 4. Meals
  const meals: PracticalItem =
    hasBreakfast && hasDinner
      ? { key: 'meals', labelKey: 'practical.mealsLabel', valueKey: 'practical.mealsHalfBoard', tone: 'easy' }
      : hasBreakfast
        ? { key: 'meals', labelKey: 'practical.mealsLabel', valueKey: 'practical.mealsBreakfast', tone: 'easy' }
        : { key: 'meals', labelKey: 'practical.mealsLabel', valueKey: 'practical.mealsNearby', tone: 'easy' };

  return [access, power, signal, meals];
};
