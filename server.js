const express = require('express');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';
const DATA_DIR = path.join(__dirname, 'data');
const VISITORS_FILE = path.join(DATA_DIR, 'visitors.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(VISITORS_FILE)) fs.writeFileSync(VISITORS_FILE, '[]');

function getVisitors() {
  try { return JSON.parse(fs.readFileSync(VISITORS_FILE, 'utf8')); }
  catch { return []; }
}

function saveVisitors(data) {
  fs.writeFileSync(VISITORS_FILE, JSON.stringify(data, null, 2));
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function callGroq(systemPrompt, userMessage, maxTokens) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.8,
      max_tokens: maxTokens,
    }),
  });
  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Groq API returned ${response.status}: ${errBody}`);
  }
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

app.post('/api/generate', async (req, res) => {
  const {
    topic,
    tone = 'professional',
    platform = 'Instagram',
    emojis = true,
    captionLength = 'medium',
    captionCount = 4,
    hashtagCount = 20,
    language = 'English',
    keywords = '',
    brandVoice = '',
  } = req.body;

  if (!topic || topic.trim().length === 0) {
    return res.status(400).json({ error: 'Please describe your content topic first.' });
  }

  const cc = Math.min(Math.max(Number(captionCount) || 4, 1), 100);
  const hc = Math.min(Math.max(Number(hashtagCount) || 20, 1), 50);

  const ht = Math.round(hc * 0.4);
  const nn = Math.round(hc * 0.35);
  const ll = hc - ht - nn;

  const toneGuide = {
    professional: 'Polished, authoritative, and industry-credible.',
    funny: 'Witty, humorous, and meme-worthy. Use light-hearted jokes.',
    inspirational: 'Uplifting, motivational, and emotionally compelling.',
    storytelling: 'Narrative-driven with a beginning, middle, and hook.',
    hype: 'High-energy, bold, and hype-building. Use emojis and excitement.',
  };

  const lengthGuide = {
    'very short': '10-40 characters. Extremely brief, punchy, and concise. Just a few words.',
    short: '40-80 characters. Short and to the point, minimal wording.',
    medium: '80-160 characters. Balanced length, standard social media caption.',
    long: '160-280 characters. Detailed and descriptive captions.',
    'very long': '280-500 characters. In-depth, comprehensive captions with rich detail.',
  };
  const lengthRule = lengthGuide[captionLength] || lengthGuide.medium;

  const emojiRule = emojis
    ? 'Use relevant emojis in captions to boost engagement.'
    : 'Do NOT use any emojis in captions. Keep them clean and text-only.';

  const langRule = `Write all captions and hashtags in ${language}.`;
  const keywordRule = keywords
    ? `Naturally include these keywords in the captions: "${keywords}".`
    : '';
  const voiceRule = brandVoice
    ? `Follow this brand voice/style: ${brandVoice}.`
    : '';

  const systemPrompt = `You are a professional social media marketing expert and copywriter.

Generate exactly ${cc} ${platform}-optimized social media captions in a "${tone}" tone.
Tone guide: ${toneGuide[tone] || toneGuide.professional}
${emojiRule}
${langRule}
${keywordRule}
${voiceRule}

Also generate exactly ${hc} relevant hashtags split into three groups:
- "highTraffic": Broad, popular tags (${ht} tags)
- "niche": Topic-specific, targeted tags (${nn} tags)
- "location": Location or community tags (${ll} tags)

IMPORTANT: Return ONLY valid JSON — no markdown, no code fences, no extra text:
{
  "captions": [
    { "id": 1, "text": "caption text here" },
    { "id": 2, "text": "caption text here" }
  ],
  "hashtags": {
    "highTraffic": ["#tag1", "#tag2", ...],
    "niche": ["#tag3", "#tag4", ...],
    "location": ["#tag5", "#tag6", ...]
  }
}

Rules for captions:
- Creative, engaging, and conversational.
- Tone must be strictly "${tone}": ${toneGuide[tone] || toneGuide.professional}
- Make them specific to ${platform} platform style.
- Caption length: ${lengthRule}
- No hashtags inside captions.
- Write in ${language}.
- Generate exactly ${cc} captions.

