export interface Comment {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  imageUrl: string | null;
  locationTag: string | null;
  lat?: number | null;
  lng?: number | null;
  rating?: number | null;
  priceRating?: string | null;
  propertyId?: string | null;
  likes: string[];
  comments: Comment[];
  createdAt: string;
  updatedAt?: string;
}

export interface Property {
  id: string;
  name: string;
  type: string;
  price?: string | number;
  pricePerNight?: number;
  price_per_night?: number;
  currency?: string;
  rating?: number;
  reviews?: number;
  views?: number;
  badge?: string;
  imageUrl?: string;
  image_url?: string;
  images: string[];
  features?: string[];
  amenities: string[];
  location?: string;
  province?: string;
  district?: string;
  description?: string;
  checkIn?: string;
  checkOut?: string;
  check_in?: string;
  check_out?: string;
  isVerified?: boolean;
  is_verified?: boolean;
  host?: {
    name: string;
    since: string;
  };
  host_info?: {
    name: string;
    since: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    line?: string;
  };
  ownerId?: string;
  owner_id?: string;
  status: 'active' | 'draft' | 'published';
  createdAt?: string;
  updatedAt?: string;
}
