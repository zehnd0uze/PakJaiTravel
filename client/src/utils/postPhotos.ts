import { type Post } from '../types';

/** Max photos in one journal post */
export const MAX_POST_PHOTOS = 10;

/** All photos of a post in order; falls back to imageUrl for older single-photo posts. */
export const getPostPhotos = (post: Pick<Post, 'images' | 'imageUrl'>): string[] => {
  const images = (post.images || []).filter(Boolean);
  if (images.length > 0) return images;
  return post.imageUrl ? [post.imageUrl] : [];
};
