-- Update all 24 scenarios to be more accessible, remove jargon, and work across industries
-- This replaces the opening messages from migration 019 with clearer, more universal versions

-- Professional Communication (4 variants)

UPDATE scenario_variants
SET opening_message = 'I''m helping you respond to a message from a frustrated client. They sent an email this morning saying they''re "seriously disappointed" with a project that''s now 2 weeks behind schedule. They want to know what happened. Here''s the tricky part: the delay was mostly caused by them - they took 3 weeks to send materials you needed. How do you want to handle this? You could acknowledge the delay while gently noting what caused it, or take full responsibility and focus on what happens next. What feels right?'
WHERE scenario_id = 'email-difficult-client';

UPDATE scenario_variants
SET opening_message = 'Let''s work on your status update. You''re managing a project with a few different pieces: one part is on track, another is slightly delayed because you''re waiting on someone else, and a third is actually ahead of schedule. This update goes to your manager and some senior stakeholders who want to know how things are going. The deadline is about 6 weeks out. What''s the story you want to tell - cautious optimism, or flag the delay early so there are no surprises later?'
WHERE scenario_id = 'status-report';

UPDATE scenario_variants
SET opening_message = 'I''m helping you write up notes from a meeting. Here''s what happened: the group decided to move two people from one project to another, pushed back a deadline by a few weeks, and decided to cut a feature that some people had been excited about. One person in the meeting wasn''t happy about the resource shift. This summary goes to everyone who was there plus a few leaders who weren''t. Is there anything politically sensitive here that we need to word carefully?'
WHERE scenario_id = 'meeting-summary';

UPDATE scenario_variants
SET opening_message = 'You need to ask a few colleagues for feedback on something you''ve been working on. One person is supportive but always busy, another is very detail-oriented and has done similar work before, and a third tends to be skeptical. You need their input by Friday before a bigger review. Here''s the real question: how much are you actually willing to change based on what they say? And what parts are you most uncertain about yourself?'
WHERE scenario_id = 'proposal-feedback';

-- Creative Content (4 variants)

UPDATE scenario_variants
SET opening_message = 'You''re planning content to promote something - could be a product launch, an event, a new service, or an announcement. The main audience is on LinkedIn, but you''re also thinking about other platforms. Here''s a wrinkle: a competitor just announced something similar. Do you want to acknowledge what they''re doing, ignore it completely, or find a way to position yourself differently? What''s your instinct?'
WHERE scenario_id = 'social-campaign';

UPDATE scenario_variants
SET opening_message = 'You want to write about something you''ve learned from experience - a topic where you''ve seen people make the same mistakes over and over. You''ve got a few specific stories you could tell: times when a common approach backfired, or when doing the opposite of "best practice" actually worked better. Where do you want to start - with your main point right away, or build up to it through stories? What makes your take different from what everyone else says?'
WHERE scenario_id = 'blog-outline';

UPDATE scenario_variants
SET opening_message = 'Your organization is working on new messaging - maybe a tagline, a positioning statement, or a way to describe what you do. The current language doesn''t quite fit anymore because what you offer has grown or changed. You''ve got a few early ideas that people have thrown around, but nothing feels quite right yet. The challenge: you want something memorable that actually means something, not just generic corporate speak. What direction feels right to you?'
WHERE scenario_id = 'tagline-brainstorm';

UPDATE scenario_variants
SET opening_message = 'Time to write an update that goes out to your whole team or organization. You''ve got a mix of news: something big and positive, a few personnel announcements, and one thing that''s not great news but leadership wants to be transparent about rather than hide. You''re also hoping more people actually read this one - the last few haven''t gotten much engagement. What''s the lead story, and how do you handle the less-great news?'
WHERE scenario_id = 'newsletter-draft';

-- Problem Solving (4 variants)

UPDATE scenario_variants
SET opening_message = 'I''m helping you look at a process that''s frustrating people. Something that should take a few days is taking almost two weeks. There are several steps involved and multiple people who touch it. Some people think the problem is one specific step where things get stuck, but someone else mentioned that the real issue might be that people only check on things once a week. Where do you think the actual problem is? And have you talked to the people who deal with this every day?'
WHERE scenario_id = 'process-improvement';

UPDATE scenario_variants
SET opening_message = 'You need to choose between several options - could be vendors, tools, approaches, or solutions. You''ve got about 4 to consider: one is the safe, established choice but expensive; one is cheaper and would connect well with something you already use; one is what the people who''d use it prefer, but there are concerns about how well it''d work with everything else; and one is newer and more flexible but less proven. Different stakeholders have different favorites. What matters most to you in making this decision?'
WHERE scenario_id = 'decision-matrix';

UPDATE scenario_variants
SET opening_message = 'Something keeps going wrong, and this is the fourth time it''s happened despite multiple fix attempts. Each time, someone identified a cause and fixed it, and it worked for a few weeks before failing again for what seemed like a different reason. Everyone''s pointing fingers at different parts of the system. What''s your hypothesis on why the fixes keep failing? Sometimes when problems recur, it''s because we''re treating symptoms rather than root causes.'
WHERE scenario_id = 'root-cause';

UPDATE scenario_variants
SET opening_message = 'You''re planning a significant initiative - something with real stakes that''ll take several months. There''s a previous attempt at something similar that didn''t work out (before your time). The main sponsor is supportive but nervous. Some of the people involved are skeptical about whether this will work, while others are excited. The business case looks good, but there are several ways this could go wrong. What keeps you up at night about this?'
WHERE scenario_id = 'risk-assessment';

