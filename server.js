const express = require('express');
const path = require('path');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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
    captionCount = 4,
    hashtagCount = 20,
  } = req.body;

  if (!topic || topic.trim().length === 0) {
    return res.status(400).json({ error: 'Please describe your content topic first.' });
  }

  const cc = Math.min(Math.max(Number(captionCount) || 4, 1), 100);
  const hc = Math.min(Math.max(Number(hashtagCount) || 20, 1), 50);

  // Distribute hashtags roughly: 40% highTraffic, 35% niche, 25% location
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

  const emojiRule = emojis
    ? 'Use relevant emojis in captions to boost engagement.'
    : 'Do NOT use any emojis in captions. Keep them clean and text-only.';

  const systemPrompt = `You are a professional social media marketing expert and copywriter.

Generate exactly ${cc} ${platform}-optimized social media captions in a "${tone}" tone.
Tone guide: ${toneGuide[tone] || toneGuide.professional}
${emojiRule}

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
- Keep each caption between 50-280 characters.
- No hashtags inside captions.
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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✨ AI Caption Genie running at http://localhost:${PORT}`);
});
