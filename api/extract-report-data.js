export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reportLink, rawReportText, clientName } = req.body;

  let reportContent = rawReportText;

  // If no raw text provided, try to fetch from link
  if (!reportContent && reportLink) {
    try {
      const response = await fetch(reportLink);
      if (!response.ok) {
        return res.status(400).json({
          error: 'Could not fetch report link',
          message: 'The provided link could not be accessed. Please paste the raw report text instead.'
        });
      }
      reportContent = await response.text();
    } catch (error) {
      return res.status(400).json({
        error: 'Failed to fetch report',
        message: 'Could not access the report link. Please paste the raw report text as a fallback.'
      });
    }
  }

  if (!reportContent) {
    return res.status(400).json({
      error: 'No report data provided',
      message: 'Please provide either a WebWellness link or paste the raw report text.'
    });
  }

  try {
    const extractedData = extractReportData(reportContent, clientName);
    return res.status(200).json(extractedData);
  } catch (error) {
    console.error('Error extracting report data:', error);
    return res.status(500).json({
      error: 'Failed to parse report',
      message: 'Could not extract data from the report. Please verify the content is a valid WebWellness report.'
    });
  }
}

function extractReportData(content, clientName) {
  // Clean content
  content = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  const data = {
    clientName: clientName,
    testDate: extractTestDate(content) || new Date().toLocaleDateString(),
    age: extractAge(content),
    sex: extractSex(content),
    generalCondition: extractGeneralCondition(content),
    biologicalAge: extractBiologicalAge(content),
    energyLevel: extractValue(content, 'energy|энергия|energía|energia'),
    phBalance: extractValue(content, 'ph balance|ph баланс|balance ph'),
    waterTarget: extractValue(content, 'water|вода|agua|víz'),
    organs: extractOrgans(content),
    vitamins: extractVitamins(content),
    minerals: extractMinerals(content),
    aminoAcids: extractAminoAcids(content),
    heavyMetals: extractHeavyMetals(content),
    pathogens: extractPathogens(content),
    gutHealth: extractGutHealth(content),
    foodSensitivities: extractFoodSensitivities(content),
    spineAssessment: extractSpineAssessment(content),
    chakraEnergy: extractChakras(content),
    mindBodyPatterns: extractMindBodyPatterns(content),
    recommendations: extractRecommendations(content)
  };

  return data;
}

function extractTestDate(content) {
  const datePatterns = [
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/,
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
    /(\w+ \d{1,2},? \d{4})/i
  ];

  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractAge(content) {
  const match = content.match(/(?:age|возраст|edad|kor)[:=\s]*(\d+)/i);
  return match ? parseInt(match[1]) : null;
}

function extractSex(content) {
  if (/\b(female|woman|женщина|mujer|nő|nő)\b/i.test(content)) return 'Female';
  if (/\b(male|man|мужчина|hombre|férfi)\b/i.test(content)) return 'Male';
  return null;
}

function extractGeneralCondition(content) {
  const match = content.match(/general\s+condition[:=\s]*([^,.\n]+)/i);
  return match ? match[1].trim() : null;
}

function extractBiologicalAge(content) {
  const match = content.match(/biological\s+age[:=\s]*(\d+)/i);
  return match ? parseInt(match[1]) : null;
}

function extractValue(content, pattern) {
  const regex = new RegExp(`${pattern}[:=\\s]*([0-9.]+)`, 'i');
  const match = content.match(regex);
  return match ? parseFloat(match[1]) : null;
}

function extractOrgans(content) {
  const organs = {};
  const organNames = [
    'liver', 'kidney', 'heart', 'lungs', 'brain', 'pancreas',
    'spleen', 'stomach', 'intestines', 'colon', 'bladder', 'thyroid',
    'adrenal', 'prostate', 'uterus', 'ovaries', 'skin', 'bone'
  ];

  organNames.forEach(organ => {
    const pattern = new RegExp(`${organ}[:=\\s]*([0-9.]+)`, 'i');
    const match = content.match(pattern);
    if (match) organs[organ] = parseFloat(match[1]);
  });

  return organs;
}

function extractVitamins(content) {
  const vitamins = {};
  const vitaminNames = [
    'vitamin a', 'vitamin b1', 'vitamin b2', 'vitamin b3', 'vitamin b5',
    'vitamin b6', 'vitamin b12', 'vitamin c', 'vitamin d', 'vitamin e', 'vitamin k',
    'folate', 'biotin', 'choline'
  ];

  vitaminNames.forEach(vitamin => {
    const pattern = new RegExp(`${vitamin}[:=\\s]*([0-9.]+)`, 'i');
    const match = content.match(pattern);
    if (match) vitamins[vitamin] = parseFloat(match[1]);
  });

  return vitamins;
}

function extractMinerals(content) {
  const minerals = {};
  const mineralNames = [
    'calcium', 'magnesium', 'iron', 'zinc', 'copper', 'manganese',
    'selenium', 'iodine', 'chromium', 'potassium', 'sodium', 'phosphorus'
  ];

  mineralNames.forEach(mineral => {
    const pattern = new RegExp(`${mineral}[:=\\s]*([0-9.]+)`, 'i');
    const match = content.match(pattern);
    if (match) minerals[mineral] = parseFloat(match[1]);
  });

  return minerals;
}

function extractAminoAcids(content) {
  const acids = {};
  const acidNames = [
    'arginine', 'lysine', 'methionine', 'leucine', 'isoleucine',
    'valine', 'phenylalanine', 'tryptophan', 'threonine', 'histidine',
    'cysteine', 'tyrosine', 'alanine', 'aspartate', 'glutamate', 'serine'
  ];

  acidNames.forEach(acid => {
    const pattern = new RegExp(`${acid}[:=\\s]*([0-9.]+)`, 'i');
    const match = content.match(pattern);
    if (match) acids[acid] = parseFloat(match[1]);
  });

  return acids;
}

function extractHeavyMetals(content) {
  const metals = {};
  const metalNames = ['mercury', 'lead', 'cadmium', 'arsenic', 'aluminum', 'nickel'];

  metalNames.forEach(metal => {
    const pattern = new RegExp(`${metal}[:=\\s]*([0-9.]+)`, 'i');
    const match = content.match(pattern);
    if (match) metals[metal] = parseFloat(match[1]);
  });

  return metals;
}

function extractPathogens(content) {
  const pathogens = [];
  const pathogenPatterns = [
    /(?:bacteria|virus|fungus|parasite|pathogen)[:=\s]*([^,.\n]+)/gi
  ];

  pathogenPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1]) pathogens.push(match[1].trim());
    }
  });

  return [...new Set(pathogens)];
}