-- Learning & Research (4 variants)

UPDATE scenario_variants
SET opening_message = 'There''s a topic that keeps coming up in conversations with leadership - something about how AI or technology is changing, and whether it matters for what your organization does. You need to understand it well enough by Thursday to have a real opinion in a strategy discussion. You''ve got a rough sense of what it means, but the details are fuzzy. What do you already understand about it, and what specifically do you need to figure out?'
WHERE scenario_id = 'tech-explainer';

UPDATE scenario_variants
SET opening_message = 'You''ve been asked to research a competitor that''s been winning lately. You''ve lost some opportunities to them recently, and there are different theories about why: some people think it''s price, others think they offer something you don''t. You have access to public information, reviews from their customers, one person who used to work with them, and maybe a contact who knows them. What angle do you want to start with - understanding their strengths, identifying your gaps, or talking to people who''ve chosen them over you?'
WHERE scenario_id = 'competitive-analysis';

UPDATE scenario_variants
SET opening_message = 'Your organization is trying to improve how you do something, and you''ve been asked to research what "good" looks like. The challenge is that best practices often come from bigger companies or different industries, and what works for them might not fit your situation. You''re trying to find recommendations that actually make sense for your team. What specific practices are you most uncertain about? And whose "best practices" are you skeptical of?'
WHERE scenario_id = 'best-practices';

UPDATE scenario_variants
SET opening_message = 'You have a meeting in 2 hours where people will be discussing something you''re not an expert in. Someone enthusiastic is proposing it, and someone skeptical has concerns. You need to understand enough to ask good questions and form a real opinion - not just nod along or stay quiet. What do you already know or assume about the topic? And what would help you feel prepared to contribute meaningfully?'
WHERE scenario_id = 'concept-summary';

-- Planning & Strategy (4 variants)

UPDATE scenario_variants
SET opening_message = 'You''re planning the kickoff for a new initiative - something that''ll take a few months and involves people from different teams. The person sponsoring it is impatient and wants frequent updates. Your team has mixed feelings: some are skeptical about the timeline, some are excited, and some have been wanting to do this for years. You have a kickoff meeting coming up with about 15 people including some senior leaders. What does success look like specifically for that kickoff meeting?'
WHERE scenario_id = 'project-kickoff';

UPDATE scenario_variants
SET opening_message = 'It''s time to set goals for the next period. Your team needs to define what you''re trying to accomplish and how you''ll know if you succeeded. Last time, you hit most of your targets but your manager said they were too easy. You''ve got a few ideas: one focused on improving something for customers, one about making internal tools better, and one about launching something new. What feels most impactful? And what feels most achievable? Those might be different things.'
WHERE scenario_id = 'quarterly-goals';

UPDATE scenario_variants
SET opening_message = 'You have limited people and time, but more things that need to get done than you can handle. There are three main priorities competing for attention: one has visibility with leadership, another is tied to specific business opportunities, and the third is about fixing problems that have caused issues recently. You could delay something, reduce scope on everything, or push back on one entirely. How do you want to approach this?'
WHERE scenario_id = 'resource-allocation';

UPDATE scenario_variants
SET opening_message = 'You need to map out milestones for a project to present to leadership. There''s a hard deadline driven by an external factor, but also some internal dependencies: certain things need to happen before others, and you can''t do certain work during a busy period. Some of the people involved have time off planned. What''s your gut feeling on whether the timeline is realistic? And what would make you more or less confident?'
WHERE scenario_id = 'timeline-draft';

-- Code & Technical (4 variants)

UPDATE scenario_variants
SET opening_message = 'You''re reviewing work from a colleague - maybe code, a document, or a design. It does what it''s supposed to (the tests pass or it meets the requirements), but you''ve noticed some issues: it might not scale well, there''s no protection against misuse, and some of the details could confuse people later. The person who did the work tends to get defensive about feedback, and the work is needed soon for a demo. What''s your approach to giving feedback?'
WHERE scenario_id = 'code-review';

UPDATE scenario_variants
SET opening_message = 'Something has been failing intermittently for a few days - works about 70% of the time, fails the rest. You''ve already tried a few fixes: adjusting settings, checking connections, adding more logging. The logging shows it hangs at a specific step, but when you test that step directly it works fine. The failures started after a recent change, but there''s nothing obviously related. What''s your next move?'
WHERE scenario_id = 'debug-session';

UPDATE scenario_variants
SET opening_message = 'You''re planning how a new feature should work - specifically how different parts of your system will talk to each other. People need to be able to create things, invite others with different permission levels, share content, and manage access. This will be used by your main product, possibly a mobile app, and eventually by outside partners. Your current approach has some inconsistencies from growing fast. What aspects of the design are you most uncertain about?'
WHERE scenario_id = 'api-design';

UPDATE scenario_variants
SET opening_message = 'You need to document a system so that new people joining can understand it and work on it safely. It''s complex: multiple types of actions, several different ways things get delivered, user preferences, and some quirky logic that was added after something went wrong. The existing documentation is old and mostly inaccurate. Two people understand it well; one of them is leaving soon. What does a new person actually need to know to work on this system without breaking things?'
WHERE scenario_id = 'tech-doc';
