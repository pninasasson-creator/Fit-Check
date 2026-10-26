import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '35mb' }));

// Initialize Gemini client with telemetry header
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Endpoint: Health check & config status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Endpoint: Analyze outfit photo to detect items, brands, coordinates, and assign stable item_ids
app.post('/api/analyze-fit', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', previousWardrobeItems = [] } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required.' });
    }

    if (!ai) {
      // Fallback response if Gemini API key is not present in local test environment
      return res.json({
        success: true,
        items: [
          {
            item_id: 'item_top_ribbed_knit_sweater',
            category: 'top',
            description: 'minimalist neutral oversized top',
            brand: '',
            confidence: 'medium',
            x: 50,
            y: 35,
            source: 'ai',
          },
          {
            item_id: 'item_bottoms_tailored_trousers',
            category: 'bottoms',
            description: 'relaxed tailored trousers',
            brand: '',
            confidence: 'medium',
            x: 50,
            y: 65,
            source: 'ai',
          },
          {
            item_id: 'item_shoes_leather_footwear',
            category: 'shoes',
            description: 'casual leather footwear',
            brand: '',
            confidence: 'low',
            x: 50,
            y: 90,
            source: 'ai',
          },
        ],
      });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const wardrobeContext = previousWardrobeItems.length > 0
      ? `\n\nUSER'S PREVIOUSLY TAGGED WARDROBE ITEMS:
${JSON.stringify(previousWardrobeItems.slice(0, 50), null, 2)}
When you detect an item in the photo, compare it carefully to these previous wardrobe items (category, description, brand, color, silhouette).
- If the detected piece matches an existing piece in the user's wardrobe, assign its exact 'item_id' and if that piece had a user-entered brand, you may retain it.
- If it is a new piece not found in the wardrobe, generate a new stable 'item_id' formatted as item_<category>_<short_slug>_<random4hex> (e.g. "item_top_creamsweater_9a2b").`
      : `\nFor each detected piece, generate a stable 'item_id' formatted as item_<category>_<short_slug>_<random4hex> (e.g. "item_top_creamsweater_9a2b").`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: `You are an expert precision fashion archivist and garment analyzer.
Analyze this outfit photo and detect ONLY clearly visible, distinct clothing items and fashion accessories worn by the person (e.g. tops, sweaters, blazers, jackets, coats, jeans, trousers, skirts, boots, sneakers, loafers, heels, bags).${wardrobeContext}

CRITICAL ACCURACY & NO-HALLUCINATION RULES:
1. DO NOT GUESS OR INVENT BRANDS: Never guess or assume a brand or specific product model based on styling, aesthetic, or looks. ONLY return a brand if an authentic brand name, text, or trademark logo is clearly and unmistakably visible in the photo. Otherwise, brand MUST BE AN EMPTY STRING ("").
2. ACCURATE VISIBLE DESCRIPTIONS: Describe each item precisely by what is physically visible: type, color, length/shape/silhouette, and material/texture (e.g., 'tall black leather knee-high boots', not 'sneakers'; 'cream ribbed knit crewneck sweater'; 'charcoal pleated high-waist wide-leg trousers'; 'vintage wash relaxed straight-leg denim jeans'). Never misclassify garment types (e.g. boots vs sneakers).
3. HIGH CONFIDENCE ONLY: Only tag items you are confident about and clearly distinguishable. Skip anything blurry, occluded, ambiguous, or uncertain instead of guessing.
4. COORDINATES: Provide accurate center percentage coordinates x (0-100) and y (0-100).

Return only a valid JSON array of items matching the schema.`,
          },
        ],
      },
      config: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              item_id: {
                type: Type.STRING,
                description: 'Stable wardrobe item ID linking the piece across fits',
              },
              category: {
                type: Type.STRING,
                description: "One of 'top', 'bottoms', 'shoes', 'outerwear', 'bag', 'accessory'",
              },
              description: {
                type: Type.STRING,
                description: 'Accurate physical description: type, color, length/shape, and material',
              },
              brand: {
                type: Type.STRING,
                description: 'Visible brand name or logo ONLY if clearly legible on the garment, otherwise empty string ""',
              },
              confidence: {
                type: Type.STRING,
                description: "'high' or 'medium'",
              },
              x: {
                type: Type.INTEGER,
                description: 'Horizontal center coordinate percentage (0-100)',
              },
              y: {
                type: Type.INTEGER,
                description: 'Vertical center coordinate percentage (0-100)',
              },
            },
            required: ['item_id', 'category', 'description', 'brand', 'confidence', 'x', 'y'],
          },
        },
      },
    });

    const text = response.text || '[]';
    let items = [];
    try {
      items = JSON.parse(text);
    } catch {
      items = [];
    }

    // Filter out low confidence or blurry items; sanitize descriptions
    const validItems = (Array.isArray(items) ? items : []).filter(
      (item: any) => item.confidence !== 'low' && Boolean(item.description && item.description.trim())
    );

    const formattedItems = validItems.map((item: any) => {
      const cat = item.category || 'top';
      const descSlug = (item.description || 'piece')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .slice(0, 16);
      const fallbackId = `item_${cat}_${descSlug}_${Math.random().toString(36).substring(2, 6)}`;

      return {
        item_id: item.item_id || fallbackId,
        category: cat,
        description: item.description.trim(),
        brand: (item.brand || '').trim(), // Clean brand; empty if not visible
        confidence: item.confidence || 'high',
        x: Math.max(5, Math.min(95, Number(item.x) || 50)),
        y: Math.max(5, Math.min(95, Number(item.y) || 50)),
        source: 'ai',
      };
    });

    return res.json({ success: true, items: formattedItems });
  } catch (err: any) {
    console.error('Error analyzing fit:', err);
    return res.status(500).json({
      error: 'Failed to analyze fit with AI.',
      details: err?.message || String(err),
    });
  }
});

