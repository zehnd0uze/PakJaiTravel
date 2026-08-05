-- Seed script for all 34 Chiang Dao Verified Homestays in Supabase

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
  (
    'บ้านระเบียงดาว (Baan Rabiang Dao Homestay)', 'Homestay', 4.9, 320, 800, 'THB',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Doi Luang View', 'Breakfast Included', 'Private Balcony', 'Real Owner Verified'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านระเบียงดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางสาว อรัญญา แซ่ล้อ', 'since', '2019'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275', '061-056-6617', '093-225-1344', '086-084-1195'], 'facebook', 'บ้านระเบียงดาว', 'bank', 'ไทยพาณิชย์ (SCB)', 'accountNumber', '093-2-25134-4', 'accountName', 'นางสาว อรัญญา แซ่ล้อ'),
    v_admin_id, 'published'
  ),
  (
    'บ้านไอดินโฮมสเตย์เชียงดาว (Baan Ai Din Homestay)', 'Homestay', 4.8, 195, 750, 'THB',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Mountain Mist View', 'Local Food', 'Real Owner Verified'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านไอดินโฮมสเตย์เชียงดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายสมัชชา เลาหมี่', 'since', '2020'),
    jsonb_build_object('phone', '064-756-2462', 'phones', ARRAY['064-756-2462', '095-115-6458'], 'facebook', 'บ้านไอดินโฮมสเตย์เชียงดาว', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '516-076-409-7', 'accountName', 'นายสมัชชา เลาหมี่'),
    v_admin_id, 'published'
  ),
  (
    'บ้านลีซูโฮมสเตย์ (Baan Lisu Homestay)', 'Homestay', 4.7, 210, 800, 'THB',
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Lisu Cultural Experience', 'Doi Luang View', 'Authentic Food'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านลีซูโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายสรชัย เลายี่ป่า / นายอาทิตย์ นิติกรโภคา', 'since', '2019'),
    jsonb_build_object('phone', '081-103-2404', 'phones', ARRAY['081-103-2404', '098-981-8824', '062-223-7263'], 'facebook', 'บ้านลีซูโฮมสเตย์', 'bank', 'ไทยพาณิชย์ (SCB)', 'accountNumber', '153-8-02328-7', 'accountName', 'นายสรชัย เลายี่ป่า / นาย อาทิตย์ นิติกรโภคา'),
    v_admin_id, 'published'
  ),
  (
    'บ้านไอจ๋อด (Baan Ai Jod)', 'Homestay', 4.8, 142, 700, 'THB',
    'https://images.unsplash.com/photo-1540202404-b711c0791486?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Scenic Viewpoint', 'Traditional Wooden House', 'Campfire'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านไอจ๋อด โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายสุรพล เลาหมี่', 'since', '2021'),
    jsonb_build_object('phone', '063-157-1983', 'phones', ARRAY['063-157-1983'], 'facebook', 'บ้านไอจ๋อด', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '516-068-152-3', 'accountName', 'นายสุรพล เลาหมี่'),
    v_admin_id, 'published'
  ),
  (
    'ปาย ปาย ดอยหลวงเชียงดาว (Pai Pai Doi Luang Chiang Dao)', 'Homestay', 4.8, 165, 850, 'THB',
    'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Panoramic View', 'Sunset Spot', 'Breakfast Included'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ปาย ปาย ดอยหลวงเชียงดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายวีรศักดิ์ มีศรี', 'since', '2020'),
    jsonb_build_object('phone', '089-951-7125', 'phones', ARRAY['089-951-7125', '081-934-9751'], 'facebook', 'ปาย ปาย ดอยหลวงเชียงดาว', 'bank', 'ไทยพาณิชย์ (SCB)', 'accountNumber', '383-2-09710-8', 'accountName', 'นายวีรศักดิ์ มีศรี'),
    v_admin_id, 'published'
  ),
  (
    'บ้านหมอกแสงดาว (Baan Mok Saeng Dao)', 'Homestay', 4.6, 80, 700, 'THB',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Sea of Fog View', 'Quiet Nature', 'Authentic Local Host'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านหมอกแสงดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'จายสด', 'since', '2021'),
    jsonb_build_object('phone', '080-692-9230', 'phones', ARRAY['080-692-9230'], 'facebook', 'บ้านหมอกแสงดาว', 'bank', '', 'accountNumber', '', 'accountName', ''),
    v_admin_id, 'published'
  ),
  (
    'บ้านหมอกเชียงดาวโฮมสเตย์ (Baan Mok Chiang Dao)', 'Homestay', 4.8, 138, 800, 'THB',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Morning Mist', 'Stargazing Balcony', 'Local Breakfast'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านหมอกเชียงดาวโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางดลยา เลาจาง', 'since', '2020'),
    jsonb_build_object('phone', '065-270-2055', 'phones', ARRAY['065-270-2055'], 'facebook', 'บ้านหมอกเชียงดาวโฮมสเตย์', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '545-044083-9', 'accountName', 'นางดลยา เลาจาง'),
    v_admin_id, 'published'
  ),
  (
    'ดอยเคียงดาวโฮมสเตย์ (Doi Khiang Dao Homestay)', 'Homestay', 4.9, 215, 850, 'THB',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Close View of Doi Luang', 'Private Terrace', 'Home Cooked Meals'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ดอยเคียงดาวโฮมสเตย์ดอยหลวงเชียงดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางสาว ชุติภา เลาหมู่ / นาย อะเลผะ ยีป่า', 'since', '2019'),
    jsonb_build_object('phone', '081-387-9311', 'phones', ARRAY['081-387-9311'], 'facebook', 'ดอยเคียงดาวโฮมสเตย์ดอยหลวงเชียงดาว', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '516-040061-3', 'accountName', 'นางสาว ชุติภา เลาหมู่ / นาย อะเลผะ ยีป่า'),
    v_admin_id, 'published'
  ),
  (
    'บ้านดอยนับดาว (Baan Doi Nab Dao)', 'Homestay', 4.8, 175, 800, 'THB',
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Milky Way Stargazing', 'Doi Luang Front View', 'Thai BBQ / Mookata'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านดอยนับดาวดอยหลวงเชียงดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางกรกช เลาหมี่', 'since', '2020'),
    jsonb_build_object('phone', '088-410-7251', 'phones', ARRAY['088-410-7251', '062-120-9464'], 'facebook', 'บ้านดอยนับดาวดอยหลวงเชียงดาว', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '516-050970-4', 'accountName', 'นางกรกช เลาหมี่'),
    v_admin_id, 'published'
  ),
  (
    'บ้านภูตะวันโฮมสเตย์ (Baan Phu Tawan Homestay)', 'Homestay', 4.7, 140, 750, 'THB',
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Sunrise Panorama', 'Coffee Farm Tour', 'Authentic Huts'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านภูตะวันโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'มินตรา ศรีชานนท์', 'since', '2021'),
    jsonb_build_object('phone', '095-425-1388', 'phones', ARRAY['095-425-1388', '098-823-8213'], 'facebook', 'บ้านภูตะวันโฮมสเตย์', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '460-0-47008-7', 'accountName', 'มินตรา ศรีชานนท์'),
    v_admin_id, 'published'
  ),
  (
    'บ้านดอยหมอกดอยหลวงเชียงดาว (Baan Doi Mok Homestay)', 'Homestay', 4.8, 160, 800, 'THB',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Fog Ocean View', 'Balcony Dining', 'Local Guides'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านดอยหมอกดอยหลวงเชียงดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางสาวอริสา เลาหมี่ / นาย พิชิต เลายี่ป่า', 'since', '2020'),
    jsonb_build_object('phone', '083-322-4925', 'phones', ARRAY['083-322-4925', '095-979-9722'], 'facebook', 'บ้านดอยหมอกดอยหลวงเชียงดาว', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '516-046267-8', 'accountName', 'นางสาวอริสา เลาหมี่ / นาย พิชิต เลายี่ป่า'),
    v_admin_id, 'published'
  ),
  (
    'บ้านสุมาลีโฮมสเตย์ (Baan Sumalee Homestay)', 'Homestay', 4.7, 95, 750, 'THB',
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Family-run', 'Organic Garden', 'Quiet Forest Setting'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านสุมาลีโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายอาทิตย์ ดามี / นางสาว สุมาลี เลายี่ป่า', 'since', '2021'),
    jsonb_build_object('phone', '098-389-5873', 'phones', ARRAY['098-389-5873'], 'facebook', 'บ้านสุมาลีโฮมสเตย์', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '516-048821-9', 'accountName', 'นายอาทิตย์ ดามี / นางสาว สุมาลี เลายี่ป่า'),
    v_admin_id, 'published'
  ),
  (
    'ภูเพียงดาวโฮมสเตย์ (Phu Phiang Dao Homestay)', 'Homestay', 4.9, 180, 900, 'THB',
    'https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['High Altitude Viewpoint', 'Stargazing Platform', 'Northern Drip Coffee'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ภูเพียงดาวโฮมสเตย์ดอยหลวงเชียงดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางสาวสุนิสา เลายี่ป่า', 'since', '2019'),
    jsonb_build_object('phone', '092-761-1606', 'phones', ARRAY['092-761-1606'], 'facebook', 'ภูเพียงดาวโฮมสเตย์ดอยหลวงเชียงดาว', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '516-1-41416-2', 'accountName', 'นางสาวสุนิสา เลายี่ป่า'),
    v_admin_id, 'published'
  ),
  (
    'บ้านสายหมอกโฮมสเตย์ (Baan Sai Mok Homestay)', 'Homestay', 4.8, 200, 800, 'THB',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Surrounded by Mist', 'Bamboo Cabins', 'Local Breakfast Included'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านสายหมอกโฮมสเตย์ดอยหลวงเชียงดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายสุรพล เลามะ', 'since', '2020'),
    jsonb_build_object('phone', '096-753-2158', 'phones', ARRAY['096-753-2158'], 'facebook', 'บ้านสายหมอกโฮมสเตย์ดอยหลวงเชียงดาว', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '516-034-9294', 'accountName', 'นายสุรพล เลามะ'),
    v_admin_id, 'published'
  ),
  (
    'แม่เฒ่าโฮมสเตย์ (Mae Thao Homestay)', 'Homestay', 4.7, 110, 700, 'THB',
    'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Traditional Tribal Homestay', 'Home Cooked Food', 'Authentic Warmth'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'แม่เฒ่าโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายยองอาจ ทวีพิรตินาค', 'since', '2018'),
    jsonb_build_object('phone', '093-214-9146', 'phones', ARRAY['093-214-9146', '093-235-0982'], 'facebook', 'แม่เฒ่าโฮมสเตย์', 'bank', 'ออมสิน (GSB)', 'accountNumber', '0-202-0967-4280', 'accountName', 'นายยองอาจ ทวีพิรตินาค'),
    v_admin_id, 'published'
  ),
  (
    'บ้านทะเลหมอก (Baan Thale Mok)', 'Homestay', 4.8, 155, 800, 'THB',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Direct Mountain View', 'Private Balcony', 'Tea & Coffee'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านทะเลหมอก โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายอะกอย เลาหมี่ / นายสุรพล เลายี่ป่า', 'since', '2020'),
    jsonb_build_object('phone', '063-096-8328', 'phones', ARRAY['063-096-8328'], 'facebook', 'บ้านทะเลหมอก', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '516-0-44757-1', 'accountName', 'นายอะกอย เลาหมี่ / นายสุรพล เลายี่ป่า'),
    v_admin_id, 'published'
  ),
  (
    'บ้านข้างดอยเพียงดาว (Baan Khang Doi Phiang Dao)', 'Homestay', 4.7, 90, 750, 'THB',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Mountain Ridge View', 'Authentic Wooden Cabin', 'Local Dinner Option'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านข้างดอยเพียงดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางสาวอะเลมะ เลาหมี่', 'since', '2021'),
    jsonb_build_object('phone', '062-268-0304', 'phones', ARRAY['062-268-0304'], 'facebook', 'บ้านข้างดอยเพียงดาว', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '516-0-41766-4', 'accountName', 'นางสาวอะเลมะ เลาหมี่'),
    v_admin_id, 'published'
  ),
  (
    'บ้านวิวดอยหลวงโฮมสเตย์ (Baan View Doi Luang Homestay)', 'Homestay', 4.9, 230, 850, 'THB',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Iconic Peak View', 'Wide Deck', 'Breakfast & Dinner Set'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านวิวดอยหลวงโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางสาวอารีย์สาน เลิศวิวัฒน์ไพศาล', 'since', '2019'),
    jsonb_build_object('phone', '083-827-7201', 'phones', ARRAY['083-827-7201', '061-250-2030'], 'facebook', 'บ้านวิวดอยหลวงโฮมสเตย์', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '516-0-74954-3', 'accountName', 'นางสาวอารีย์สาน เลิศวิวัฒน์ไพศาล'),
    v_admin_id, 'published'
  ),
  (
    'บ้านหมอกอรุณเชียงดาว (Baan Mok Arun Chiang Dao)', 'Homestay', 4.8, 170, 800, 'THB',
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Morning Golden Hour', 'Balcony with Doi Luang Frontage', 'Free Coffee'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านหมอกอรุณเชียงดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายเอนก อรุณโชติกาญจน์', 'since', '2020'),
    jsonb_build_object('phone', '093-149-5724', 'phones', ARRAY['093-149-5724', '063-662-9004', '081-078-6565'], 'facebook', 'บ้านหมอกอรุณเชียงดาว', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '516-0-53395-8', 'accountName', 'นายเอนก อรุณโชติกาญจน์'),
    v_admin_id, 'published'
  ),
  (
    'บ้านหมอกฟ้าโฮมสเตย์ (Baan Mok Fah Homestay)', 'Homestay', 4.7, 125, 750, 'THB',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Sky & Fog View', 'Cozy Atmosphere', 'Authentic Local Cooking'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านหมอกฟ้าโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายสมชาย เลามะ', 'since', '2021'),
    jsonb_build_object('phone', '097-984-6844', 'phones', ARRAY['097-984-6844'], 'facebook', 'บ้านหมอกฟ้าโฮมสเตย์', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '516-0-53602-7', 'accountName', 'นายสมชาย เลามะ'),
    v_admin_id, 'published'
  ),
  (
    'ดาวล้อมดอย (Dao Lom Doi)', 'Homestay', 4.8, 145, 800, 'THB',
    'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['360 Star View', 'Quiet Surroundings', 'Traditional Northern Meal'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ดาวล้อมดอย โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางดารณี นพรัตน์นัชชา', 'since', '2020'),
    jsonb_build_object('phone', '061-191-3278', 'phones', ARRAY['061-191-3278'], 'facebook', 'ดาวล้อมดอย', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '516-0-78101-3', 'accountName', 'นางดารณี นพรัตน์นัชชา'),
    v_admin_id, 'published'
  ),
  (
    'บ้านแสงตะวัน เชียงดาว (Baan Saeng Tawan Chiang Dao)', 'Homestay', 4.8, 130, 750, 'THB',
    'https://images.unsplash.com/photo-1540202404-b711c0791486?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['First Morning Light', 'Spacious Balcony', 'Real Local Hospitality'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านแสงตะวัน เชียงดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายพัชระ สิริโสพลธนกิจ', 'since', '2020'),
    jsonb_build_object('phone', '064-539-6740', 'phones', ARRAY['064-539-6740'], 'facebook', 'บ้านแสงตะวัน เชียงดาว', 'bank', 'ธ.ก.ส. (BAAC)', 'accountNumber', '0-202-0978-8603', 'accountName', 'นายพัชระ สิริโสพลธนกิจ'),
    v_admin_id, 'published'
  ),
  (
    'บ้านฮักเฮือนสุข (Baan Hug Huen Suk)', 'Homestay', 4.9, 160, 850, 'THB',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Warm & Cozy Feel', 'PromptPay Verified', 'Sunset Terrace'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านฮักเฮือนสุข โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางสาวอาทิตยา เลายี่ป่า', 'since', '2021'),
    jsonb_build_object('phone', '061-598-9397', 'phones', ARRAY['061-598-9397'], 'facebook', 'บ้านฮักเฮือนสุข', 'bank', 'พร้อมเพย์ (PromptPay)', 'accountNumber', '061-598-9397', 'accountName', 'นางสาวอาทิตยา เลายี่ป่า'),
    v_admin_id, 'published'
  ),
  (
    'ทะเลดาว (Thale Dao)', 'Homestay', 4.7, 105, 700, 'THB',
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Star Field View', 'Rustic Charm', 'Campfire & Grill'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ทะเลดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายสมัชชา เลาหมี่', 'since', '2021'),
    jsonb_build_object('phone', '061-275-8214', 'phones', ARRAY['061-275-8214'], 'facebook', 'ทะเลดาว', 'bank', 'ออมสิน (GSB)', 'accountNumber', '0-202-6778-1290', 'accountName', 'นายสมัชชา เลาหมี่'),
    v_admin_id, 'published'
  ),
  (
    'บ้านสายลมโฮมสเตย์ (Baan Sailom Homestay)', 'Homestay', 4.8, 115, 750, 'THB',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Gentle Mountain Breeze', 'Coffee Balcony', 'Friendly Host'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านสายลมโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายตวงใจ จะหวอ', 'since', '2021'),
    jsonb_build_object('phone', '065-848-3857', 'phones', ARRAY['065-848-3857'], 'facebook', 'บ้านสายลมโฮมสเตย์', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '553-0-26601-0', 'accountName', 'นายตวงใจ จะหวอ'),
    v_admin_id, 'published'
  ),
  (
    'ปราโมทย์โฮมสเตย์ (Pramote Homestay)', 'Homestay', 4.7, 70, 700, 'THB',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Mountain View', 'Local Hospitality', 'Simple Life Experience'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ปราโมทย์โฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายปราโมทย์ เลายี่ป่า', 'since', '2022'),
    jsonb_build_object('phone', '', 'phones', ARRAY[], 'facebook', 'ปราโมทย์โฮมสเตย์', 'bank', '', 'accountNumber', '', 'accountName', 'นายปราโมทย์ เลายี่ป่า'),
    v_admin_id, 'published'
  ),
  (
    'ชุติภาโฮมสเตย์ (Chutipha Homestay)', 'Homestay', 4.8, 90, 750, 'THB',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Valley View', 'Quiet Getaway', 'Authentic Food'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ชุติภาโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางสาว ชุติภา เลาหมู่', 'since', '2021'),
    jsonb_build_object('phone', '', 'phones', ARRAY[], 'facebook', 'ชุติภาโฮมสเตย์', 'bank', '', 'accountNumber', '', 'accountName', 'นางสาว ชุติภา เลาหมู่'),
    v_admin_id, 'published'
  ),
  (
    'บ้านทุ่งตะวันสายรุ้ง (Baan Thung Tawan Sai Rung)', 'Homestay', 4.7, 65, 700, 'THB',
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Rainbow Mountain Field', 'Tribal Culture', 'Fresh Local Ingredients'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านทุ่งตะวันสายรุ้ง โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นาง อะลืมะ ยีป่า', 'since', '2021'),
    jsonb_build_object('phone', '', 'phones', ARRAY[], 'facebook', 'บ้านทุ่งตะวันสายรุ้ง', 'bank', '', 'accountNumber', '', 'accountName', 'นาง อะลืมะ ยีป่า'),
    v_admin_id, 'published'
  ),
  (
    'อะตา โฮมสเตย์ (Ata Homestay)', 'Homestay', 4.8, 85, 750, 'THB',
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Pure Mountain Air', 'Campfire Conversations', 'Real Village Living'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'อะตา โฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นาย อะตา เลายี่ป่า', 'since', '2020'),
    jsonb_build_object('phone', '', 'phones', ARRAY[], 'facebook', 'อะตา โฮมสเตย์', 'bank', '', 'accountNumber', '', 'accountName', 'นาย อะตา เลายี่ป่า'),
    v_admin_id, 'published'
  ),
  (
    'นาเลาบางบัวตอง (Na Lao Bang Bua Tong)', 'Homestay', 4.8, 120, 800, 'THB',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Wild Sunflowers (Bua Tong)', 'Na Lao View', 'Trekking Guide'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'นาเลาบางบัวตอง โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นาย อะชาปีปี เลาหมี่', 'since', '2020'),
    jsonb_build_object('phone', '', 'phones', ARRAY[], 'facebook', 'นาเลาบางบัวตอง', 'bank', '', 'accountNumber', '', 'accountName', 'นาย อะชาปีปี เลาหมี่'),
    v_admin_id, 'published'
  ),
  (
    'บ้านอะซามะ (Baan Asama)', 'Homestay', 4.7, 75, 700, 'THB',
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Cozy Bamboo Huts', 'Scenic Balcony', 'Doi Luang View'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านอะซามะ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางสาว อะซามะ ยีป่า', 'since', '2022'),
    jsonb_build_object('phone', '', 'phones', ARRAY[], 'facebook', 'บ้านอะซามะ', 'bank', '', 'accountNumber', '', 'accountName', 'นางสาว อะซามะ ยีป่า'),
    v_admin_id, 'published'
  ),
  (
    'ซือกีพี (Suekeepee)', 'Homestay', 4.8, 80, 750, 'THB',
    'https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Mountain Ridge Setting', 'Stargazing Night', 'Organic Meals'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ซือกีพี โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางสาว อาทิตยา เลายี่ป่า', 'since', '2021'),
    jsonb_build_object('phone', '', 'phones', ARRAY[], 'facebook', 'ซือกีพี', 'bank', '', 'accountNumber', '', 'accountName', 'นางสาว อาทิตยา เลายี่ป่า'),
    v_admin_id, 'published'
  ),
  (
    'ดอยกุเขา (อุ่นใต้หมอก) (Doi Ku Khao - Oon Tai Mok)', 'Homestay', 4.9, 135, 850, 'THB',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Warm Mist Experience', 'Front-row Peak Panorama', 'Drip Coffee Provided'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ดอยกุเขา (อุ่นใต้หมอก) โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางสาว สุชัญญา แซ่ล้อ', 'since', '2020'),
    jsonb_build_object('phone', '', 'phones', ARRAY[], 'facebook', 'ดอยกุเขา (อุ่นใต้หมอก)', 'bank', '', 'accountNumber', '', 'accountName', 'นางสาว สุชัญญา แซ่ล้อ'),
    v_admin_id, 'published'
  ),
  (
    'ลีซอวิวสวย (Lisu View Suay)', 'Homestay', 4.8, 110, 750, 'THB',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', true,
    ARRAY['Best Viewpoint in Village', 'Lisu Tribal Host', 'Hot Tea & Breakfast'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ลีซอวิวสวย โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นาย สุรพล เลาหมี่', 'since', '2021'),
    jsonb_build_object('phone', '', 'phones', ARRAY[], 'facebook', 'ลีซอวิวสวย', 'bank', '', 'accountNumber', '', 'accountName', 'นาย สุรพล เลาหมี่'),
    v_admin_id, 'published'
  );

END $$;
