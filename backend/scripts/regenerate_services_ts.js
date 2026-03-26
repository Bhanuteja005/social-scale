const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const config = require(path.join(__dirname, '..', 'src', 'config', 'env'));

const outputPath = path.join(__dirname, '..', '..', 'socialscaleagency', 'src', 'data', 'services.ts');

const platformMeta = {
  'NET-01': { title: 'Instagram', icon: 'Instagram' },
  'NET-02': { title: 'TikTok', icon: 'MessageCircle' },
  'NET-03': { title: 'LinkedIn', icon: 'Linkedin' },
  'NET-04': { title: 'YouTube', icon: 'Youtube' },
  'NET-05': { title: 'X (Twitter)', icon: 'Twitter' },
  'NET-06': { title: 'Threads', icon: 'MessageCircle' },
  'NET-07': { title: 'Pinterest', icon: 'Share2' },
  'NET-08': { title: 'Discord', icon: 'MessageCircle' },
  'NET-09': { title: 'Facebook', icon: 'Facebook' },
  'NET-10': { title: 'Spotify', icon: 'Play' },
  'NET-11': { title: 'Telegram', icon: 'MessageCircle' },
  'NET-12': { title: 'Quora', icon: 'MessageCircle' },
  'NET-13': { title: 'Other', icon: 'Globe' },
};

