-- Seed script for Chiang Dao Verified Homestays in Supabase

DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Get the admin or first profile id to set as owner_id
  SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM public.profiles LIMIT 1;
  END IF;

  -- If no profile exists, create a default placeholder admin profile
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Please ensure at least one user profile exists in profiles table before seeding properties.';
  END IF;

  -- 1. บ้านระเบียงดาว
  INSERT INTO public.properties (
    name, type, rating, reviews, price_per_night, currency,
    image_url, is_verified, features, amenities, location, province, district,
    description, check_in, check_out, host_info, contact, owner_id, status
  ) VALUES (
    'บ้านระเบียงดาว (Baan Rabiang Dao)', 'Homestay', 4.9, 320, 800, 'THB',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Doi Luang View', 'Breakfast Included', 'Private Balcony', 'Real Owner Verified'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower', 'Parking'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'โฮมสเตย์ยอดนิยมวิวหน้าดอยหลวงเชียงดาว สัมผัสทะเลหมอกยามเช้าและระเบียงชมดาวแบบส่วนตัว',
    '14:00', '11:00',
    jsonb_build_object('name', 'นางสาว อรัญญา แซ่ล้อ', 'since', '2019'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275', '061-056-6617', '093-225-1344', '086-084-1195'], 'facebook', 'บ้านระเบียงดาว', 'bank', 'ไทยพาณิชย์', 'accountNumber', '093-2-25134-4', 'accountName', 'นางสาว อรัญญา แซ่ล้อ'),
    v_admin_id, 'published'
  );

  -- 2. บ้านไอดินโฮมสเตย์เชียงดาว
  INSERT INTO public.properties (
    name, type, rating, reviews, price_per_night, currency,
    image_url, is_verified, features, amenities, location, province, district,
    description, check_in, check_out, host_info, contact, owner_id, status
  ) VALUES (
    'บ้านไอดินโฮมสเตย์เชียงดาว (Baan Ai Din)', 'Homestay', 4.8, 195, 750, 'THB',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Mountain Mist View', 'Local Food', 'Real Owner Verified'],
    ARRAY['Breakfast', 'Mountain View', 'Parking', 'Fan'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านพักโฮมสเตย์ท่ามกลางไอหมอกและอากาศบริสุทธิ์ อาหารพื้นบ้านรสชาติดั้งเดิม',
    '14:00', '11:00',
    jsonb_build_object('name', 'นายสมัชชา เลาหมี่', 'since', '2020'),
    jsonb_build_object('phone', '064-756-2462', 'phones', ARRAY['064-756-2462', '095-115-6458'], 'facebook', 'บ้านไอดินโฮมสเตย์เชียงดาว', 'bank', 'กรุงไทย', 'accountNumber', '516-076-409-7', 'accountName', 'นายสมัชชา เลาหมี่'),
    v_admin_id, 'published'
  );

  -- 3. บ้านลีซูโฮมสเตย์
  INSERT INTO public.properties (
    name, type, rating, reviews, price_per_night, currency,
    image_url, is_verified, features, amenities, location, province, district,
    description, check_in, check_out, host_info, contact, owner_id, status
  ) VALUES (
    'บ้านลีซูโฮมสเตย์ (Baan Lisu Homestay)', 'Homestay', 4.7, 210, 800, 'THB',
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Lisu Cultural Experience', 'Doi Luang View', 'Authentic Food'],
    ARRAY['Breakfast', 'Mountain View', 'Campfire', 'Local Guides'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'สัมผัสวิถีชีวิตชนเผ่าลีซู ชมวิวเทือกเขาดอยหลวงแบบพาโนรามา',
    '14:00', '11:00',
    jsonb_build_object('name', 'นายสรชัย เลายี่ป่า / นาย อาทิตย์ นิติกรโภคา', 'since', '2019'),
    jsonb_build_object('phone', '081-103-2404', 'phones', ARRAY['081-103-2404', '098-981-8824', '062-223-7263'], 'facebook', 'บ้านลีซูโฮมสเตย์', 'bank', 'ไทยพาณิชย์', 'accountNumber', '153-8-02328-7', 'accountName', 'นายสรชัย เลายี่ป่า / นาย อาทิตย์ นิติกรโภคา'),
    v_admin_id, 'published'
  );

  -- 4. บ้านไอจ๋อด
  INSERT INTO public.properties (
    name, type, rating, reviews, price_per_night, currency,
    image_url, is_verified, features, amenities, location, province, district,
    description, check_in, check_out, host_info, contact, owner_id, status
  ) VALUES (
    'บ้านไอจ๋อด (Baan Ai Jod)', 'Homestay', 4.8, 142, 700, 'THB',
    'https://images.unsplash.com/photo-1540202404-b711c0791486?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Scenic Viewpoint', 'Traditional Wooden House', 'Campfire'],
    ARRAY['Breakfast', 'Balcony', 'Hot Shower', 'Parking'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านไม้เรียบง่าย วิวดอยหลวงเชียงดาวสุดสายตา ลานก่อกองไฟยามค่ำคืน',
    '14:00', '11:00',
    jsonb_build_object('name', 'นายสุรพล เลาหมี่', 'since', '2021'),
    jsonb_build_object('phone', '063-157-1983', 'phones', ARRAY['063-157-1983'], 'facebook', 'บ้านไอจ๋อด', 'bank', 'กรุงไทย', 'accountNumber', '516-068-152-3', 'accountName', 'นายสุรพล เลาหมี่'),
    v_admin_id, 'published'
  );

  -- 5. ปาย ปาย ดอยหลวงเชียงดาว
  INSERT INTO public.properties (
    name, type, rating, reviews, price_per_night, currency,
    image_url, is_verified, features, amenities, location, province, district,
    description, check_in, check_out, host_info, contact, owner_id, status
  ) VALUES (
    'ปาย ปาย ดอยหลวงเชียงดาว (Pai Pai Doi Luang)', 'Homestay', 4.8, 165, 850, 'THB',
    'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Panoramic View', 'Sunset Spot', 'Breakfast Included'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Private Deck'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'จุดชมวิวพระอาทิตย์ตกดินที่สวยที่สุดแห่งหนึ่งในเชียงดาว',
    '14:00', '11:00',
    jsonb_build_object('name', 'นายวีรศักดิ์ มีศรี', 'since', '2020'),
    jsonb_build_object('phone', '089-951-7125', 'phones', ARRAY['089-951-7125', '081-934-9751'], 'facebook', 'ปาย ปาย ดอยหลวงเชียงดาว', 'bank', 'ไทยพาณิชย์', 'accountNumber', '383-2-09710-8', 'accountName', 'นายวีรศักดิ์ มีศรี'),
    v_admin_id, 'published'
  );

  -- 6. ดอยเคียงดาวโฮมสเตย์
  INSERT INTO public.properties (
    name, type, rating, reviews, price_per_night, currency,
    image_url, is_verified, features, amenities, location, province, district,
    description, check_in, check_out, host_info, contact, owner_id, status
  ) VALUES (
    'ดอยเคียงดาวโฮมสเตย์ (Doi Khiang Dao)', 'Homestay', 4.9, 215, 850, 'THB',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Close View of Doi Luang', 'Private Terrace', 'Home Cooked Meals'],
    ARRAY['Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ใกล้ชิดธรรมชาติและหน้าผาดอยหลวงเพียงเอื้อมมือ ระเบียงชมหมอกส่วนตัว',
    '14:00', '11:00',
    jsonb_build_object('name', 'นางสาว ชุติภา เลาหมู่ / นาย อะเลผะ ยีป่า', 'since', '2019'),
    jsonb_build_object('phone', '081-387-9311', 'phones', ARRAY['081-387-9311'], 'facebook', 'ดอยเคียงดาวโฮมสเตย์ดอยหลวงเชียงดาว', 'bank', 'กรุงไทย', 'accountNumber', '516-040061-3', 'accountName', 'นางสาว ชุติภา เลาหมู่ / นาย อะเลผะ ยีป่า'),
    v_admin_id, 'published'
  );

  -- 7. บ้านดอยนับดาว
  INSERT INTO public.properties (
    name, type, rating, reviews, price_per_night, currency,
    image_url, is_verified, features, amenities, location, province, district,
    description, check_in, check_out, host_info, contact, owner_id, status
  ) VALUES (
    'บ้านดอยนับดาว (Baan Doi Nab Dao)', 'Homestay', 4.8, 175, 800, 'THB',
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Milky Way Stargazing', 'Doi Luang Front View', 'Thai BBQ / Mookata'],
    ARRAY['Breakfast', 'Mookata Set', 'Stargazing Deck', 'Parking'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'นอนนับดาวกลางขุนเขา หมูกระทะร้อนๆ ยามเย็นท่ามกลางอากาศหนาว',
    '14:00', '11:00',
    jsonb_build_object('name', 'นางกรกช เลาหมี่', 'since', '2020'),
    jsonb_build_object('phone', '088-410-7251', 'phones', ARRAY['088-410-7251', '062-120-9464'], 'facebook', 'บ้านดอยนับดาวดอยหลวงเชียงดาว', 'bank', 'กรุงไทย', 'accountNumber', '516-050970-4', 'accountName', 'นางกรกช เลาหมี่'),
    v_admin_id, 'published'
  );

  -- 8. ภูเพียงดาวโฮมสเตย์
  INSERT INTO public.properties (
    name, type, rating, reviews, price_per_night, currency,
    image_url, is_verified, features, amenities, location, province, district,
    description, check_in, check_out, host_info, contact, owner_id, status
  ) VALUES (
    'ภูเพียงดาวโฮมสเตย์ (Phu Phiang Dao)', 'Homestay', 4.9, 180, 900, 'THB',
    'https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['High Altitude Viewpoint', 'Stargazing Platform', 'Northern Drip Coffee'],
    ARRAY['Wi-Fi', 'Breakfast', 'Drip Coffee', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ดริปกาแฟยามเช้าพร้อมทะเลหมอก จุดชมวิวดอยหลวงมุมสูงแบบ 180 องศา',
    '14:00', '11:00',
    jsonb_build_object('name', 'นางสาวสุนิสา เลายี่ป่า', 'since', '2019'),
    jsonb_build_object('phone', '092-761-1606', 'phones', ARRAY['092-761-1606'], 'facebook', 'ภูเพียงดาวโฮมสเตย์ดอยหลวงเชียงดาว', 'bank', 'กรุงไทย', 'accountNumber', '516-1-41416-2', 'accountName', 'นางสาวสุนิสา เลายี่ป่า'),
    v_admin_id, 'published'
  );

  -- 9. บ้านฮักเฮือนสุข
  INSERT INTO public.properties (
    name, type, rating, reviews, price_per_night, currency,
    image_url, is_verified, features, amenities, location, province, district,
    description, check_in, check_out, host_info, contact, owner_id, status
  ) VALUES (
    'บ้านฮักเฮือนสุข (Baan Hug Huen Suk)', 'Homestay', 4.9, 160, 850, 'THB',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Warm & Cozy Feel', 'PromptPay Verified', 'Sunset Terrace'],
    ARRAY['Breakfast', 'Mountain View', 'Sunset Terrace', 'Hot Water'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านพักอบอุ่นสไตล์ชุมชน การต้อนรับเป็นกันเอง วิวทิวเขางดงาม',
    '14:00', '11:00',
    jsonb_build_object('name', 'นางสาวอาทิตยา เลายี่ป่า', 'since', '2021'),
    jsonb_build_object('phone', '061-598-9397', 'phones', ARRAY['061-598-9397'], 'facebook', 'บ้านฮักเฮือนสุข', 'bank', 'พร้อมเพย์', 'accountNumber', '061-598-9397', 'accountName', 'นางสาวอาทิตยา เลายี่ป่า'),
    v_admin_id, 'published'
  );

END $$;
