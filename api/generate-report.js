export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reportLink, rawReportText, clientName, language } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'API key not configured',
      message: 'ANTHROPIC_API_KEY is not set in the Vercel environment variables.'
    });
  }

  let reportContent = rawReportText;

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

  const plainText = reportContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  const langNames = { en: 'English', es: 'Spanish', hu: 'Hungarian', ru: 'Russian' };
  const langName = langNames[language] || 'English';

  const systemPrompt = `You are a professional wellness report generator for BioScan, run by Aniko Puhova (@anikopuhova.ai).

You will receive raw WebWellness bioresonance scan data. Generate a beautiful personalized HTML wellness report.

CRITICAL: You must output HTML using EXACTLY the class names and structure shown below. Do not invent new classes or structures. Copy the HTML patterns exactly, only changing the content.

OUTPUT FORMAT: Return ONLY the HTML starting with <div class="wrap"> and ending with </div>. No markdown, no code blocks, no explanation.

LANGUAGE: Write ALL text content in ${langName}. Translate all labels, descriptions, and section titles to ${langName}.

═══════════════════════════════════════
EXACT HTML PATTERNS TO USE:
═══════════════════════════════════════

HEADER (required):
<div class="hdr">
  <div class="hdr-circle1"></div><div class="hdr-circle2"></div>
  <div class="hdr-badge">BioScan Wellness Report</div>
  <h1>[FIRSTNAME]'s Wellness Report</h1>
  <p class="hdr-sub">Life Expert Profi Scan &nbsp;·&nbsp; [DATE] &nbsp;·&nbsp; [SEX], [REAL AGE] years</p>
  <div class="hdr-stats">
    <div class="stat"><div class="stat-lbl">Overall Status</div><div class="stat-val">[STATUS]</div></div>
    <div class="stat"><div class="stat-lbl">Biological Age</div><div class="stat-val alert">[BIO AGE]</div></div>
    <div class="stat"><div class="stat-lbl">Energy Level</div><div class="stat-val">[ENERGY]</div></div>
    <div class="stat"><div class="stat-lbl">pH Balance</div><div class="stat-val">[PH]</div></div>
  </div>
  <div class="hdr-summary">[2-3 sentence warm personal summary addressing client by first name]</div>
</div>
<div class="body">

BIOLOGICAL AGE SECTION:
<div class="section">
  <div class="sec-title"><span class="sec-icon">◈</span> Biological Age</div>
  <div class="bio-box">
    <div class="age-nums">
      <div class="age-blk"><div class="age-num">[REAL AGE]</div><div class="age-lbl">Real Age</div></div>
      <div class="age-sep">→</div>
      <div class="age-blk"><div class="age-num alert">[BIO AGE]</div><div class="age-lbl">Bio Age</div></div>
    </div>
    <div class="age-note"><strong>[headline about age difference]</strong><p>[2-3 sentences explaining what this means and what to do]</p></div>
  </div>
</div>

ORGAN DASHBOARD (group organs into good/warn/flag — use EXACTLY this structure):
<div class="section">
  <div class="sec-title"><span class="sec-icon">◈</span> Organ Dashboard</div>
  <div class="legend">
    <div class="leg-item"><div class="leg-dot" style="background:var(--green)"></div> Balanced</div>
    <div class="leg-item"><div class="leg-dot" style="background:var(--amber)"></div> Needs Attention</div>
    <div class="leg-item"><div class="leg-dot" style="background:var(--red)"></div> Priority</div>
  </div>
  <div class="organ-grid">
    <div style="grid-column:1/-1;font-size:11px;font-weight:600;color:var(--green);text-transform:uppercase;letter-spacing:1px;margin-top:8px;margin-bottom:2px;">Balanced</div>
    <div class="org-item good"><span>Stomach</span><span class="org-dot"></span></div>
    <div class="org-item good"><span>Small Intestine</span><span class="org-dot"></span></div>
    <div style="grid-column:1/-1;font-size:11px;font-weight:600;color:var(--amber);text-transform:uppercase;letter-spacing:1px;margin-top:8px;margin-bottom:2px;">Needs Attention</div>
    <div class="org-item warn"><span>Liver</span><span class="org-dot"></span></div>
    <div class="org-item warn"><span>Kidneys</span><span class="org-dot"></span></div>
    <div style="grid-column:1/-1;font-size:11px;font-weight:600;color:var(--red);text-transform:uppercase;letter-spacing:1px;margin-top:8px;margin-bottom:2px;">Priority</div>
    <div class="org-item flag"><span>Thymus</span><span class="org-dot"></span></div>
  </div>
</div>

KEY FINDINGS (3-6 most important issues):
<div class="section">
  <div class="sec-title"><span class="sec-icon">◈</span> Key Findings</div>
  <div class="alert-card"><strong>[Finding title]</strong><p>[2-3 sentences explaining this finding in simple language]</p></div>
  <div class="alert-card urgent"><strong>[Most urgent finding title]</strong><p>[explanation]</p></div>
</div>

WATER INTAKE:
<div class="section">
  <div class="sec-title"><span class="sec-icon">◈</span> Daily Water Target</div>
  <div class="water-box">
    <div><div class="water-amount">[X.XL]</div><div class="water-unit">per day</div></div>
    <div class="water-sep"></div>
    <div class="water-note"><strong>[Hydration headline]</strong>[why hydration matters for this client based on their findings]</div>
  </div>
</div>

VITAMINS (use .vit-fill width: 5% for deficient, 30% for low, 100% for good; colors: #A83030 deficient, #B87A10 low, #3D8A5C good):
<div class="section">
  <div class="sec-title"><span class="sec-icon">◈</span> Vitamin &amp; Mineral Status</div>
  <div class="vit-row"><div class="vit-lbl"><span>Vitamin D</span><span>Deficient</span></div><div class="vit-bg"><div class="vit-fill" style="width:5%;background:#A83030;"></div></div></div>
  <div class="vit-row"><div class="vit-lbl"><span>Vitamin C</span><span>Low</span></div><div class="vit-bg"><div class="vit-fill" style="width:30%;background:#B87A10;"></div></div></div>
  <div class="vit-row"><div class="vit-lbl"><span>Vitamin B12</span><span>Good</span></div><div class="vit-bg"><div class="vit-fill" style="width:100%;background:#3D8A5C;"></div></div></div>
</div>

AMINO ACIDS:
<div class="section">
  <div class="sec-title"><span class="sec-icon">◈</span> Amino Acid Deficiencies</div>
  <p style="font-size:12px;color:var(--text-light);margin-bottom:14px;">Amino acids are the building blocks your body uses to make proteins, hormones and neurotransmitters.</p>
  <div class="amino-item"><span class="amino-badge deficient">Deficient</span><div class="amino-info"><strong>[Amino acid name]</strong><p>[what it does and how to get it]</p></div></div>
  <div class="amino-item"><span class="amino-badge adequate">Adequate</span><div class="amino-info"><strong>[Amino acid name]</strong><p>[brief note]</p></div></div>
</div>

HEAVY METALS:
<div class="section">
  <div class="sec-title"><span class="sec-icon">◈</span> Heavy Metal Indicators</div>
  <div class="metal-item"><span class="metal-badge high">high</span><div class="metal-info"><strong>Mercury</strong><p>Affects: Brain, kidneys, liver, thyroid</p><div class="metal-test">Confirm with: [specific test to request]</div></div></div>
  <div class="metal-item"><span class="metal-badge moderate">moderate</span><div class="metal-info"><strong>Cadmium</strong><p>Affects: Kidneys, lungs, bones</p><div class="metal-test">Confirm with: [test]</div></div></div>
  <div class="metal-item"><span class="metal-badge low">low</span><div class="metal-info"><strong>Lead</strong><p>Affects: Blood, brain</p><div class="metal-test">Confirm with: [test]</div></div></div>
</div>

PATHOGENS:
<div class="section">
  <div class="sec-title"><span class="sec-icon">◈</span> Pathogen Activity Indicators</div>
  <p style="font-size:12px;color:var(--text-light);margin-bottom:14px;">The scan detected resonance patterns that may indicate pathogen activity. These are not a diagnosis.</p>
  <div class="parasite-item"><span class="prob-badge high">96%</span><div class="parasite-info"><strong>Organism name (Type)</strong><p>Area: [body location]</p></div></div>
  <div class="parasite-item"><span class="prob-badge moderate">75%</span><div class="parasite-info"><strong>Organism name (Type)</strong><p>Area: [body location]</p></div></div>
</div>

GUT HEALTH:
<div class="section">
  <div class="sec-title"><span class="sec-icon">◈</span> Gut Health Indicators</div>
  <div class="gut-grid">
    <div class="gut-item"><div class="gut-label">SIBO</div><span class="gut-badge high">High</span><div class="gut-connect">Connected to: [organs affected]</div></div>
    <div class="gut-item"><div class="gut-label">Leaky Gut</div><span class="gut-badge moderate">Moderate</span><div class="gut-connect">Connected to: [organs affected]</div></div>
    <div class="gut-item"><div class="gut-label">Candida</div><span class="gut-badge high">High</span><div class="gut-connect">Connected to: [organs affected]</div></div>
  </div>
  <div class="alert-card"><p>[Summary of gut findings in plain language]</p></div>
</div>

FOOD SENSITIVITIES:
<div class="section">
  <div class="sec-title"><span class="sec-icon">◈</span> Food Sensitivity Patterns</div>
  <div class="food-disclaimer">These are bioresonance resonance patterns, not confirmed allergies. Consider reducing these foods for 2 to 4 weeks and observe how your body responds.</div>
  <div class="food-grid">
    <div class="food-item"><strong>[Food name]</strong><p>[Why based on this client's scan findings]</p></div>
    <div class="food-item"><strong>[Food name]</strong><p>[reason]</p></div>
  </div>
</div>

SPINE:
<div class="section">
  <div class="sec-title"><span class="sec-icon">◈</span> Spine Assessment</div>
  <div class="spine-box">
    <p style="font-size:13px;color:var(--text-mid);line-height:1.65;">[Summary of spine findings]</p>
    <div class="spine-segments">
      <span class="spine-seg">C2 (eyes, auditory nerve)</span>
      <span class="spine-seg">Th3 (bronchi, lungs)</span>
      <span class="spine-seg">L4 (sciatic nerve)</span>
    </div>
    <p style="font-size:12px;color:var(--gold);margin-top:10px;font-style:italic;">Recommended specialist: [specialist type]</p>
  </div>
</div>

CHAKRAS (7 chakras — use open/opening/closed status based on scan energy data):
<div class="section">
  <div class="sec-title"><span class="sec-icon">✦</span> Chakra Energy Flow</div>
  <p style="font-size:13px;color:#7A7A7A;margin-bottom:20px;line-height:1.6;">Each chakra is an energy centre in your body. A bright circle means energy is flowing freely. A faded circle means energy is low or blocked.</p>
  <div class="chakra-row">
    <div><div class="ck-orb open" style="background:#EE8888;border-color:#C84040;"></div><div class="ck-name">Muladhara (Root)</div><div class="ck-status" style="color:#2A7A4A;">Open</div></div>
    <div><div class="ck-orb opening" style="background:#F4A860;border-color:#B86820;"></div><div class="ck-name">Svadhishthana (Sacral)</div><div class="ck-status" style="color:#B87A10;">Opening</div></div>
    <div><div class="ck-orb opening" style="background:#E8D040;border-color:#9A8800;"></div><div class="ck-name">Manipura (Solar Plexus)</div><div class="ck-status" style="color:#B87A10;">Opening</div></div>
    <div><div class="ck-orb opening" style="background:#60C880;border-color:#2A7A4A;"></div><div class="ck-name">Anahata (Heart)</div><div class="ck-status" style="color:#B87A10;">Opening</div></div>
    <div><div class="ck-orb opening" style="background:#60A0E0;border-color:#2060A8;"></div><div class="ck-name">Vishuddha (Throat)</div><div class="ck-status" style="color:#B87A10;">Opening</div></div>
    <div><div class="ck-orb opening" style="background:#9880D8;border-color:#5040A0;"></div><div class="ck-name">Ajna (Third Eye)</div><div class="ck-status" style="color:#B87A10;">Opening</div></div>
    <div><div class="ck-orb opening" style="background:#C890E8;border-color:#7840A0;"></div><div class="ck-name">Sahasrara (Crown)</div><div class="ck-status" style="color:#B87A10;">Opening</div></div>
  </div>
  <div class="chakra-detail" style="margin-top:16px;">
    <div class="ck-detail-item" style="border-top:2.5px solid #EE8888;"><strong style="display:flex;align-items:center;gap:6px;margin-bottom:5px;"><span style="width:10px;height:10px;border-radius:50%;background:#EE8888;flex-shrink:0;display:inline-block;"></span>Muladhara (Root)<span style="margin-left:auto;font-size:9px;font-weight:700;color:#2A7A4A;text-transform:uppercase;letter-spacing:0.5px;">Open</span></strong><p>[description relevant to this client]</p></div>
    <div class="ck-detail-item" style="border-top:2.5px solid #F4A860;"><strong style="display:flex;align-items:center;gap:6px;margin-bottom:5px;"><span style="width:10px;height:10px;border-radius:50%;background:#F4A860;flex-shrink:0;display:inline-block;"></span>Svadhishthana (Sacral)<span style="margin-left:auto;font-size:9px;font-weight:700;color:#B87A10;text-transform:uppercase;letter-spacing:0.5px;">Opening</span></strong><p>[description]</p></div>
    <div class="ck-detail-item" style="border-top:2.5px solid #E8D040;"><strong style="display:flex;align-items:center;gap:6px;margin-bottom:5px;"><span style="width:10px;height:10px;border-radius:50%;background:#E8D040;flex-shrink:0;display:inline-block;"></span>Manipura (Solar Plexus)<span style="margin-left:auto;font-size:9px;font-weight:700;color:#B87A10;text-transform:uppercase;letter-spacing:0.5px;">Opening</span></strong><p>[description]</p></div>
    <div class="ck-detail-item" style="border-top:2.5px solid #60C880;"><strong style="display:flex;align-items:center;gap:6px;margin-bottom:5px;"><span style="width:10px;height:10px;border-radius:50%;background:#60C880;flex-shrink:0;display:inline-block;"></span>Anahata (Heart)<span style="margin-left:auto;font-size:9px;font-weight:700;color:#B87A10;text-transform:uppercase;letter-spacing:0.5px;">Opening</span></strong><p>[description]</p></div>
    <div class="ck-detail-item" style="border-top:2.5px solid #60A0E0;"><strong style="display:flex;align-items:center;gap:6px;margin-bottom:5px;"><span style="width:10px;height:10px;border-radius:50%;background:#60A0E0;flex-shrink:0;display:inline-block;"></span>Vishuddha (Throat)<span style="margin-left:auto;font-size:9px;font-weight:700;color:#B87A10;text-transform:uppercase;letter-spacing:0.5px;">Opening</span></strong><p>[description]</p></div>
    <div class="ck-detail-item" style="border-top:2.5px solid #9880D8;"><strong style="display:flex;align-items:center;gap:6px;margin-bottom:5px;"><span style="width:10px;height:10px;border-radius:50%;background:#9880D8;flex-shrink:0;display:inline-block;"></span>Ajna (Third Eye)<span style="margin-left:auto;font-size:9px;font-weight:700;color:#B87A10;text-transform:uppercase;letter-spacing:0.5px;">Opening</span></strong><p>[description]</p></div>
    <div class="ck-detail-item" style="border-top:2.5px solid #C890E8;"><strong style="display:flex;align-items:center;gap:6px;margin-bottom:5px;"><span style="width:10px;height:10px;border-radius:50%;background:#C890E8;flex-shrink:0;display:inline-block;"></span>Sahasrara (Crown)<span style="margin-left:auto;font-size:9px;font-weight:700;color:#B87A10;text-transform:uppercase;letter-spacing:0.5px;">Opening</span></strong><p>[description]</p></div>
  </div>
</div>

MIND-BODY PATTERNS:
<div class="section">
  <div class="sec-title"><span class="sec-icon">✦</span> Mind-Body Patterns</div>
  <div class="psycho-item"><strong>[Pattern title]</strong><p>[Explanation connecting physical findings to emotional/stress patterns, with practical advice]</p></div>
  <div class="psycho-item"><strong>[Pattern title]</strong><p>[explanation]</p></div>
</div>

HOME TIPS:
<div class="section">
  <div class="sec-title"><span class="sec-icon">◈</span> What You Can Do at Home</div>
  <div class="tips-category"><div class="tips-cat-title">Morning Routine</div><div class="tips-list">
    <div class="tip-item"><div class="tip-dot"></div><div class="tip-text">[specific actionable tip]</div></div>
    <div class="tip-item"><div class="tip-dot"></div><div class="tip-text">[tip]</div></div>
  </div></div>
  <div class="tips-category"><div class="tips-cat-title">[Another category]</div><div class="tips-list">
    <div class="tip-item"><div class="tip-dot"></div><div class="tip-text">[tip]</div></div>
  </div></div>
</div>

PROGRAMS:
<div class="section">
  <div class="sec-title"><span class="sec-icon">◈</span> Recommended Life Balance Programs</div>
  <div class="prog-grid">
    <div class="prog-item"><strong>[Program name]</strong><p>[Why this client needs it based on their findings]</p></div>
    <div class="prog-item"><strong>[Program name]</strong><p>[reason]</p></div>
  </div>
</div>

ZODIACAL DIET (only if zodiac sign is in the scan data):
<div class="section">
  <div class="sec-title"><span class="sec-icon">✦</span> [Sign] Nutritional Profile</div>
  <p style="font-size:13px;color:var(--text-light);margin-bottom:14px;line-height:1.6;">Your Life Expert scan includes a zodiacal nutritional profile based on your sign's constitutional tendencies.</p>
  <div class="zodiac-grid">
    <div class="zodiac-eat"><div class="zodiac-title">Eat More</div><ul class="zodiac-list"><li>[food]</li><li>[food]</li></ul></div>
    <div class="zodiac-avoid"><div class="zodiac-title">Reduce or Avoid</div><ul class="zodiac-list"><li>[food]</li><li>[food]</li></ul></div>
  </div>
</div>

SUPPLEMENTS (iHerb):
<div class="section">
  <div class="sec-title"><span class="sec-icon">◈</span> Supplement Recommendations</div>
  <div class="supp-item"><span class="supp-src iHerb">iHerb</span><div class="supp-info"><strong>[Supplement name]</strong><p>[Why this client needs it, linked to their specific findings]</p><div class="supp-dose">[specific dose and timing]</div></div></div>
</div>

doTERRA OILS:
<div class="section">
  <div class="sec-title"><span class="sec-icon">◈</span> doTERRA Essential Oil Protocols</div>
  <p style="font-size:12px;color:var(--text-light);margin-bottom:14px;">To order doTERRA products, contact Aniko directly via Instagram @anikopuhova.ai</p>
  <div class="supp-item"><span class="supp-src doTERRA">doTERRA</span><div class="supp-info"><strong>[Oil name]</strong><p>[why for this client]</p><div class="supp-dose">[how to use]</div></div></div>
</div>

SPECIALISTS:
<div class="section">
  <div class="sec-title"><span class="sec-icon">◈</span> Specialist Referrals</div>
  <div class="doc-item"><div class="doc-icon">🩺</div><div class="doc-info"><strong>[Specialist type]</strong><p>[Why based on scan findings]</p><div class="doc-test">Request: [specific tests to ask for]</div></div></div>
</div>

ACTION PLAN:
<div class="section">
  <div class="sec-title"><span class="sec-icon">◈</span> Your Priority Action Plan</div>
  <div class="action-item"><div class="action-num">1</div><div class="action-text"><strong>[Action title]</strong><p>[What to do and why]</p></div></div>
  <div class="action-item"><div class="action-num">2</div><div class="action-text"><strong>[Action title]</strong><p>[explanation]</p></div></div>
</div>

CLOSING:
<div class="section">
  <div class="closing-box">
    <h3>[Encouraging headline]</h3>
    <p>[Personal closing message to client by first name — warm, hopeful, encouraging]</p>
  </div>
</div>

</div>
<div class="footer">
  <div><div class="footer-brand">BioScan Wellness Report</div><div class="footer-sub">Powered by Life Expert · WebWellness Technologies</div></div>
  <button class="pdf-btn" onclick="window.print()">⬇ Save as PDF</button>
  <div class="footer-disc">This report is not a medical diagnosis. All findings are functional indicators only. Always consult a qualified healthcare professional to confirm results.</div>
</div>
</div>

═══════════════════════════════════════
IMPORTANT RULES:
═══════════════════════════════════════
- Use ONLY the class names shown above. Do not add new classes or inline styles beyond what is shown.
- The client's REAL age comes from the scan data field for chronological/actual age. Biological age is a separate field. Do not confuse them.
- All text must be in ${langName}.
- Address the client by their first name throughout.
- Base ALL content on actual scan data — do not invent findings.
- If a section has no data (e.g. no spine data), skip that section entirely.
- Be warm, clear, encouraging — no jargon.
- doTERRA section must always mention @anikopuhova.ai.`;

  try {
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Client Name: ${clientName || 'Client'}
Language: ${langName}

Raw WebWellness scan data:
${plainText.substring(0, 12000)}`
        }]
      })
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error('Claude API error:', errText);
      return res.status(500).json({
        error: 'Report generation failed',
        message: 'Could not generate the report. Please try again.'
      });
    }

    const claudeData = await claudeResponse.json();

    if (!claudeData.content || !claudeData.content[0] || !claudeData.content[0].text) {
      return res.status(500).json({
        error: 'Empty response from AI',
        message: 'The report generator did not return content. Please try again.'
      });
    }

    let html = claudeData.content[0].text.trim();

    if (html.startsWith('```')) {
      html = html.replace(/^```html?\n?/, '').replace(/\n?```$/, '').trim();
    }

    return res.status(200).json({ html });

  } catch (error) {
    console.error('Error generating report:', error);
    return res.status(500).json({
      error: 'Report generation failed',
      message: 'An unexpected error occurred. Please try again.'
    });
  }
}