function extractGutHealth(content) {
  const gutKeywords = ['gut', 'microbiome', 'intestinal', 'digestive', 'flora', 'dysbiosis'];
  const gutPattern = new RegExp(gutKeywords.join('|'), 'i');
  if (gutPattern.test(content)) {
    return {
      indicated: true,
      details: extractSentenceContaining(content, gutKeywords[0])
    };
  }
  return { indicated: false };
}

function extractFoodSensitivities(content) {
  const sensitivities = [];
  const foodItems = [
    'gluten', 'dairy', 'eggs', 'nuts', 'shellfish', 'fish', 'soy',
    'wheat', 'corn', 'sugar', 'caffeine', 'alcohol', 'histamine'
  ];

  foodItems.forEach(food => {
    const pattern = new RegExp(`sensitivity|intolerance|reaction.*${food}|${food}.*sensitivity`, 'i');
    if (pattern.test(content)) {
      sensitivities.push(food.charAt(0).toUpperCase() + food.slice(1));
    }
  });

  return sensitivities;
}

function extractSpineAssessment(content) {
  const spineKeywords = ['spine', 'vertebra', 'cervical', 'lumbar', 'thoracic', 'posture'];
  const spinePattern = new RegExp(spineKeywords.join('|'), 'i');
  if (spinePattern.test(content)) {
    return {
      indicated: true,
      details: extractSentenceContaining(content, spineKeywords[0])
    };
  }
  return { indicated: false };
}

function extractChakras(content) {
  const chakras = {};
  const chakraNames = ['root', 'sacral', 'solar plexus', 'heart', 'throat', 'third eye', 'crown'];

  chakraNames.forEach(chakra => {
    const pattern = new RegExp(`${chakra}[:\\s]*([0-9.]+)`, 'i');
    const match = content.match(pattern);
    if (match) chakras[chakra] = parseFloat(match[1]);
  });

  return chakras;
}

function extractMindBodyPatterns(content) {
  const patterns = [];
  const emotionKeywords = ['stress', 'anxiety', 'depression', 'sleep', 'fatigue', 'energy', 'mood', 'focus'];

  emotionKeywords.forEach(keyword => {
    if (new RegExp(keyword, 'i').test(content)) {
      patterns.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  });

  return patterns;
}

function extractRecommendations(content) {
  const recommendations = [];
  const recommendationPatterns = [
    /recommend[ation]*:?\s*([^.!?\n]+[.!?])/gi,
    /suggest[ion]*:?\s*([^.!?\n]+[.!?])/gi,
    /consider:?\s*([^.!?\n]+[.!?])/gi
  ];

  recommendationPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1] && match[1].length > 10) {
        recommendations.push(match[1].trim());
      }
    }
  });

  return recommendations.slice(0, 10);
}

function extractSentenceContaining(content, keyword) {
  const sentences = content.match(/[^.!?]*[.!?]/g) || [];
  const sentence = sentences.find(s => new RegExp(keyword, 'i').test(s));
  return sentence ? sentence.trim() : null;
}
