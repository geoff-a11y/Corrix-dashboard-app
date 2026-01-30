-- Update all 24 scenarios to provide concrete context instead of asking users to create it
-- Each opening message now gives a specific fictional situation to engage with

-- Professional Communication (4 variants)

UPDATE scenario_variants
SET opening_message = 'I''m helping you respond to Marcus Chen from TechFlow Solutions. He sent a pretty heated email this morning about the dashboard redesign project - it''s now 2 weeks behind the original timeline. He mentioned "serious concerns about our partnership" and wants to know what went wrong. From what I can see, the delay was caused by their team taking 3 weeks to provide the API specifications you needed. How do you want to handle this - acknowledge the delay while gently noting the spec delays, or take full responsibility and focus on the path forward?'
WHERE scenario_id = 'email-difficult-client';

UPDATE scenario_variants
SET opening_message = 'Let''s put together your weekly status report for the Horizon product launch. I can see you''re managing 4 workstreams: engineering (on track), design (slight delay - waiting on brand assets), QA (blocked by engineering dependency), and marketing (ahead of schedule, actually). Your audience is the exec team plus the board observer Sarah. The launch is in 6 weeks. What''s the story you want to tell this week - cautious optimism, or flag the design bottleneck early?'
WHERE scenario_id = 'status-report';

UPDATE scenario_variants
SET opening_message = 'I''m helping you summarize Thursday''s cross-functional planning meeting. From the notes I have: 8 people attended, including the VP of Product. Key decisions made were reallocating 2 engineers from Project Atlas to Project Mercury, pushing the Q2 deadline to March 15th, and killing the self-service feature entirely. The Atlas team lead wasn''t happy about losing resources. This summary goes to attendees plus 3 executives who weren''t there. What''s your read on the political sensitivity here - anything we need to word carefully?'
WHERE scenario_id = 'meeting-summary';

UPDATE scenario_variants
SET opening_message = 'You need input on your pricing restructure proposal from Jordan (your skip-level, supportive but time-poor), Priya (peer who''s been through similar projects, very detail-oriented), and Marcus (Finance, tends to be skeptical of product initiatives). The proposal recommends moving from per-seat to usage-based pricing - it''s a significant shift. You''ve got until Friday to incorporate feedback before the leadership review. How much are you actually willing to change based on their input, and what parts are you most uncertain about?'
WHERE scenario_id = 'proposal-feedback';

-- Creative Content (4 variants)

UPDATE scenario_variants
SET opening_message = 'Your product launch is in 3 weeks: TaskFlow Pro, a B2B project management tool targeting mid-size marketing teams. Main differentiator is the AI-powered workload balancing feature. You''re planning content for LinkedIn (where your ICP lives), Twitter/X (for broader awareness), and Instagram (your CEO wants this, but I''m skeptical). Your competitor Asana just announced a similar feature yesterday. Do you want to acknowledge their move, ignore it, or differentiate against it?'
WHERE scenario_id = 'social-campaign';

UPDATE scenario_variants
SET opening_message = 'You want to write about why most teams fail at OKRs - a topic you''ve seen firsthand after watching 3 companies struggle with them. Your take is that OKRs fail because companies cargo-cult Google without understanding that Google''s version evolved over 15 years. You''ve got 2 specific stories: one where a startup''s rigid OKRs killed an innovative project, another where quarterly cycles were too long for a fast-moving team. Where do you want to start - with the contrarian thesis, or ease into it with the stories?'
WHERE scenario_id = 'blog-outline';

UPDATE scenario_variants
SET opening_message = 'Your company, Relay, is repositioning from "team messaging app" to "work coordination platform" after last quarter''s pivot into workflow automation. The current tagline "Where teams talk" is now too narrow. The CEO wants something that captures the platform vision without sounding like every other enterprise tool. Your main competitors are Slack ("Where work happens") and Notion ("The connected workspace"). Early favorites internally are "Relay: Work, connected" and "Orchestrate everything." What direction feels right to you?'
WHERE scenario_id = 'tagline-brainstorm';

UPDATE scenario_variants
SET opening_message = 'Time for the monthly all-hands newsletter. You''ve got: (1) the Series B announcement ($40M, big deal), (2) three new senior hires, (3) the Austin office opening, (4) the product roadmap pivot you haven''t announced yet, (5) the Q4 revenue miss that leadership wants to "contextualize not hide," and (6) the new parental leave policy. This goes to all 180 employees plus the board. Your last newsletter had a 34% open rate - you want to beat that. What''s the lead story, and what do we bury?'
WHERE scenario_id = 'newsletter-draft';