Rules for hashtags:
- highTraffic: exactly ${ht} broad popular tags.
- niche: exactly ${nn} specific relevant tags.
- location: exactly ${ll} community/location tags.
- Each prefixed with #, no commas.
- Generate exactly ${hc} hashtags total.`;

  const maxTokens = Math.min(400 + cc * 60 + hc * 8, 8000);

  try {
    const raw = await callGroq(systemPrompt, topic, maxTokens);
    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) data = JSON.parse(jsonMatch[0]);
      else throw new Error('Failed to parse AI response');
    }

    if (!data.captions || !Array.isArray(data.captions) || data.captions.length < 1) {
      throw new Error('Invalid captions format from AI');
    }

    let h = data.hashtags;
    if (Array.isArray(h)) {
      const a = Math.ceil(h.length * 0.4), b = Math.ceil(h.length * 0.35);
      h = { highTraffic: h.slice(0, a), niche: h.slice(a, a + b), location: h.slice(a + b) };
    } else if (h && typeof h === 'object') {
      const all = [...(h.highTraffic || []), ...(h.niche || []), ...(h.location || [])];
      if (all.length > 0 && (!h.highTraffic?.length || !h.niche?.length || !h.location?.length)) {
        const a = Math.ceil(all.length * 0.4), b = Math.ceil(all.length * 0.35);
        h = { highTraffic: all.slice(0, a), niche: all.slice(a, a + b), location: all.slice(a + b) };
      }
    } else {
      h = { highTraffic: [], niche: [], location: [] };
    }
    data.hashtags = h;

    res.json(data);
  } catch (err) {
    console.error('Groq API error:', err.message);
    res.status(500).json({
      error: 'Failed to generate content. Please check your API key and try again.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

app.post('/api/variation', async (req, res) => {
  const { text, direction } = req.body;
  if (!text || !direction) {
    return res.status(400).json({ error: 'Missing text or direction' });
  }

  const promptMap = {
    longer: 'Make this caption LONGER by adding more detail, context, or descriptive language. Keep the same tone and message. Return ONLY the new caption text.',
    shorter: 'Make this caption SHORTER and more concise. Cut fluff while keeping the core message. Return ONLY the new caption text.',
    funnier: 'Rewrite this caption to be FUNNIER and more humorous. Add wit, wordplay, or a light-hearted twist. Return ONLY the new caption text.',
  };

  const systemPrompt = promptMap[direction] || promptMap.longer;

  try {
    const raw = await callGroq(systemPrompt, `Original caption: "${text}"`, 300);
    const cleaned = raw.replace(/^["']|["']$/g, '').trim();
    if (!cleaned || cleaned.length < 3) throw new Error('Empty response');
    res.json({ text: cleaned });
  } catch (err) {
    console.error('Variation error:', err.message);
    res.status(500).json({ error: 'Failed to generate variation.', text });
  }
});

app.post('/api/track', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const visitors = getVisitors();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const entry = { name, ip, timestamp: new Date().toISOString() };
  visitors.push(entry);
  saveVisitors(visitors);
  console.log(`👤 Visitor: ${name} from ${ip} (total: ${visitors.length})`);
  res.json({ ok: true, total: visitors.length });
});

app.get('/api/visitors', (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized. Use ?key=your-admin-key' });
  }
  const visitors = getVisitors();
  const unique = [...new Set(visitors.map(v => v.name.toLowerCase()))].length;
  res.json({ total: visitors.length, unique, visitors });
});

app.get('/admin', (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(401).send('Unauthorized');
  }
  const visitors = getVisitors();
  const unique = [...new Set(visitors.map(v => v.name.toLowerCase()))];
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Visitors</title><style>body{font-family:sans-serif;background:#f4f6f9;padding:20px;color:#1e293b}table{border-collapse:collapse;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)}th{background:#f1f5f9;text-align:left;padding:12px;font-size:12px;text-transform:uppercase;color:#475569}td{padding:12px;border-top:1px solid #e2e8f0;font-size:14px}.badge{display:inline-block;background:#eff6ff;color:#2563eb;padding:2px 10px;border-radius:20px;font-size:13px;font-weight:600}h1{font-size:24px;margin-bottom:4px}.sub{color:#64748b;font-size:14px;margin-bottom:20px}</style></head><body>
  <h1>👥 Visitor Analytics</h1>
  <p class="sub">Total visits: ${visitors.length} · Unique people: ${unique.length}</p>
  <table><thead><tr><th>Name</th><th>IP</th><th>Time</th></tr></thead><tbody>
  ${visitors.slice().reverse().map(v => `<tr><td>${v.name}</td><td>${v.ip}</td><td>${new Date(v.timestamp).toLocaleString()}</td></tr>`).join('')}
  </tbody></table></body></html>`);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✨ AI Caption Genie running at http://localhost:${PORT}`);
});