const typeMeta = {
  like: { title: 'Likes', icon: 'Heart', color: 'text-pink-600', bg: 'bg-pink-600/10' },
  subscribe: { title: 'Followers / Subscribers', icon: 'Users', color: 'text-blue-600', bg: 'bg-blue-600/10' },
  follow: { title: 'Followers / Subscribers', icon: 'Users', color: 'text-blue-600', bg: 'bg-blue-600/10' },
  comment: { title: 'Comments', icon: 'MessageCircle', color: 'text-indigo-600', bg: 'bg-indigo-600/10' },
  like_to_comment: { title: 'Like to Comment', icon: 'MessageCircle', color: 'text-indigo-600', bg: 'bg-indigo-600/10' },
  dislike: { title: 'Dislikes', icon: 'Vote', color: 'text-red-600', bg: 'bg-red-600/10' },
  dislike_to_comment: { title: 'Dislike to Comment', icon: 'Vote', color: 'text-red-600', bg: 'bg-red-600/10' },
  repost: { title: 'Reposts / Shares', icon: 'Share2', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  retweet: { title: 'Retweets', icon: 'Share2', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  friend: { title: 'Friends / Connections', icon: 'Users', color: 'text-cyan-600', bg: 'bg-cyan-600/10' },
  vote: { title: 'Votes / Reactions', icon: 'Vote', color: 'text-purple-600', bg: 'bg-purple-600/10' },
  favorite: { title: 'Favorites', icon: 'Heart', color: 'text-rose-600', bg: 'bg-rose-600/10' },
};

const iconForCategory = {
  followers: 'Users',
  likes: 'Heart',
  comments: 'MessageCircle',
  views: 'Play',
  repost: 'Share2',
  story: 'Eye',
  vote: 'Vote',
  other: 'Play',
};

const colorForCategory = {
  followers: { color: 'text-blue-600', bg: 'bg-blue-600/10' },
  likes: { color: 'text-pink-600', bg: 'bg-pink-600/10' },
  comments: { color: 'text-indigo-600', bg: 'bg-indigo-600/10' },
  views: { color: 'text-cyan-600', bg: 'bg-cyan-600/10' },
  repost: { color: 'text-sky-600', bg: 'bg-sky-600/10' },
  story: { color: 'text-purple-600', bg: 'bg-purple-600/10' },
  vote: { color: 'text-amber-600', bg: 'bg-amber-600/10' },
  other: { color: 'text-slate-600', bg: 'bg-slate-600/10' },
};

const categoryOrderByNetwork = {
  'NET-01': [
    'inst-followers',
    'inst-likes',
    'inst-reach-share-saves',
    'inst-story-services',
    'inst-repost',
    'inst-random-comments',
    'inst-custom-comments',
    'inst-comment-likes',
    'inst-live-views',
    'inst-channel-member',
    'inst-reels-views',
    'inst-other',
  ],
};

function detectPlatform(service) {
  const name = String(service.name || '').toLowerCase();
  const category = String(service.category || '').toLowerCase();
  const haystack = `${name} ${category}`;

  if (haystack.includes('instagram')) return 'NET-01';
  if (haystack.includes('tiktok') || haystack.includes('tik tok')) return 'NET-02';
  if (haystack.includes('linkedin')) return 'NET-03';
  if (haystack.includes('youtube') || haystack.includes('yt ')) return 'NET-04';
  if (haystack.includes('twitter') || haystack.includes('x/twitter') || haystack.includes(' x ')) return 'NET-05';
  if (haystack.includes('threads')) return 'NET-06';
  if (haystack.includes('pinterest')) return 'NET-07';
  if (haystack.includes('discord')) return 'NET-08';
  if (haystack.includes('facebook') || haystack.includes('fb ')) return 'NET-09';
  if (haystack.includes('spotify')) return 'NET-10';
  if (haystack.includes('telegram')) return 'NET-11';
  if (haystack.includes('quora')) return 'NET-12';

  return 'NET-13';
}

function getCategoryForService(networkId, service) {
  const p = platformMeta[networkId]?.title || 'Platform';
  const name = String(service.name || '').toLowerCase();
  const category = String(service.category || '').toLowerCase();
  const type = String(service.type || 'general').toLowerCase();
  const text = `${name} ${category}`;

  if (networkId === 'NET-01') {
    if (text.includes('channel member')) {
      return { key: 'inst-channel-member', title: `${p} : Channel Member`, kind: 'followers' };
    }
    if (text.includes('live view')) {
      return { key: 'inst-live-views', title: `${p} : Live Views`, kind: 'views' };
    }
    if (text.includes('custom comment')) {
      return { key: 'inst-custom-comments', title: `${p} : Custom Comments`, kind: 'comments' };
    }
    if (text.includes('comment like')) {
      return { key: 'inst-comment-likes', title: `${p} : Comment Likes`, kind: 'comments' };
    }
    if (text.includes('comment')) {
      return { key: 'inst-random-comments', title: `${p} : Random Comments`, kind: 'comments' };
    }
    if (text.includes('random comment') || text.includes('positive comment')) {
      return { key: 'inst-random-comments', title: `${p} : Random Comments`, kind: 'comments' };
    }
    if (text.includes('repost')) {
      return { key: 'inst-repost', title: `${p} : Repost`, kind: 'repost' };
    }
    if (text.includes('story') || text.includes('highlight') || text.includes('vote')) {
      return { key: 'inst-story-services', title: `${p} : Story Services`, kind: 'story' };
    }
    if (
      text.includes('reach') || text.includes('impression') || text.includes('save') ||
      text.includes('share') || text.includes('profile visit') || text.includes('traffic') ||
      text.includes('post view') || text.includes('photo view') ||
      (text.includes('post') && text.includes('view'))
    ) {
      return { key: 'inst-reach-share-saves', title: `${p} : Reach / Share / Saves`, kind: 'views' };
    }
    if (text.includes('reel')) {
      return { key: 'inst-reels-views', title: `${p} : Reels Views`, kind: 'views' };
    }
    if (text.includes('follower') || type === 'follow' || type === 'subscribe') {
      return { key: 'inst-followers', title: `${p} : Followers`, kind: 'followers' };
    }
    if (text.includes('like') || type === 'like' || type === 'favorite') {
      return { key: 'inst-likes', title: `${p} : Likes`, kind: 'likes' };
    }
    return { key: 'inst-other', title: `${p} : Other`, kind: 'other' };
  }

  const baseMeta = typeMeta[type] || null;
  if (baseMeta) {
    const kind =
      type === 'repost' || type === 'retweet' ? 'repost' :
      type === 'comment' || type === 'like_to_comment' || type === 'dislike_to_comment' ? 'comments' :
      type === 'vote' ? 'vote' :
      type === 'follow' || type === 'subscribe' || type === 'friend' ? 'followers' :
      type === 'like' || type === 'favorite' || type === 'dislike' ? 'likes' :
      'other';
    return { key: `type-${type}`, title: `${p} : ${baseMeta.title}`, kind };
  }

  if (text.includes('view') || text.includes('traffic')) return { key: 'keyword-views', title: `${p} : Views`, kind: 'views' };
  if (text.includes('comment')) return { key: 'keyword-comments', title: `${p} : Comments`, kind: 'comments' };
  if (text.includes('follower') || text.includes('subscriber')) return { key: 'keyword-followers', title: `${p} : Followers / Subscribers`, kind: 'followers' };
  if (text.includes('like') || text.includes('reaction')) return { key: 'keyword-likes', title: `${p} : Likes / Reactions`, kind: 'likes' };
  if (text.includes('share') || text.includes('repost')) return { key: 'keyword-repost', title: `${p} : Repost / Shares`, kind: 'repost' };

  return { key: 'keyword-other', title: `${p} : Other`, kind: 'other' };
}

function sanitizeId(text) {
  return String(text)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'GENERAL';
}

function toDoubledPrice(rate) {
  const n = Number(rate || 0);
  const doubled = n * 2;
  return doubled.toFixed(4).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

function esc(str) {
  return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

(async () => {
  if (!config.fampage.apiKey) {
    throw new Error('FAMPAGE_API_KEY missing in backend/.env');
  }

  const url = `${config.fampage.baseUrl}?action=services&key=${config.fampage.apiKey}`;
  const response = await axios.get(url);
  const services = Array.isArray(response.data) ? response.data : [];

  const grouped = {};

  for (const service of services) {
    const networkId = detectPlatform(service);
    const categoryMeta = getCategoryForService(networkId, service);
    const kindStyle = colorForCategory[categoryMeta.kind] || colorForCategory.other;
    const categoryIcon = iconForCategory[categoryMeta.kind] || 'Play';

    if (!grouped[networkId]) grouped[networkId] = {};
    if (!grouped[networkId][categoryMeta.key]) {
      grouped[networkId][categoryMeta.key] = {
        id: `${networkId}-${sanitizeId(categoryMeta.key)}`,
        title: categoryMeta.title,
        description: `${categoryMeta.title} packages`,
        icon: categoryIcon,
        color: kindStyle.color,
        bg: kindStyle.bg,
        packages: [],
      };
    }

    grouped[networkId][categoryMeta.key].packages.push({
      id: String(service.service),
      name: String(service.name || ''),
      price: toDoubledPrice(service.rate),
      minQuantity: typeof service.min === 'number' ? service.min : undefined,
      maxQuantity: typeof service.max === 'number' ? service.max : undefined,
    });
  }

  const requiredIcons = new Set();
  Object.values(platformMeta).forEach(p => requiredIcons.add(p.icon));
  Object.values(grouped).forEach((catMap) => {
    Object.values(catMap).forEach((cat) => requiredIcons.add(cat.icon));
  });

  const iconOrder = [
    'Play', 'Share2', 'MessageCircle', 'Heart', 'Eye', 'Users', 'Vote',
    'Globe', 'Instagram', 'Youtube', 'Facebook', 'Linkedin', 'Twitter',
  ];
  const finalIcons = iconOrder.filter(i => requiredIcons.has(i));

  const importBlock = `import {\n${finalIcons.map(i => `    ${i},`).join('\n')}\n} from 'lucide-react';\n\n`;

  const networksBlock = `export const networks = [\n${Object.entries(platformMeta)
    .map(([id, p]) => `    { id: '${id}', title: '${p.title}', icon: ${p.icon} },`)
    .join('\n')}\n];\n\n`;

  const interfacesBlock = `export interface ServicePackage {\n    id: string;\n    name: string;\n    price: string;\n    description?: string;\n    minQuantity?: number;\n    maxQuantity?: number;\n}\n\nexport interface ServiceCategory {\n    id: string;\n    title: string;\n    description: string;\n    icon: any;\n    color: string;\n    bg: string;\n    packages?: ServicePackage[];\n}\n\n`;

  const networkKeys = Object.keys(platformMeta);
  let servicesBlock = 'export const servicesData: Record<string, ServiceCategory[]> = {\n';

  for (const networkId of networkKeys) {
    const categories = grouped[networkId] ? Object.values(grouped[networkId]) : [];
    const orderedKeys = categoryOrderByNetwork[networkId] || [];
    categories.sort((a, b) => {
      const aKey = String(a.id).replace(`${networkId}-`, '').toLowerCase();
      const bKey = String(b.id).replace(`${networkId}-`, '').toLowerCase();
      const ai = orderedKeys.indexOf(aKey);
      const bi = orderedKeys.indexOf(bKey);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.title.localeCompare(b.title);
    });
    for (const c of categories) {
      c.packages.sort((a, b) => Number(a.id) - Number(b.id));
    }

    servicesBlock += `    "${networkId}": [\n`;

    for (const c of categories) {
      servicesBlock += '        {\n';
      servicesBlock += `            id: "${esc(c.id)}",\n`;
      servicesBlock += `            title: "${esc(c.title)}",\n`;
      servicesBlock += `            description: "${esc(c.description)}",\n`;
      servicesBlock += `            icon: ${c.icon},\n`;
      servicesBlock += `            color: "${c.color}",\n`;
      servicesBlock += `            bg: "${c.bg}",\n`;
      servicesBlock += '            packages: [\n';

      for (const p of c.packages) {
        servicesBlock += '                { ';
        servicesBlock += `id: "${esc(p.id)}", name: "${esc(p.name)}", price: "${p.price}"`;
        if (typeof p.minQuantity === 'number') servicesBlock += `, minQuantity: ${p.minQuantity}`;
        if (typeof p.maxQuantity === 'number') servicesBlock += `, maxQuantity: ${p.maxQuantity}`;
        servicesBlock += ' },\n';
      }

      servicesBlock += '            ]\n';
      servicesBlock += '        },\n';
    }

    servicesBlock += '    ],\n';
  }

  servicesBlock += '};\n';

  const finalContent = importBlock + networksBlock + interfacesBlock + servicesBlock;
  fs.writeFileSync(outputPath, finalContent, 'utf8');

  const totalIds = services.length;
  console.log(`Regenerated services.ts with ${totalIds} live IDs and doubled prices.`);
})();
