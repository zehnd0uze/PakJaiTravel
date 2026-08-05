const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const content = fs.readFileSync('client/src/data/chiangDaoData.ts', 'utf8');
const regex = /id:\s*'([^']+)'[\s\S]*?nameTh:\s*'([^']+)'[\s\S]*?imageUrl:\s*'([^']+)'/g;
let match;
const places = [];

while ((match = regex.exec(content)) !== null) {
  if (match[3].includes('unsplash')) {
    places.push({ id: match[1], name: match[2] });
  }
}

console.log(`Found ${places.length} places to update.`);

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchWeb(query) {
  try {
    const res = await axios.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(res.data);
    const results = [];
    $('.result').each((i, el) => {
      const title = $(el).find('.result__title').text().trim();
      const url = $(el).find('.result__url').attr('href');
      const snippet = $(el).find('.result__snippet').text().trim();
      
      let actualUrl = url;
      if (url && url.startsWith('/l/?uddg=')) {
        actualUrl = decodeURIComponent(url.replace('/l/?uddg=', '').split('&')[0]);
      }
      
      if (actualUrl) {
        results.push({ title, url: actualUrl, snippet });
      }
    });
    return results;
  } catch(e) {
    console.error(`Error searching ${query}: ${e.message}`);
    return [];
  }
}

async function extractImageFromUrl(url) {
  try {
    const res = await axios.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' }, 
      timeout: 5000 
    });
    const $ = cheerio.load(res.data);
    let img = $('meta[property="og:image"]').attr('content');
    if (!img) {
      img = $('img').first().attr('src');
    }
    if (img && img.startsWith('http')) return img;
    return null;
  } catch(e) {
    return null;
  }
}

async function processPlaces() {
  const resultsData = {};
  
  // We process in small batches or sequentially to avoid rate limits
  for (const place of places) {
    console.log(`Searching for: ${place.name}`);
    
    let fbLink = '';
    let phone = '';
    let imgUrl = '';
    
    const results = await searchWeb(`${place.name} ดอยหลวงเชียงดาว`);
    
    const fbResult = results.find(r => r.url.includes('facebook.com'));
    if (fbResult) {
      fbLink = fbResult.url;
      const phoneMatch = fbResult.snippet.match(/0[0-9]{1,2}-[0-9]{3}-[0-9]{4}|0[0-9]{9}/);
      if (phoneMatch) phone = phoneMatch[0];
    }
    
    const blogResult = results.find(r => r.url.includes('readme.me') || r.url.includes('pantip.com') || r.url.includes('wongnai.com'));
    if (blogResult) {
      imgUrl = await extractImageFromUrl(blogResult.url);
    }
    
    resultsData[place.id] = {
      name: place.name,
      facebook: fbLink,
      phone: phone,
      image: imgUrl
    };
    
    console.log(`[${place.id}] FB: ${fbLink} | Phone: ${phone} | Img: ${imgUrl}`);
    await delay(3000);
  }
  
  fs.writeFileSync('scratch/real_data.json', JSON.stringify(resultsData, null, 2));
  console.log('Finished writing to scratch/real_data.json');
}

processPlaces();
