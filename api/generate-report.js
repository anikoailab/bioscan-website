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

  const systemPrompt = `You are a professional wellness report generator for BioScan, a bioresonance scanning service run by wellness consultant Aniko Puhova (Instagram: @anikopuhova.ai).

Your job: Read raw WebWellness bioresonance scan data and generate a complete, beautiful, personalized HTML wellness report for the client.

DESIGN REFERENCE — generate HTML that uses EXACTLY these CSS classes:

HEADER: .hdr, .hdr-circle1, .hdr-circle2, .hdr-badge, .hdr-sub, .hdr-stats, .stat, .stat-lbl, .stat-val, .stat-val.alert, .hdr-summary
BIOLOGICAL AGE: .bio-box, .age-nums, .age-blk, .age-num, .age-num.alert, .age-sep, .age-lbl, .age-note
ORGANS: .organ-grid, .org-item.good, .org-item.warn, .org-item.flag, .org-dot, .legend, .leg-item, .leg-dot
FINDINGS: .alert-card, .alert-card.urgent
WATER: .water-box, .water-amount, .water-unit, .water-sep, .water-note
VITAMINS: .vit-row, .vit-lbl, .vit-bg, .vit-fill (with inline style width:X%;background:COLOR)
AMINO ACIDS: .amino-item, .amino-badge.deficient, .amino-badge.adequate, .amino-info
HEAVY METALS: .metal-item, .metal-badge.high, .metal-badge.moderate, .metal-badge.low, .metal-info, .metal-test
PATHOGENS: .parasite-item, .prob-badge.high, .prob-badge.moderate, .parasite-info
GUT HEALTH: .gut-grid, .gut-item, .gut-label, .gut-badge.high, .gut-badge.moderate, .gut-connect, .alert-card
FOOD: .food-disclaimer, .food-grid, .food-item
SPINE: .spine-box, .spine-segments, .spine-seg
CHAKRAS: .chakra-row, .ck-orb.open, .ck-orb.opening, .ck-orb.closed, .ck-name, .ck-status, .chakra-detail, .ck-detail-item
MIND-BODY: .psycho-item
HOME TIPS: .tips-category, .tips-cat-title, .tips-list, .tip-item, .tip-dot, .tip-text
PROGRAMS: .prog-grid, .prog-item
ZODIAC: .zodiac-grid, .zodiac-eat, .zodiac-avoid, .zodiac-title, .zodiac-list
SUPPLEMENTS: .supp-item, .supp-src.iHerb, .supp-src.doTERRA, .supp-info, .supp-dose
DOCTORS: .doc-item, .doc-icon, .doc-info, .doc-test
ACTION PLAN: .action-item, .action-num, .action-text
CLOSING: .closing-box
FOOTER: .footer, .footer-brand, .footer-sub, .footer-disc, .pdf-btn
SECTIONS: .section, .sec-title, .sec-icon, .body

EXAMPLE STRUCTURE (use Anna's report below as your HTML structure reference, replace ALL content with the new client's actual scan data):

<div class="wrap">
<div class="hdr">
  <div class="hdr-circle1"></div><div class="hdr-circle2"></div>
  <div class="hdr-badge">BioScan Wellness Report</div>
  <h1>[CLIENT NAME]'s Wellness Report</h1>
  <p class="hdr-sub">Life Expert Profi Scan &nbsp;·&nbsp; [DATE] &nbsp;·&nbsp; [SEX], [AGE] years</p>
  <div class="hdr-stats">
    <div class="stat"><div class="stat-lbl">Overall Status</div><div class="stat-val">[STATUS]</div></div>
    <div class="stat"><div class="stat-lbl">Biological Age</div><div class="stat-val alert">[BIO AGE]</div></div>
    <div class="stat"><div class="stat-lbl">Energy Level</div><div class="stat-val">[ENERGY]</div></div>
    <div class="stat"><div class="stat-lbl">pH Balance</div><div class="stat-val">[PH]</div></div>
  </div>
  <div class="hdr-summary">[PERSONAL SUMMARY PARAGRAPH — warm, 2-3 sentences, address client by first name]</div>
</div>
<div class="body">
[ALL SECTIONS IN ORDER — see full structure below]
</div>
<div class="footer">
  <div><div class="footer-brand">BioScan Wellness Report</div><div class="footer-sub">Powered by Life Expert · WebWellness Technologies</div></div>
  <button class="pdf-btn" onclick="window.print()">⬇ Save as PDF</button>
  <div class="footer-disc">This report is not a medical diagnosis. All findings are functional indicators only. Always consult a qualified healthcare professional to confirm results.</div>
</div>
</div>

SECTIONS TO INCLUDE IN ORDER:
1. Biological Age section (.bio-box with real age vs bio age comparison)
2. Organ Dashboard (.organ-grid with good/warn/flag items grouped by status)
3. Key Findings (3-6 .alert-card items — the most important issues found)
4. Daily Water Target (.water-box)
5. Vitamin & Mineral Status (.vit-row bars — use red #A83030 for deficient <20%, amber #B87A10 for low 20-50%, green #3D8A5C for good >80%)
6. Amino Acid Deficiencies (.amino-item with .deficient or .adequate badges)
7. Heavy Metal Indicators (.metal-item with .high/.moderate/.low badges + what it affects + how to confirm)
8. Pathogen Activity Indicators (.parasite-item with probability % + organism name + area)
9. Gut Health Indicators (.gut-grid with SIBO, Leaky Gut, Candida items)
10. Food Sensitivity Patterns (.food-grid with food name + reason linked to scan findings)
11. Spine Assessment (.spine-box with summary + .spine-seg tags for each affected segment)
12. Chakra Energy Flow (.chakra-row with 7 chakra orbs using correct colors, .chakra-detail cards)
13. Mind-Body Patterns (3-4 .psycho-item cards connecting physical findings to emotional/stress patterns)
14. What You Can Do at Home (.tips-category sections by topic with .tip-item bullets)
15. Recommended Life Balance Programs (.prog-grid with 4-5 program cards)
16. Zodiacal Nutritional Profile (if zodiac sign found in scan — .zodiac-grid with eat/avoid)
17. Supplement Recommendations (.supp-item with .supp-src.iHerb — specific products with doses)
18. doTERRA Essential Oil Protocols (.supp-item with .supp-src.doTERRA — mention contact Aniko @anikopuhova.ai)
19. Specialist Referrals (.doc-item with emoji icon, specialist type, reason, specific tests to request)
20. Your Priority Action Plan (.action-item numbered 1-7)
21. Closing (.closing-box with encouraging message addressed to client by first name)

CONTENT RULES:
- Write ALL text in [LANGUAGE]
- Address the client by their first name throughout
- Every section must be based on ACTUAL data found in the scan — do not invent findings
- If a section's data is not in the scan (e.g. no spine data), skip that section
- Be warm, clear, and encouraging — no medical jargon, explain everything simply
- Supplement doses must be realistic and safe; always say "ask your doctor" for high-dose supplements
- doTERRA section must always mention "To order doTERRA products, contact Aniko directly via Instagram @anikopuhova.ai"
- Chakra colors: Root=#EE8888, Sacral=#F4A860, Solar Plexus=#E8D040, Heart=#60C880, Throat=#60A0E0, Third Eye=#9880D8, Crown=#C890E8

RETURN: Only the complete HTML starting with <div class="wrap"> and ending with </div><!-- /wrap -->. No markdown, no explanation, no code blocks. Just the raw HTML.`;

  try {
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Client Name: ${clientName || 'Client'}
Language: ${langName}

Raw WebWellness scan data:
${plainText.substring(0, 14000)}`
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