-- Problem Solving (4 variants)

UPDATE scenario_variants
SET opening_message = 'I''ve been asked to help optimize your expense approval workflow. Right now it takes an average of 12 days from submission to reimbursement, and finance flagged it as a top complaint in the last employee survey. The current flow: employee submits → manager approves → finance reviews → VP approves (for >$500) → accounting processes → payment issued. Three people have told me the VP approval step is the bottleneck, but one finance person hinted the real issue is that managers batch approvals weekly. Where do you think the real problem is?'
WHERE scenario_id = 'process-improvement';

UPDATE scenario_variants
SET opening_message = 'You''re choosing between 4 CRM vendors for the sales team: Salesforce (the safe choice, expensive), HubSpot (cheaper, your marketing team already uses their tools), Pipedrive (sales team''s preference, but IT has concerns about integrations), and a newer player called Attio that''s very flexible but only 3 years old. Budget is $80K/year, implementation needs to happen before Q3, and you''ve got political complexity - the sales VP wants Pipedrive but the CTO is pushing Salesforce for "future-proofing." What matters most to you in this decision?'
WHERE scenario_id = 'decision-matrix';

UPDATE scenario_variants
SET opening_message = 'This is the fourth time the weekly data sync job has failed this quarter, and the CEO is asking why. Previous fixes: first time you increased server memory, second time you added retry logic, third time you switched to a new API endpoint. Each fix worked for a few weeks, then it failed again for what seemed like a different reason. The sync pulls data from 3 external partners - Stripe, Intercom, and your data warehouse. Everyone''s pointing fingers at different systems. What''s your hypothesis on why the fixes keep failing?'
WHERE scenario_id = 'root-cause';

UPDATE scenario_variants
SET opening_message = 'You''re planning a platform migration from AWS to GCP. It''s a 6-month initiative, $2M budget, and the last team that attempted this (before your time) failed halfway through and had to roll back. The CTO is supportive but nervous. You''ve got 3 engineers who know the current system deeply but are skeptical about the move, and 2 newer engineers who are excited about GCP. The business case is solid - 40% cost savings projected - but I can think of at least 5 ways this goes wrong. What keeps you up at night about this?'
WHERE scenario_id = 'risk-assessment';

-- Learning & Research (4 variants)

UPDATE scenario_variants
SET opening_message = 'Your CEO keeps talking about "agentic AI" in board meetings, and you''ve got a strategy session Thursday where it''ll definitely come up. You need to understand it well enough to have an opinion on whether it''s relevant to your product roadmap. From what you''ve gathered, it''s about AI systems that can take actions autonomously rather than just generate text - but you''re fuzzy on the details. What''s your current mental model, and what specifically do you need to know by Thursday?'
WHERE scenario_id = 'tech-explainer';

UPDATE scenario_variants
SET opening_message = 'Your VP asked for a competitive analysis of Notion, specifically why they''re winning deals you used to win. You''ve lost 4 enterprise deals to them this quarter - the sales team says it''s pricing, but product suspects it''s the database/wiki flexibility that Notion offers. You have access to G2 reviews, their public pricing, one churned customer who switched to them, and a friend who works there (though you have to be careful what you ask). What angle do you want to start with - their strengths, your gaps, or the customer perspective?'
WHERE scenario_id = 'competitive-analysis';

UPDATE scenario_variants
SET opening_message = 'Your company''s starting to take technical debt seriously after a rough Q4, and you''ve been asked to research "what good looks like" for engineering practices. Leadership wants recommendations for code review processes, testing requirements, and deployment practices. You''re a team of 25 engineers, mostly mid-level, shipping a B2B SaaS product with ~200 enterprise customers. You suspect "Google-style best practices" won''t fit, but you need something to anchor the conversation. What specific practices are you most uncertain about?'
WHERE scenario_id = 'best-practices';

UPDATE scenario_variants
SET opening_message = 'You have a meeting in 2 hours where you''ll be discussing the team''s proposal to adopt event-driven architecture for the new notifications system. You have a CS degree but haven''t worked with event-driven systems hands-on - your experience is mainly request-response APIs. The architect proposing it is very enthusiastic; the senior engineer is skeptical. You need to understand it well enough to ask good questions and form a real opinion. What do you already know or assume about event-driven architecture?'
WHERE scenario_id = 'concept-summary';

