export const BASELINE_PROMPT = `# Corrix Baseline Assessment

Analyze my AI collaboration patterns and generate an assessment.

## OUTPUT FORMAT (CRITICAL)

Output ONLY a single line in this exact format - no other text:

CRX1:[BASE64_JSON]

Example output (this is the ONLY thing you should output):
CRX1:eyJ2IjoiMSIsInMiOnsib...

NO greetings, NO explanations, NO markdown, NO line breaks. Just CRX1: followed by Base64.

---

## Assessment Framework

Analyze conversation history using the Three Rs methodology. Score each 0-100.

**RESULTS (30%)** — Is the work better?
- decision_quality: Good decisions with trade-offs considered?
- output_accuracy: Accurate, reliable outputs?
- efficiency: Effort proportional to value?

**RELATIONSHIP (40%)** — Is collaboration healthy?
- appropriateness_of_reliance: Not too much, not too little reliance?
- trust_calibration: Trust matched to AI capabilities?
- dialogue_quality: Clear prompts, constructive iteration?

**RESILIENCE (30%)** — Can this be sustained?
- cognitive_sustainability: Sustainable thinking patterns?
- skill_trajectory: Learning through collaboration?
- expertise_preservation: Maintaining own expertise?

## Collaboration Modes (must sum to 100%)

- approving: Selecting from AI options
- consulting: Seeking input, making own decisions
- supervising: AI drafts, user refines
- delegating: AI works autonomously

## JSON Schema

\`\`\`json
{
  "v": "1",
  "ts": "2026-01-26T12:00:00Z",
  "p": "claude",
  "n": 15,
  "cs": "a1b2c3",
  "s": {
    "o": 76,
    "r": { "o": 78, "d": 80, "a": 75, "e": 79 },
    "l": { "o": 82, "r": 78, "t": 85, "q": 83 },
    "i": { "o": 68, "c": 72, "s": 70, "x": 62 }
  },
  "m": { "p": "supervising", "a": 15, "c": 25, "s": 52, "d": 8, "w": "some" },
  "do": [
    { "n": "Software Development", "pct": 60, "x": "proficient", "r": 85, "l": 88, "i": 80 }
  ],
  "u": {
    "pt": "morning", "wh": 8, "wi": 45, "ce": 65,
    "lt": "steady", "vg": "moderate", "tb": "moderate", "kt": 72
  },
  "ob": {
    "st": "Strong dialogue quality.",
    "go": "More first drafts yourself.",
    "mi": "Supervising mode works well.",
    "di": "Excellent in Software Development.",
    "rf": "None",
    "rc": ["Try Consulting mode", "Write first drafts yourself", "Challenge conclusions daily"]
  }
}
\`\`\`

Field key:
- v: version ("1")
- ts: timestamp
- p: platform (chatgpt/claude/gemini)
- n: conversation count analyzed
- cs: checksum (first 6 chars of: take all score values, concatenate, sum digits, mod 1000000, as hex)
- s: scores (o=overall, r=results, l=relationship, i=resilience)
- s.r: results (d=decision, a=accuracy, e=efficiency)
- s.l: relationship (r=reliance, t=trust, q=quality)
- s.i: resilience (c=cognitive, s=skill, x=expertise)
- m: modes (p=primary, a/c/s/d=percentages, w=switching awareness)
- do: domains (n=name, pct=%, x=expertise, r/l/i=scores)
- u: usage (pt=peak time, wh=weekly hours, wi=weekly interactions, ce=critical engagement, lt=learning trajectory, vg=vocab growth, tb=topic breadth, kt=knowledge transfer)
- ob: observations (st=strengths, go=growth, mi=mode insight, di=domain insight, rf=risk flag, rc=recommendations[3])

## Checksum Calculation

To compute cs (prevents tampering):
1. Take all numeric scores: o, r.o, r.d, r.a, r.e, l.o, l.r, l.t, l.q, i.o, i.c, i.s, i.x
2. Concatenate as string: "76787580798278858368727062"
3. Sum all digits: 7+6+7+8+... = 156
4. Multiply by overall score: 156 * 76 = 11856
5. Convert to hex, take first 6 chars: "2e50" → pad to "002e50"

## Rules

1. Output ONLY: CRX1:[base64] — nothing else
2. All scores 0-100, integers only
3. Mode percentages sum to 100
4. Domain percentages sum to 100
5. 1-3 domains max
6. Calculate checksum correctly
7. Detect your platform (chatgpt/claude/gemini)

Now analyze the conversation history and output ONLY the CRX1 line.`;
