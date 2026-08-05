import fs from 'fs';
import { chiangDaoProperties } from './chiangDao.js';

let sql = `-- Seed script for all 34 Chiang Dao Verified Homestays in Supabase

DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Get the admin or first profile id to set as owner_id
  SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM public.profiles LIMIT 1;
  END IF;

  IF v_admin_id IS NULL THEN
    -- Fallback dummy uuid if no profile exists yet
    v_admin_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  INSERT INTO public.properties (
    name, type, rating, reviews, price_per_night, currency,
    image_url, is_verified, features, amenities, location, province, district,
    description, check_in, check_out, host_info, contact, owner_id, status
  ) VALUES
`;

const rows = chiangDaoProperties.map((p, idx) => {
  const name = p.name.replace(/'/g, "''");
  const type = (p.type || 'Homestay').replace(/'/g, "''");
  const rating = p.rating || 4.8;
  const reviews = p.reviews || 100;
  const price = p.pricePerNight || 800;
  const img = p.imageUrl;
  const featuresArr = (p.features || []).map(f => `'${f.replace(/'/g, "''")}'`).join(', ');
  const location = (p.location || 'Chiang Dao, Chiang Mai').replace(/'/g, "''");
  const province = (p.province || 'เชียงใหม่').replace(/'/g, "''");
  const district = (p.district || 'เชียงดาว').replace(/'/g, "''");
  const description = `${p.nameTh || p.name} โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง`.replace(/'/g, "''");
  const hostName = (p.host?.name || '').replace(/'/g, "''");
  const hostSince = (p.host?.since || '2020').replace(/'/g, "''");
  
  const phone = (p.contact?.phone || '').replace(/'/g, "''");
  const phonesArr = (p.contact?.phones || []).map(ph => `'${ph.replace(/'/g, "''")}'`).join(', ');
  const fb = (p.contact?.facebookPage || '').replace(/'/g, "''");
  const bank = (p.contact?.bankAccount?.bank || '').replace(/'/g, "''");
  const accNum = (p.contact?.bankAccount?.accountNumber || '').replace(/'/g, "''");
  const accName = (p.contact?.bankAccount?.accountName || '').replace(/'/g, "''");

  return `  (
    '${name}', '${type}', ${rating}, ${reviews}, ${price}, 'THB',
    '${img}', true,
    ARRAY[${featuresArr}],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    '${location}', '${province}', '${district}',
    '${description}', '14:00', '11:00',
    jsonb_build_object('name', '${hostName}', 'since', '${hostSince}'),
    jsonb_build_object('phone', '${phone}', 'phones', ARRAY[${phonesArr}], 'facebook', '${fb}', 'bank', '${bank}', 'accountNumber', '${accNum}', 'accountName', '${accName}'),
    v_admin_id, 'published'
  )`;
});

sql += rows.join(',\n') + ';\n\nEND $$;\n';

fs.writeFileSync('../supabase/seed_chiangdao.sql', sql, 'utf8');
console.log('Successfully generated supabase/seed_chiangdao.sql with', chiangDaoProperties.length, 'homestays!');