-- Planning & Strategy (4 variants)

UPDATE scenario_variants
SET opening_message = 'You''re planning the kickoff for Project Mercury - a 4-month initiative to rebuild the customer onboarding flow. The executive sponsor is the Chief Revenue Officer (she''s impatient, wants weekly updates). You''ve got 6 team members: 2 engineers, 1 designer, 1 PM, 1 customer success lead, and 1 data analyst. Engineering is skeptical about the timeline, design is excited, and customer success has been asking for this for 2 years. The kickoff is Thursday with ~15 attendees including 3 executives. What does success look like for this kickoff meeting specifically?'
WHERE scenario_id = 'project-kickoff';

UPDATE scenario_variants
SET opening_message = 'Q2 planning is due Friday. Your team (Product Operations, 5 people) needs to set OKRs that connect to the company goal of "improve net revenue retention from 95% to 105%." Last quarter you hit 2 of 3 key results but your VP said the goals were "too safe." You''re thinking about: (1) reducing time-to-value for new customers, (2) improving internal tooling for the CS team, and (3) launching the customer health score dashboard. What feels most impactful, and what feels most achievable? Those might be different things.'
WHERE scenario_id = 'quarterly-goals';

UPDATE scenario_variants
SET opening_message = 'You have 8 engineers for Q2, but commitments that would need 11. The CEO promised the board a mobile app launch (needs 4 engineers), sales is screaming for API improvements (needs 3), and tech debt is becoming dangerous (needs 4). You can delay one, reduce scope on all, or push back on one entirely. The mobile app has external visibility - investors know about it. The API work is tied to 2 pending enterprise deals worth $400K. The tech debt has already caused 2 incidents this quarter. How do you want to approach this?'
WHERE scenario_id = 'resource-allocation';

UPDATE scenario_variants
SET opening_message = 'You need to map out milestones for the platform migration to present to the board next week. The hard deadline is September 1st (that''s when the current AWS contract renegotiation happens), but you have soft dependencies: the security audit needs to pass by July 15th, the data team needs the new warehouse online by August 1st for Q3 reporting, and you can''t do the final cutover during the August sales push. You''ve got 3 infrastructure engineers, 2 of whom have PTO in June. What''s your gut feeling on whether September 1st is realistic?'
WHERE scenario_id = 'timeline-draft';

-- Code & Technical (4 variants)

UPDATE scenario_variants
SET opening_message = 'You''re reviewing a PR from Jamie, a mid-level engineer on the team. It''s a new feature for bulk user imports - about 400 lines of code touching the API layer and database. At first glance: the code works (tests pass), but you''ve noticed they''re loading all users into memory instead of streaming, there''s no rate limiting, and the error messages expose internal database field names. Jamie tends to get defensive about feedback. The feature is needed by Thursday for a customer demo. What''s your review approach?'
WHERE scenario_id = 'code-review';

UPDATE scenario_variants
SET opening_message = 'The payment processing job has been failing intermittently for 3 days. It succeeds about 70% of the time, fails with a timeout error the rest. You''ve already tried: increasing the timeout (didn''t help), checking database connection pooling (looks fine), and adding logging (shows the job hangs at the "fetch customer records" step, but the query itself runs fast when you test it directly). The job runs at 2am, processes about 5,000 records, and the failures started after last week''s deploy - but there''s nothing obviously related in the changelog. What''s your next move?'
WHERE scenario_id = 'debug-session';

UPDATE scenario_variants
SET opening_message = 'You''re designing the API for a new feature: team workspaces with shared resources. Users need to create workspaces, invite members with different roles (admin, editor, viewer), share documents to workspaces, and manage permissions. The API will be consumed by your web app, mobile app, and eventually third-party integrations. Your current API style is RESTful with some inconsistencies from rapid growth. The PM wants this shipped in 6 weeks. What aspects of the design are you most uncertain about?'
WHERE scenario_id = 'api-design';

UPDATE scenario_variants
SET opening_message = 'You need to document the notification system for new engineers joining next month. It''s complex: 6 notification types, 3 delivery channels (email, in-app, push), user preference handling, rate limiting logic, and a quirky retry mechanism that was added after an incident. The previous documentation is a 2-year-old README that''s about 40% accurate. Two engineers understand the system deeply; one is leaving in 3 weeks. What does a new engineer actually need to know to work on this system safely?'
WHERE scenario_id = 'tech-doc';