// Endpoint: Compare newly tagged items with previously tagged wardrobe items using Gemini
app.post('/api/match-wardrobe-items', async (req, res) => {
  try {
    const { newItems = [], previousWardrobeItems = [] } = req.body;

    if (!Array.isArray(newItems) || newItems.length === 0) {
      return res.json({ success: true, matchedItems: [] });
    }

    // Algorithmic fallback matcher
    const runLocalMatch = () => {
      return newItems.map((newItem: any) => {
        // If already has valid item_id, keep it
        if (newItem.item_id && !newItem.item_id.startsWith('temp_')) {
          return newItem;
        }

        const newCat = (newItem.category || '').toLowerCase();
        const newBrand = (newItem.brand || '').trim().toLowerCase();
        const newDesc = (newItem.description || '').toLowerCase();

        // Find candidate in previousWardrobeItems
        let bestMatch: any = null;
        for (const prev of previousWardrobeItems) {
          const prevCat = (prev.category || '').toLowerCase();
          const prevBrand = (prev.brand || '').trim().toLowerCase();
          const prevDesc = (prev.description || '').toLowerCase();

          if (prevCat && newCat && prevCat !== newCat) continue;

          // Strong match: same brand and similar description
          if (newBrand && prevBrand && newBrand === prevBrand) {
            const words = newDesc.split(/\s+/).filter((w: string) => w.length > 2);
            const matches = words.filter((w: string) => prevDesc.includes(w)).length;
            if (matches >= 1) {
              bestMatch = prev;
              break;
            }
          }

          // Description keyword overlap
          const words = newDesc.split(/\s+/).filter((w: string) => w.length > 3);
          const matches = words.filter((w: string) => prevDesc.includes(w)).length;
          if (words.length > 0 && matches >= Math.min(2, words.length)) {
            bestMatch = prev;
            break;
          }
        }

        if (bestMatch && bestMatch.item_id) {
          return {
            ...newItem,
            item_id: bestMatch.item_id,
          };
        }

        // Generate stable new item_id
        const cat = newItem.category || 'piece';
        const brandSlug = newBrand ? `${newBrand.replace(/[^a-z0-9]+/g, '')}_` : '';
        const descSlug = newDesc.replace(/[^a-z0-9]+/g, '_').slice(0, 14);
        const randomHex = Math.random().toString(36).substring(2, 6);
        return {
          ...newItem,
          item_id: `item_${cat}_${brandSlug}${descSlug}_${randomHex}`,
        };
      });
    };

    if (!ai || previousWardrobeItems.length === 0) {
      return res.json({ success: true, matchedItems: runLocalMatch() });
    }

    const prompt = `You are a wardrobe memory archivist. Compare each newly tagged clothing item to the user's previously tagged wardrobe items.
Determine whether each item is the exact same piece the user already owns (matching category, brand, and garment description/color/silhouette).

NEW ITEMS TO CLASSIFY:
${JSON.stringify(newItems, null, 2)}

PREVIOUSLY TAGGED WARDROBE ITEMS:
${JSON.stringify(previousWardrobeItems.slice(0, 60), null, 2)}

Instructions:
1. For each item in NEW ITEMS, decide if it matches an item in PREVIOUSLY TAGGED WARDROBE ITEMS.
2. If it is the same piece, set 'item_id' to that existing item's 'item_id'.
3. If it is a new piece, keep its existing 'item_id' if provided, or generate a stable 'item_id' formatted as: item_<category>_<brandOrSlug>_<4hex> (e.g. item_top_zara_knit_3k9a).
4. Return a JSON array of objects with 'index' (0-based matching input array) and 'item_id'.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              index: { type: Type.INTEGER },
              item_id: { type: Type.STRING },
            },
            required: ['index', 'item_id'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    const idMap = new Map<number, string>();
    if (Array.isArray(parsed)) {
      parsed.forEach((m: any) => {
        if (typeof m.index === 'number' && m.item_id) {
          idMap.set(m.index, m.item_id);
        }
      });
    }

    const localMatched = runLocalMatch();
    const finalMatched = newItems.map((item: any, idx: number) => {
      const geminiId = idMap.get(idx);
      return {
        ...item,
        item_id: geminiId || localMatched[idx]?.item_id || item.item_id,
      };
    });

    return res.json({ success: true, matchedItems: finalMatched });
  } catch (err: any) {
    console.error('Error in /api/match-wardrobe-items:', err);
    // Graceful fallback
    const fallback = (req.body.newItems || []).map((it: any) => ({
      ...it,
      item_id: it.item_id || `item_${it.category || 'top'}_${Math.random().toString(36).substring(2, 8)}`,
    }));
    return res.json({ success: true, matchedItems: fallback });
  }
});

// Endpoint: Generate Google Shopping search queries for each tag
// Rule: Use the user-entered brand if there is one, otherwise the description.
app.post('/api/generate-search-queries', async (req, res) => {
  try {
    const { items = [] } = req.body;

    if (!items.length) {
      return res.json({ success: true, searchQueries: [] });
    }

    const searchQueries = items.map((it: any) => {
      const brand = (it.brand || '').trim();
      const desc = (it.description || '').trim();
      if (brand && desc) {
        return `${brand} ${desc}`;
      }
      return desc || it.category || 'clothing';
    });

    return res.json({ success: true, searchQueries });
  } catch (err: any) {
    console.error('Error generating search queries:', err);
    const fallbackQueries = (req.body.items || []).map((it: any) => {
      const brand = (it.brand || '').trim();
      const desc = (it.description || '').trim();
      return brand ? `${brand} ${desc}` : desc || 'garment';
    });
    return res.json({ success: true, searchQueries: fallbackQueries });
  }
});

// Setup Vite development server or serve static dist in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`Fit Check server running on port ${port}`);
  });
}

startServer();
