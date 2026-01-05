export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const SERVICE_TYPES = {
  FOLLOW: 'follow',
  LIKE: 'like',
  COMMENT: 'comment',
  SUBSCRIBE: 'subscribe',
  RETWEET: 'retweet',
  FAVORITE: 'favorite',
  REPOST: 'repost',
  FRIEND: 'friend',
  VOTE: 'vote',
  DISLIKE: 'dislike',
  LIKE_TO_COMMENT: 'like_to_comment',
  DISLIKE_TO_COMMENT: 'dislike_to_comment',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PARTIAL: 'partial',
  AWAITING: 'awaiting',
  CANCELED: 'canceled',
  FAIL: 'fail',
} as const;

export const COMPANY_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
} as const;

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  follow: 'Followers',
  like: 'Likes',
  comment: 'Comments',
  subscribe: 'Subscribers',
  retweet: 'Retweets',
  favorite: 'Favorites',
  repost: 'Reposts',
  friend: 'Friends',
  vote: 'Votes',
  dislike: 'Dislikes',
  like_to_comment: 'Like to Comment',
  dislike_to_comment: 'Dislike to Comment',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: '#FFA500',
  in_progress: '#1E90FF',
  completed: '#32CD32',
  partial: '#FFD700',
  awaiting: '#9370DB',
  canceled: '#DC143C',
  fail: '#B22222',
  active: '#32CD32',
  inactive: '#808080',
  suspended: '#DC143C',
};
