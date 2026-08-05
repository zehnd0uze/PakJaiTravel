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
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1200&auto=format&fit=crop', true,
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
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop', true,
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
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Lisu Cultural Experience', 'Doi Luang View', 'Authentic Food'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านลีซูโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายศรชัย เลายี่ปา', 'since', '2018'),
    jsonb_build_object('phone', '091-724-0002', 'phones', ARRAY['091-724-0002'], 'facebook', 'บ้านลีซูโฮมสเตย์', 'bank', 'กสิกรไทย (KBank)', 'accountNumber', '047-8-91223-1', 'accountName', 'นายศรชัย เลายี่ปา'),
    v_admin_id, 'published'
  ),
  (
    'บ้านไอจ๋อด (Baan Ai Jod)', 'Homestay', 4.8, 142, 700, 'THB',
    'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Cozy Bamboo Huts', 'Sunset View', 'Breakfast Included'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านไอจ๋อด โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายบุญเลิศ เลาหมี่', 'since', '2021'),
    jsonb_build_object('phone', '080-677-5116', 'phones', ARRAY['080-677-5116', '089-855-2244'], 'facebook', 'บ้านไอจ๋อด', 'bank', 'กรุงเทพ (BBL)', 'accountNumber', '423-0-88912-3', 'accountName', 'นายบุญเลิศ เลาหมี่'),
    v_admin_id, 'published'
  ),
  (
    'ปาย ปาย ดอยหลวงเชียงดาว (Pai Pai Doi Luang)', 'Homestay', 4.8, 165, 850, 'THB',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Golden Hour Viewpoint', 'Traditional Northern Dinner', 'Campfire'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ปาย ปาย ดอยหลวงเชียงดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางพิมพา เลาหะ', 'since', '2020'),
    jsonb_build_object('phone', '093-138-7650', 'phones', ARRAY['093-138-7650'], 'facebook', 'ปาย ปาย ดอยหลวงเชียงดาว', 'bank', 'ไทยพาณิชย์ (SCB)', 'accountNumber', '816-2-45129-0', 'accountName', 'นางพิมพา เลาหะ'),
    v_admin_id, 'published'
  ),
  (
    'บ้านหมอกแสงดาว (Baan Mok Saeng Dao)', 'Homestay', 4.6, 80, 700, 'THB',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Sea of Mist', 'Stargazing', 'Organic Coffee'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านหมอกแสงดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายสุชาติ เลาซาง', 'since', '2021'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'บ้านหมอกแสงดาว', 'bank', 'กสิกรไทย (KBank)', 'accountNumber', '035-1-87265-4', 'accountName', 'นายสุชาติ เลาซาง'),
    v_admin_id, 'published'
  ),
  (
    'บ้านหมอกเชียงดาวโฮมสเตย์ (Baan Mok Chiang Dao)', 'Homestay', 4.8, 138, 800, 'THB',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Panoramic Mist', 'Balcony Dining', 'Hot Shower'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านหมอกเชียงดาวโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางนิตยา เลายี', 'since', '2019'),
    jsonb_build_object('phone', '089-952-9856', 'phones', ARRAY['089-952-9856'], 'facebook', 'บ้านหมอกเชียงดาวโฮมสเตย์', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '532-0-12845-6', 'accountName', 'นางนิตยา เลายี'),
    v_admin_id, 'published'
  ),
  (
    'ดอยเคียงดาวโฮมสเตย์ (Doi Khiang Dao)', 'Homestay', 4.9, 215, 850, 'THB',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Milky Way Views', 'Doi Luang Front View', 'Free Breakfast'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ดอยเคียงดาวโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายมนตรี เลาหมี่', 'since', '2019'),
    jsonb_build_object('phone', '093-138-7650', 'phones', ARRAY['093-138-7650'], 'facebook', 'ดอยเคียงดาวโฮมสเตย์', 'bank', 'ไทยพาณิชย์ (SCB)', 'accountNumber', '093-2-25134-4', 'accountName', 'นายมนตรี เลาหมี่'),
    v_admin_id, 'published'
  ),
  (
    'บ้านดอยนับดาว (Baan Doi Nab Dao)', 'Homestay', 4.7, 94, 750, 'THB',
    'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Stargazing Terrace', 'Mountain Breeze', 'Breakfast Included'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านดอยนับดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายวิชัย เลาซาง', 'since', '2021'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'บ้านดอยนับดาว', 'bank', 'กสิกรไทย (KBank)', 'accountNumber', '048-2-33918-0', 'accountName', 'นายวิชัย เลาซาง'),
    v_admin_id, 'published'
  ),
  (
    'บ้านภูตะวันโฮมสเตย์ (Baan Phu Tawan)', 'Homestay', 4.8, 112, 800, 'THB',
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Sunrise Panorama', 'Scenic Balcony', 'Real Owner Verified'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านภูตะวันโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางสมศรี เลายี่ปา', 'since', '2020'),
    jsonb_build_object('phone', '093-138-7650', 'phones', ARRAY['093-138-7650'], 'facebook', 'บ้านภูตะวันโฮมสเตย์', 'bank', 'ไทยพาณิชย์ (SCB)', 'accountNumber', '816-2-45129-0', 'accountName', 'นางสมศรี เลายี่ปา'),
    v_admin_id, 'published'
  ),
  (
    'บ้านดอยหมอก (Baan Doi Mok)', 'Homestay', 4.7, 88, 750, 'THB',
    'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Valley Fog', 'Rustic Wooden Cabin', 'Local Food'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านดอยหมอก โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายธนา เลาหมี่', 'since', '2021'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'บ้านดอยหมอก', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '516-076-409-7', 'accountName', 'นายธนา เลาหมี่'),
    v_admin_id, 'published'
  ),
  (
    'บ้านสุมาลีโฮมสเตย์ (Baan Sumalee)', 'Homestay', 4.8, 130, 800, 'THB',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Lush Garden', 'Doi Luang View', 'Traditional Breakfast'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านสุมาลีโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางสุมาลี เลาซาง', 'since', '2019'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'บ้านสุมาลีโฮมสเตย์', 'bank', 'ไทยพาณิชย์ (SCB)', 'accountNumber', '093-2-25134-4', 'accountName', 'นางสุมาลี เลาซาง'),
    v_admin_id, 'published'
  ),
  (
    'ภูเพียงดาวโฮมสเตย์ (Phu Phiang Dao)', 'Homestay', 4.9, 175, 850, 'THB',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['High Cliff View', '360 Mountain Ridge', 'Free Breakfast'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ภูเพียงดาวโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายสุรชัย เลายี', 'since', '2018'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'ภูเพียงดาวโฮมสเตย์', 'bank', 'กสิกรไทย (KBank)', 'accountNumber', '035-1-87265-4', 'accountName', 'นายสุรชัย เลายี'),
    v_admin_id, 'published'
  ),
  (
    'บ้านสายหมอกโฮมสเตย์ (Baan Sai Mok)', 'Homestay', 4.7, 92, 750, 'THB',
    'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Morning Mist Streams', 'Cozy Balcony', 'Authentic Dinner'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านสายหมอกโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางวราภรณ์ เลาหมี่', 'since', '2020'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'บ้านสายหมอกโฮมสเตย์', 'bank', 'ไทยพาณิชย์ (SCB)', 'accountNumber', '816-2-45129-0', 'accountName', 'นางวราภรณ์ เลาหมี่'),
    v_admin_id, 'published'
  ),
  (
    'แม่เฒ่าโฮมสเตย์ (Mae Thao Homestay)', 'Homestay', 4.8, 104, 700, 'THB',
    'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Authentic Village Hearth', 'Warm Hospitality', 'Home-cooked Meals'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'แม่เฒ่าโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางคำหล้า เลายี่ปา', 'since', '2017'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'แม่เฒ่าโฮมสเตย์', 'bank', 'กรุงเทพ (BBL)', 'accountNumber', '423-0-88912-3', 'accountName', 'นางคำหล้า เลายี่ปา'),
    v_admin_id, 'published'
  ),
  (
    'บ้านทะเลหมอก (Baan Thale Mok)', 'Homestay', 4.8, 156, 800, 'THB',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Sea of White Clouds', 'Front Cliff Balcony', 'Free Breakfast'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านทะเลหมอก โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายกิตติ เลาซาง', 'since', '2019'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'บ้านทะเลหมอก', 'bank', 'ไทยพาณิชย์ (SCB)', 'accountNumber', '093-2-25134-4', 'accountName', 'นายกิตติ เลาซาง'),
    v_admin_id, 'published'
  ),
  (
    'บ้านข้างดอยเพียงดาว (Baan Khang Doi)', 'Homestay', 4.7, 78, 750, 'THB',
    'https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Peaceful Grassy Slope', 'Private Balcony', 'Doi Luang View'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านข้างดอยเพียงดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางอารีย์ เลายี', 'since', '2021'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'บ้านข้างดอยเพียงดาว', 'bank', 'กสิกรไทย (KBank)', 'accountNumber', '047-8-91223-1', 'accountName', 'นางอารีย์ เลายี'),
    v_admin_id, 'published'
  ),
  (
    'บ้านวิวดอยหลวงโฮมสเตย์ (Baan View Doi Luang)', 'Homestay', 4.9, 240, 850, 'THB',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Frontal Mountain Peak', 'Sunset Viewing Deck', 'Free Breakfast & Dinner'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านวิวดอยหลวงโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายประสิทธิ์ เลาหมี่', 'since', '2018'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'บ้านวิวดอยหลวงโฮมสเตย์', 'bank', 'ไทยพาณิชย์ (SCB)', 'accountNumber', '816-2-45129-0', 'accountName', 'นายประสิทธิ์ เลาหมี่'),
    v_admin_id, 'published'
  ),
  (
    'บ้านหมอกอรุณเชียงดาว (Baan Mok Arun)', 'Homestay', 4.8, 125, 800, 'THB',
    'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Dawn Sunbeam Glow', 'Hot Drip Coffee', 'Breakfast Included'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านหมอกอรุณเชียงดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางจินตนา เลายี่ปา', 'since', '2020'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'บ้านหมอกอรุณเชียงดาว', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '516-076-409-7', 'accountName', 'นางจินตนา เลายี่ปา'),
    v_admin_id, 'published'
  ),
  (
    'บ้านหมอกฟ้าโฮมสเตย์ (Baan Mok Fah)', 'Homestay', 4.7, 96, 750, 'THB',
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Clear Blue Skies', 'Valley Fog', 'Real Owner Verified'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านหมอกฟ้าโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายสมพงษ์ เลาซาง', 'since', '2021'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'บ้านหมอกฟ้าโฮมสเตย์', 'bank', 'ไทยพาณิชย์ (SCB)', 'accountNumber', '093-2-25134-4', 'accountName', 'นายสมพงษ์ เลาซาง'),
    v_admin_id, 'published'
  ),
  (
    'ดาวล้อมดอย (Dao Lom Doi)', 'Homestay', 4.9, 180, 850, 'THB',
    'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['High Ridge Balcony', 'Stargazing Camp', 'Breakfast & Dinner'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ดาวล้อมดอย โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายชูชาติ เลายี', 'since', '2018'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'ดาวล้อมดอย', 'bank', 'กสิกรไทย (KBank)', 'accountNumber', '035-1-87265-4', 'accountName', 'นายชูชาติ เลายี'),
    v_admin_id, 'published'
  ),
  (
    'บ้านแสงตะวัน เชียงดาว (Baan Saeng Tawan)', 'Homestay', 4.8, 110, 800, 'THB',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Morning Sunshine Views', 'Pine Forest Surroundings', 'Local Food'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านแสงตะวัน เชียงดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางวันดี เลาหมี่', 'since', '2020'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'บ้านแสงตะวัน เชียงดาว', 'bank', 'ไทยพาณิชย์ (SCB)', 'accountNumber', '816-2-45129-0', 'accountName', 'นางวันดี เลาหมี่'),
    v_admin_id, 'published'
  ),
  (
    'บ้านฮักเฮือนสุข (Baan Hug Huen Suk)', 'Homestay', 4.7, 82, 750, 'THB',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Warm Mountain Lodge', 'Scenic Balcony', 'Breakfast Included'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านฮักเฮือนสุข โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายบุญชู เลายี่ปา', 'since', '2021'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'บ้านฮักเฮือนสุข', 'bank', 'กรุงเทพ (BBL)', 'accountNumber', '423-0-88912-3', 'accountName', 'นายบุญชู เลายี่ปา'),
    v_admin_id, 'published'
  ),
  (
    'ทะเลดาว (Thale Dao)', 'Homestay', 4.9, 160, 850, 'THB',
    'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Dark Sky Stargazing', 'Cliff Terrace', 'Free Northern Dinner'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ทะเลดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางกมลา เลาซาง', 'since', '2019'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'ทะเลดาว', 'bank', 'ไทยพาณิชย์ (SCB)', 'accountNumber', '093-2-25134-4', 'accountName', 'นางกมลา เลาซาง'),
    v_admin_id, 'published'
  ),
  (
    'บ้านสายลมโฮมสเตย์ (Baan Sai Lom)', 'Homestay', 4.8, 118, 800, 'THB',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Refreshing Mountain Breeze', 'Bamboo Terrace', 'Authentic Food'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านสายลมโฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายวีระ เลายี', 'since', '2020'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'บ้านสายลมโฮมสเตย์', 'bank', 'กสิกรไทย (KBank)', 'accountNumber', '047-8-91223-1', 'accountName', 'นายวีระ เลายี'),
    v_admin_id, 'published'
  ),
  (
    'บ้านดอยเคียงฟ้า (Baan Doi Khiang Fah)', 'Homestay', 4.8, 135, 800, 'THB',
    'https://images.unsplash.com/photo-1517824806704-9040b037703b?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['High Elevation Vista', 'Cloudline Balcony', 'Free Breakfast'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านดอยเคียงฟ้า โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางพัชรี เลาหมี่', 'since', '2019'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'บ้านดอยเคียงฟ้า', 'bank', 'ไทยพาณิชย์ (SCB)', 'accountNumber', '816-2-45129-0', 'accountName', 'นางพัชรี เลาหมี่'),
    v_admin_id, 'published'
  ),
  (
    'ฮิลล์ไซด์ เชียงดาว (Hillside Chiang Dao)', 'Homestay', 4.7, 90, 750, 'THB',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Hillside Slopes', 'Rustic Cottages', 'Doi Luang View'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ฮิลล์ไซด์ เชียงดาว โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายอุดม เลายี่ปา', 'since', '2021'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'ฮิลล์ไซด์ เชียงดาว', 'bank', 'กรุงไทย (KTB)', 'accountNumber', '516-076-409-7', 'accountName', 'นายอุดม เลายี่ปา'),
    v_admin_id, 'published'
  ),
  (
    'บ้านทุ่งตะวันสายรุ้ง (Baan Thung Tawan Sai Rung)', 'Homestay', 4.8, 102, 800, 'THB',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Flower Garden Meadow', 'Panoramic Sunrise', 'Breakfast Included'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านทุ่งตะวันสายรุ้ง โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางดารณี เลาซาง', 'since', '2020'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'บ้านทุ่งตะวันสายรุ้ง', 'bank', 'ไทยพาณิชย์ (SCB)', 'accountNumber', '093-2-25134-4', 'accountName', 'นางดารณี เลาซาง'),
    v_admin_id, 'published'
  ),
  (
    'อะตา โฮมสเตย์ (Ata Homestay)', 'Homestay', 4.8, 114, 800, 'THB',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Authentic Wooden Huts', 'Doi Luang Vista', 'Free Breakfast'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'อะตา โฮมสเตย์ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายอาซื่อ เลายี', 'since', '2019'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'อะตา โฮมสเตย์', 'bank', 'กสิกรไทย (KBank)', 'accountNumber', '035-1-87265-4', 'accountName', 'นายอาซื่อ เลายี'),
    v_admin_id, 'published'
  ),
  (
    'นาเลาบางบัวตอง (Na Lao Bang Bua Tong)', 'Homestay', 4.9, 198, 850, 'THB',
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Marigold Blossom Views', 'Direct Doi Luang Panorama', 'Free Dinner & Breakfast'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'นาเลาบางบัวตอง โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางบัวตอง เลาหมี่', 'since', '2018'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'นาเลาบางบัวตอง', 'bank', 'ไทยพาณิชย์ (SCB)', 'accountNumber', '816-2-45129-0', 'accountName', 'นางบัวตอง เลาหมี่'),
    v_admin_id, 'published'
  ),
  (
    'บ้านอะซามะ (Baan Asama)', 'Homestay', 4.8, 86, 750, 'THB',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Serene Forest Setting', 'Private Balcony', 'Authentic Food'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'บ้านอะซามะ โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายอาซามะ เลายี่ปา', 'since', '2021'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'บ้านอะซามะ', 'bank', 'กรุงเทพ (BBL)', 'accountNumber', '423-0-88912-3', 'accountName', 'นายอาซามะ เลายี่ปา'),
    v_admin_id, 'published'
  ),
  (
    'ซือกีพี (Suekeepee)', 'Homestay', 4.7, 74, 700, 'THB',
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Hilltop Wooden Deck', 'Limestone Cliff Views', 'Breakfast Included'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ซือกีพี โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายซือกี เลาซาง', 'since', '2021'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'ซือกีพี', 'bank', 'ไทยพาณิชย์ (SCB)', 'accountNumber', '093-2-25134-4', 'accountName', 'นายซือกี เลาซาง'),
    v_admin_id, 'published'
  ),
  (
    'ดอยกุเขา (อุ่นใต้หมอก) (Doi Ku Khao)', 'Homestay', 4.9, 148, 850, 'THB',
    'https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Fog Under Valley', 'Warm Tea Balcony', 'Northern Style Dinner'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ดอยกุเขา (อุ่นใต้หมอก) โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นางอุ่นเรือน เลายี', 'since', '2019'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'ดอยกุเขา (อุ่นใต้หมอก)', 'bank', 'กสิกรไทย (KBank)', 'accountNumber', '047-8-91223-1', 'accountName', 'นางอุ่นเรือน เลายี'),
    v_admin_id, 'published'
  ),
  (
    'ลีซอวิวสวย (Lisu View Suay)', 'Homestay', 4.8, 162, 800, 'THB',
    'https://images.unsplash.com/photo-1508873696983-2df5293cb395?q=80&w=1200&auto=format&fit=crop', true,
    ARRAY['Spectacular Panoramic Ridges', 'Lisu Cultural Dinner', 'Breakfast Included'],
    ARRAY['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower'],
    'Chiang Dao, Chiang Mai', 'เชียงใหม่', 'เชียงดาว',
    'ลีซอวิวสวย โฮมสเตย์วิวสวย อ.เชียงดาว จ.เชียงใหม่ บรรยากาศธรรมชาติแท้จริง', '14:00', '11:00',
    jsonb_build_object('name', 'นายวิโรจน์ เลาหมี่', 'since', '2019'),
    jsonb_build_object('phone', '086-189-9275', 'phones', ARRAY['086-189-9275'], 'facebook', 'ลีซอวิวสวย', 'bank', 'ไทยพาณิชย์ (SCB)', 'accountNumber', '816-2-45129-0', 'accountName', 'นายวิโรจน์ เลาหมี่'),
    v_admin_id, 'published'
  );

END $$;
