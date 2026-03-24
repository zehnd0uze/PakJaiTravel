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
  price: string;
  views?: number;
  badge?: string;
  images: string[];
  amenities: string[];
  ownerId: string;
  status: 'active' | 'draft';
  createdAt?: string;
  updatedAt?: string;
}
