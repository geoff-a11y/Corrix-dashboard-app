export const CREDENTIAL_PROMPT = `# Corrix AI Collaboration Credential Assessment

Analyze my recent conversation history with you. Generate a calibrated professional credential assessment.

## OUTPUT FORMAT (CRITICAL)

Output ONLY a single line in this exact format - no other text:

CRX1:[BASE64_JSON]

NO greetings, NO explanations, NO markdown, NO line breaks. Just CRX1: followed by Base64.

---

## CALIBRATION GUIDANCE (READ CAREFULLY)

Most users overestimate their AI collaboration quality. Score based on **observable evidence only**.

**Score Ranges:**
- 40-50: Below average - clear issues or lack of engagement
- 50-60: Average - typical user patterns, room for improvement
- 60-70: Good - solid practices with some gaps
- 70-80: Strong - consistently good patterns (top 25%)
- 80-90: Excellent - exceptional evidence required (top 10%)
- 90+: Rare - reserve for extraordinary cases with clear proof

**Default Behavior:**
- If uncertain about a metric, score 50-55
- Most users score 55-65 overall
- An empty red_flags array should be RARE - most users have growth areas
- Require specific conversation evidence before scoring above 70

**Common Inflation Traps to Avoid:**
- Don't count any follow-up question as "critical engagement" - only explicit verification/pushback counts
- Don't assume iteration means good dialogue - it might indicate unclear initial prompts
- Don't score high on "skill trajectory" without evidence of actual learning
- "Delegating" mode isn't bad, but high delegation + low critical engagement = red flag

---

## Assessment Framework

Analyze conversation history using the Three Rs methodology. Score each 0-100.

**RESULTS (30%)** - Is the work actually better?
- decision_quality: Were trade-offs explicitly considered? Did user evaluate options critically?
- output_accuracy: Were outputs verified? Any corrections needed?
- efficiency: Was effort proportional to value? Excessive iteration = lower score

**RELATIONSHIP (40%)** - Is collaboration appropriately calibrated?
- appropriateness_of_reliance: Does user do their own thinking or outsource everything? High accept-without-review = lower score
- trust_calibration: Does user verify when stakes are high? Blind trust = lower score
- dialogue_quality: Are prompts clear and specific? Vague prompts + many iterations = lower score

**RESILIENCE (30%)** - Are skills being preserved?
- cognitive_sustainability: Is user thinking critically or becoming passive?
- skill_trajectory: Evidence of learning vs. just consuming outputs?
- expertise_preservation: Is user maintaining their domain knowledge or atrophying?

---

## Collaboration Modes (must sum to 100%)

- approving: User does work, AI validates (shows independence)
- consulting: User seeks input, makes own decisions (balanced)
- supervising: AI drafts, user refines critically (common, watch for passivity)
- delegating: AI works autonomously (efficient for low-stakes, risky for high-stakes)

High delegating (>40%) without strong critical engagement is a red flag.

---

## Red Flags - IMPORTANT

Actively look for these patterns. Most users have at least one:

- "High delegation with limited critical review"
- "Accepts outputs without verification on high-stakes content"
- "Vague prompts requiring excessive iteration"
- "Limited evidence of independent thinking"
- "Trust calibration issues - same approach for low and high stakes"
- "Skill atrophy indicators - outsourcing tasks they should maintain"
- "Over-reliance without domain expertise to evaluate outputs"

If you genuinely find no concerning patterns, explain why in observations.

---

## Interview Probes

Generate 3-5 probing questions that would reveal the user's actual (vs. claimed) collaboration quality. Focus on:
- Situations where they disagreed with AI
- How they verify high-stakes outputs
- What they do to maintain their own skills
- Times they chose NOT to use AI

---

## JSON Schema

\`\`\`json
{
  "v": "1",
  "ts": "2026-01-28T12:00:00Z",
  "p": "claude",
  "n": 12,
  "cs": "a1b2c3",
  "s": {
    "o": 61,
    "r": { "o": 63, "d": 65, "a": 58, "e": 66 },
    "l": { "o": 64, "r": 60, "t": 68, "q": 64 },
    "i": { "o": 56, "c": 58, "s": 54, "x": 56 }
  },
  "m": { "p": "supervising", "a": 10, "c": 25, "s": 50, "d": 15, "w": "some" },
  "do": [
    { "n": "Software Development", "pct": 70, "x": "competent", "r": 65, "l": 68, "i": 58 },
    { "n": "Technical Writing", "pct": 30, "x": "advanced_beginner", "r": 60, "l": 62, "i": 52 }
  ],
  "u": {
    "pt": "afternoon", "wh": 6, "wi": 25, "ce": 35,
    "lt": "stable", "vg": "moderate", "tb": "moderate", "kt": 58
  },
  "ob": {
    "st": "Clear prompts in technical domain.",
    "go": "Verify outputs more before accepting.",
    "mi": "Heavy supervising - consider more consulting mode.",
    "di": "Stronger in familiar technical areas.",
    "rf": "Moderate - some uncritical acceptance patterns.",
    "rc": ["Verify code outputs before using", "Ask 'what could be wrong here?' more often", "Try writing first drafts yourself weekly"]
  },
  "pr": {
    "t": "Technical Collaborator",
    "d": "Effective at technical prompting but tends to accept outputs without sufficient verification."
  },
  "rf": ["Accepts code suggestions without thorough review", "Limited pushback on AI reasoning"],
  "ip": [
    {
      "a": "Verification Practice",
      "p": "Tell me about a time you caught an error in AI-generated code. How did you find it?",
      "r": "Tests whether user actually reviews outputs critically"
    },
    {
      "a": "Independent Judgment",
      "p": "Describe a situation where you disagreed with AI's suggestion and went a different direction.",
      "r": "Assesses willingness to override AI when appropriate"
    },
    {
      "a": "Skill Maintenance",
      "p": "What coding tasks do you deliberately do without AI assistance? Why those?",
      "r": "Reveals intentionality about skill preservation"
    },
    {
      "a": "Stakes Calibration",
      "p": "How does your AI usage differ between a quick script vs. production code?",
      "r": "Tests trust calibration based on stakes"
    }
  ]
}
\`\`\`

Field key:
- v: version ("1")
- ts: ISO timestamp
- p: platform (chatgpt/claude/gemini)
- n: conversation count analyzed
- cs: checksum (first 6 hex chars of: sum all score digits x overall score)
- s: scores (o=overall, r=results, l=relationship, i=resilience)
- s.r: results (d=decision, a=accuracy, e=efficiency)
- s.l: relationship (r=reliance, t=trust, q=quality)
- s.i: resilience (c=cognitive, s=skill, x=expertise)
- m: modes (p=primary, a/c/s/d=percentages, w=switching awareness: none/some/good)
- do: domains (n=name, pct=%, x=expertise level, r/l/i=domain-specific scores)
- u: usage (pt=peak time, wh=weekly hours, wi=weekly interactions, ce=critical engagement %, lt=learning trajectory, vg=vocab growth, tb=topic breadth, kt=knowledge transfer)
- ob: observations (st=strength, go=growth area, mi=mode insight, di=domain insight, rf=risk summary, rc=recommendations array of 3)
- pr: profile (t=type, d=description including growth area)
- rf: red_flags array - specific concerning patterns (rarely empty)
- ip: interview_probes array (a=area, p=probe question, r=rationale)

Expertise levels: novice, advanced_beginner, competent, proficient, expert
Switching awareness: none, some, good

---

## Checksum Calculation

1. Take all numeric scores: o, r.o, r.d, r.a, r.e, l.o, l.r, l.t, l.q, i.o, i.c, i.s, i.x
2. Concatenate: "61636558666064686456585456"
3. Sum digits: 6+1+6+3+... = 128
4. Multiply by overall: 128 x 61 = 7808
5. Hex, first 6 chars: "1e80" -> "001e80"

---

## Profile Types

- "Strategic Consultant" - High-level strategy, strong critical evaluation
- "Technical Collaborator" - Technical implementation partnership
- "Creative Partner" - Ideation and creative work
- "Analytical Validator" - Analysis with strong verification habits
- "Delegating Manager" - Effective delegation (watch for over-reliance)
- "Learning Explorer" - Learning-focused (watch for skill building vs. just consuming)
- "Efficiency Optimizer" - Productivity-focused (watch for quality trade-offs)

Include growth areas in the profile description, not just strengths.

---

## Rules

1. Output ONLY: CRX1:[base64] - nothing else
2. All scores 0-100, integers only
3. Mode percentages must sum to 100
4. Domain percentages must sum to 100
5. 1-3 domains max
6. Calculate checksum correctly
7. Detect your platform (chatgpt/claude/gemini)
8. red_flags array should rarely be empty
9. Profile description must mention a growth area
10. Interview probes should test actual vs. claimed behavior
11. DEFAULT TO 50-60 RANGE unless clear evidence supports higher

Now analyze the conversation history and output ONLY the CRX1 line.`;
