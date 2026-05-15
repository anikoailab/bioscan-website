export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reportLink } = req.body;

  if (!reportLink) {
    return res.status(400).json({ error: 'reportLink is required' });
  }

  try {
    // Fetch the scanner report from the external service
    const response = await fetch(reportLink);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch scanner report' });
    }

    const html = await response.text();

    // Parse the HTML to extract test data
    const data = extractScannerData(html);

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error parsing scanner report:', error);
    return res.status(500).json({ error: 'Failed to parse scanner report' });
  }
}

function extractScannerData(html) {
  // Extract data from the WebWellness scanner HTML response
  const data = {
    clientName: null,
    testDate: null,
    biologicalAge: null,
    generalSystemState: null,
    organs: {},
    vitamins: {},
    aminoAcids: {},
    heavyMetals: {},
    pathogens: {},
    chakras: {},
    foodSensitivities: [],
    recommendations: [],
    supplements: [],
    rawData: {}
  };

  try {
    // Try to parse as JSON if it contains JSON data
    const jsonMatch = html.match(/<script[^>]*>(.*?)<\/script>/s);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        if (jsonData && typeof jsonData === 'object') {
          data.rawData = jsonData;
          // Extract from JSON structure
          extractFromJSON(jsonData, data);
        }
      } catch (e) {
        // Not JSON, continue with regex parsing
      }
    }
  } catch (e) {
    console.log('Not JSON format');
  }

  // Extract from HTML text content regardless
  // Look for numerical values associated with health metrics
  const lines = html.split('\n');
  lines.forEach(line => {
    // Extract biological age
    if (line.match(/biological.*age|возраст.*\d+/i)) {
      const ageMatch = line.match(/(\d+)/);
      if (ageMatch && !data.biologicalAge) data.biologicalAge = parseInt(ageMatch[1]);
    }

    // Extract system state percentage
    if (line.match(/system.*state|общее.*состояние|général.*état/i)) {
      const stateMatch = line.match(/(\d+\.?\d*)\s*%?/);
      if (stateMatch && !data.generalSystemState) data.generalSystemState = parseFloat(stateMatch[1]);
    }
  });

  // Extract organ names and their assessment scores from HTML
  const organList = ['liver', 'kidney', 'heart', 'lungs', 'brain', 'pancreas',
                     'spleen', 'stomach', 'intestines', 'colon', 'bladder', 'thyroid',
                     'печень', 'почки', 'сердце', 'мозг', 'поджелудочная'];

  organList.forEach(organ => {
    const pattern = new RegExp(`(?:${organ}).*?(\\d+(?:\\.\\d+)?)`, 'i');
    const match = html.match(pattern);
    if (match) {
      data.organs[organ.toLowerCase()] = parseFloat(match[1]);
    }
  });

  // Extract any text content that looks like recommendations
  const recommendationPatterns = [
    /recommend[ation]*:?\s*([^<\n]+)/gi,
    /suggestion:?\s*([^<\n]+)/gi,
    /advice:?\s*([^<\n]+)/gi
  ];

  recommendationPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      if (match[1] && match[1].length > 10) {
        data.recommendations.push(match[1].trim());
      }
    }
  });

  // Log first 2000 chars to help with debugging structure
  console.log('Scanner HTML preview:', html.substring(0, 2000));

  return data;
}

function extractFromJSON(jsonData, data) {
  // Try to extract common fields from JSON structure
  if (jsonData.biological_age) data.biologicalAge = jsonData.biological_age;
  if (jsonData.biologicalAge) data.biologicalAge = jsonData.biologicalAge;
  if (jsonData.age) data.biologicalAge = jsonData.age;

  if (jsonData.system_state) data.generalSystemState = jsonData.system_state;
  if (jsonData.systemState) data.generalSystemState = jsonData.systemState;
  if (jsonData.generalHealth) data.generalSystemState = jsonData.generalHealth;

  // Extract organs if they exist as an object or array
  if (jsonData.organs && typeof jsonData.organs === 'object') {
    data.organs = { ...jsonData.organs };
  }

  if (jsonData.vitamins && typeof jsonData.vitamins === 'object') {
    data.vitamins = { ...jsonData.vitamins };
  }

  if (jsonData.recommendations && Array.isArray(jsonData.recommendations)) {
    data.recommendations = jsonData.recommendations;
  }
}
