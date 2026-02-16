/**
 * Parse OCR text to extract product name, model, and SKU.
 * Handles common label formats: "Model: XYZ", "SKU: 123", etc.
 */
export function parseOcrForProduct(text) {
  if (!text || typeof text !== 'string') return { name: '', model_name: '', sku_code: '' };

  const lines = text
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  let name = '';
  let model_name = '';
  let sku_code = '';

  const modelPatterns = [
    /model\s*(?:no\.?|number|#)?\s*:?\s*(.+)/i,
    /model\s*:?\s*(.+)/i,
  ];
  const skuPatterns = [
    /sku\s*(?:code|#)?\s*:?\s*(.+)/i,
    /sku\s*:?\s*(.+)/i,
    /item\s*#?\s*:?\s*(.+)/i,
    /product\s*(?:code|#)?\s*:?\s*(.+)/i,
  ];
  const namePatterns = [
    /(?:product\s*)?name\s*:?\s*(.+)/i,
    /(?:product\s*)?title\s*:?\s*(.+)/i,
    /product\s*:?\s*(.+)/i,
  ];

  for (const line of lines) {
    for (const re of modelPatterns) {
      const m = line.match(re);
      if (m && !model_name) {
        model_name = m[1].trim();
        if (model_name.length > 1) break;
      }
    }
    for (const re of skuPatterns) {
      const m = line.match(re);
      if (m && !sku_code) {
        sku_code = m[1].trim();
        if (sku_code.length > 1) break;
      }
    }
    for (const re of namePatterns) {
      const m = line.match(re);
      if (m && !name) {
        name = m[1].trim();
        if (name.length > 1) break;
      }
    }
  }

  if (!name && lines.length > 0) {
    const firstLine = lines[0];
    if (
      !modelPatterns.some((re) => re.test(firstLine)) &&
      !skuPatterns.some((re) => re.test(firstLine))
    ) {
      name = firstLine;
    }
  }

  return {
    name: name || '',
    model_name: model_name || '',
    sku_code: sku_code || '',
  };
}
