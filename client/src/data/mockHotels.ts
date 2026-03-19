export interface Hotel {
  id: string;
  name: string;
  type: string; // 'Homestay', 'Resort', 'Hotel'
  rating: number;
  reviews: number;
  pricePerNight: number;
  currency: string;
  imageUrl: string;
  images: string[]; // Gallery images
  isVerified: boolean;
  features: string[];
  amenities: string[];
  location: string;
  province: string;
  district: string;
  description: string;
  checkIn: string;
  checkOut: string;
  host: {
    name: string;
    since: string;
  };
  contact: {
    phone: string;
    email: string;
    line?: string;
  };
}

export const mockHotels: Hotel[] = [
  {
    id: 'cd-1',
    name: 'Baan Rabiang Dao Homestay',
    type: 'Homestay',
    rating: 4.8,
    reviews: 245,
    pricePerNight: 800,
    currency: 'THB',
    imageUrl: 'https://images.unsplash.com/photo-1540202404-b711c0791486?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1540202404-b711c0791486?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1200&auto=format&fit=crop',
    ],
    isVerified: true,
    features: ['Doi Luang View', 'Breakfast Included', 'Private Balcony', 'Real Owner'],
    amenities: ['Wi-Fi', 'Breakfast', 'Mountain View', 'Balcony', 'Hot Shower', 'Parking', 'Garden', 'Fan'],
    location: 'Chiang Dao, Chiang Mai',
    province: 'Chiang Mai',
    district: 'Chiang Dao',
    description: 'Nestled at the foot of Doi Luang Chiang Dao, Baan Rabiang Dao offers an authentic northern Thai homestay experience. Wake up to breathtaking mountain views from your private balcony. Enjoy home-cooked Thai breakfast each morning prepared by the host family. The property is surrounded by lush greenery and is just 10 minutes from Chiang Dao Cave. Perfect for travelers seeking peace, nature, and genuine local hospitality.',
    checkIn: '14:00',
    checkOut: '11:00',
    host: {
      name: 'Khun Somchai',
      since: '2019',
    },
    contact: {
      phone: '+66 89 123 4567',
      email: 'rabiang.dao@gmail.com',
      line: '@rabiangdao',
    },
  },
  {
    id: 'cd-4',
    name: 'Baan Kang Wat Chiang Dao',
    type: 'Homestay',
    rating: 4.9,
    reviews: 89,
    pricePerNight: 950,
    currency: 'THB',
    imageUrl: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1200&auto=format&fit=crop',
    ],
    isVerified: true,
    features: ['Authentic Style', 'Local Food', 'Real Owner', 'Doi Luang View'],
    amenities: ['Wi-Fi', 'Local Breakfast', 'Mountain View', 'Terrace', 'Hot Shower', 'Parking', 'Bicycles', 'Kitchen'],
    location: 'Chiang Dao, Chiang Mai',
    province: 'Chiang Mai',
    district: 'Chiang Dao',
    description: 'Baan Kang Wat Chiang Dao is built in traditional Lanna style, blending art and nature in perfect harmony. Each room is uniquely decorated with local craftsmanship. Guests can enjoy authentic northern Thai cuisine prepared with fresh local ingredients. The property sits within a small art community where you can explore local workshops and galleries. Ideal for culture lovers and those seeking a slower pace of life.',
    checkIn: '15:00',
    checkOut: '11:00',
    host: {
      name: 'Khun Nara',
      since: '2020',
    },
    contact: {
      phone: '+66 92 345 6789',
      email: 'kangwat.cd@gmail.com',
      line: '@kangwatcd',
    },
  },
  {
    id: 'cd-2',
    name: 'Azalea Village',
    type: 'Resort',
    rating: 4.6,
    reviews: 180,
    pricePerNight: 1500,
    currency: 'THB',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590490360182-c33d955f3e20?q=80&w=1200&auto=format&fit=crop',
    ],
    isVerified: true,
    features: ['Swimming Pool', 'Mountain View', 'Air Conditioning', 'Restaurant'],
    amenities: ['Wi-Fi', 'Pool', 'A/C', 'Restaurant', 'Bar', 'Room Service', 'Spa', 'Parking', 'Gym'],
    location: 'Chiang Dao, Chiang Mai',
    province: 'Chiang Mai',
    district: 'Chiang Dao',
    description: 'Azalea Village is a boutique resort set among tropical gardens with stunning views of Doi Luang Chiang Dao. The resort features an infinity pool overlooking the mountains, a full-service restaurant serving both Thai and international cuisine, and a relaxing spa. Each villa is equipped with modern amenities while maintaining a natural, earthy aesthetic. A perfect blend of comfort and nature for the discerning traveler.',
    checkIn: '14:00',
    checkOut: '12:00',
    host: {
      name: 'Azalea Village Management',
      since: '2017',
    },
    contact: {
      phone: '+66 53 456 789',
      email: 'info@azaleavillage.com',
    },
  },
  {
    id: 'cd-3',
    name: 'Chiang Dao Nest 1',
    type: 'Resort',
    rating: 4.7,
    reviews: 312,
    pricePerNight: 1200,
    currency: 'THB',
    imageUrl: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=800&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1587381420270-4e9a4a1c0b8f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=1200&auto=format&fit=crop',
    ],
    isVerified: true,
    features: ['Nature Surroundings', 'Award-winning Restaurant', 'Wi-Fi'],
    amenities: ['Wi-Fi', 'Restaurant', 'Mountain View', 'Garden', 'Parking', 'Terrace', 'Library', 'Bird Watching'],
    location: 'Chiang Dao, Chiang Mai',
    province: 'Chiang Mai',
    district: 'Chiang Dao',
    description: 'Chiang Dao Nest is an award-winning eco-resort nestled in a lush valley at the base of Doi Chiang Dao. Known for its outstanding restaurant that uses locally sourced organic ingredients, the Nest offers cozy bamboo bungalows surrounded by nature. Guests can enjoy bird watching, nature walks, and stargazing. The resort has been featured in Lonely Planet and National Geographic Traveler as one of the top eco-stays in Thailand.',
    checkIn: '14:00',
    checkOut: '11:00',
    host: {
      name: 'Khun Piya & Khun Joss',
      since: '2015',
    },
    contact: {
      phone: '+66 86 789 1234',
      email: 'stay@chiangdaonest.com',
      line: '@chiangdaonest',
    },
  }
];
