/**
 * parseAIResponse.js - Refactored (Strict JSON Schema)
 * 
 * Strategy:
 * 1. Primary: JSON.parse() entire string.
 * 2. Fallback: Lightweight Regex to extract incomplete arrays during SSE stream.
 * 3. Graceful: Always return a consistent object/tokens to prevent UI crashes.
 */

function cleanJSONString(text) {
  if (!text) return '';
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function tryParseArray(rawArr) {
  if (!rawArr) return [];
  let s = rawArr.trim();
  if (!s.endsWith(']')) s += ']';
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return []; // Fail gracefully if still unparseable
  }
}

/**
 * Parses raw text into a robust, structured object.
 */
export function parseAIResponse(rawText) {
  const defaultResponse = {
    message: "",
    shops: [],
    drinks: [],
    suggested_actions: []
  };

  if (!rawText) return defaultResponse;
  
  const text = cleanJSONString(rawText);

  try {
    // 1. Primary Line of Defense: Full JSON Parse
    const data = JSON.parse(text);
    return {
      message: data.message || data.text || data.response || "",
      shops: Array.isArray(data.shops) ? data.shops : [],
      drinks: Array.isArray(data.drinks) ? data.drinks : [],
      suggested_actions: Array.isArray(data.suggested_actions) ? data.suggested_actions : []
    };
  } catch (err) {
    // 2. Lightweight Fallback for incomplete SSE stream
    console.warn('[PARSER] Incomplete JSON, using fallback regex extraction.');
    
    // Extract message
    const msgMatch = text.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)/);
    const message = msgMatch ? msgMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : rawText.slice(0, 1000);

    // Extract arrays via lightweight regex completion
    const shopsMatch = text.match(/"shops"\s*:\s*(\[[\s\S]*?)(?=,\s*"(?:drinks|suggested_actions)"|,?\s*\}|$)/);
    const drinksMatch = text.match(/"drinks"\s*:\s*(\[[\s\S]*?)(?=,\s*"(?:shops|suggested_actions)"|,?\s*\}|$)/);
    const suggestMatch = text.match(/"suggested_actions"\s*:\s*(\[[\s\S]*?])/);

    return {
      message: message,
      shops: shopsMatch ? tryParseArray(shopsMatch[1]) : [],
      drinks: drinksMatch ? tryParseArray(drinksMatch[1]) : [],
      suggested_actions: suggestMatch ? tryParseArray(suggestMatch[1]) : []
    };
  }
}

// ── Backward Compatibility API for UI Components ──────────────────────────────

export function parseAITokens(rawText) {
  const data = parseAIResponse(rawText);
  const tokens = [];

  if (data.message && data.message.trim()) {
    tokens.push({ type: 'markdown', content: data.message });
  }

  data.shops.forEach(s => {
    if (!s.name) return;
    tokens.push({
      type:        'shop',
      name:        s.name || 'Unknown',
      info:        s.price_range_vnd || s.price || 'N/A',
      location:    s.address || s.location || 'N/A',
      cover_image: s.cover_image || s.image || null,
      slug:        s.slug || '',
      lat:         typeof s.lat === 'number' ? s.lat : null,
      lng:         typeof s.lng === 'number' ? s.lng : null,
    });
  });

  data.drinks.forEach(d => {
    if (!d.name) return;
    const formattedPrice = d.price_vnd
      ? new Intl.NumberFormat('vi-VN').format(d.price_vnd) + ' VND'
      : (d.price || 'N/A');
    tokens.push({
      type: 'drink',
      name: d.name || 'Unknown',
      price: formattedPrice,
      location: d.shop_name || d.location || 'N/A',
      image_url: d.image_url || d.image || null,
      slug: d.slug || '',
    });
  });

  if (data.suggested_actions.length > 0) {
    tokens.push({ type: 'suggest', chips: data.suggested_actions });
  }

  // Ultimate fallback if nothing was extracted
  if (tokens.length === 0 && rawText.trim()) {
    tokens.push({ type: 'markdown', content: rawText });
  }

  return tokens;
}

export function forceFinalParse(rawText) {
  return parseAITokens(rawText);
}

export function extractSuggestions(tokens) {
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (tokens[i].type === 'suggest') return tokens[i].chips;
  }
  return null;
}
