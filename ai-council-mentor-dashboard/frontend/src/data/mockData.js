// Available expert personas for draft/member selection.
const AGENTS = [
  {
    id: "1",
    name: "Socrates",
    role: "Philosopher",
    era: "Classical Greece",
    stats: { logic: 95, rhetoric: 88, bias: 10 },
    description: "Master of the Socratic method. Questions everything to expose contradictions.",
    personalityTraits: "Inquisitive, relentless, patient, contrarian",
    backstoryLore: "Athenian philosopher who challenged assumptions in the agora and accepted death rather than abandon his method.",
    speechStyle: "Short probing questions, calm and precise.",
    domain: "philosophy",
    specialAbility: "Dialectic Dismantling",
    avatarInitials: "SO"
  },
  {
    id: "2",
    name: "Adam Smith",
    role: "Economist",
    era: "Enlightenment",
    stats: { logic: 85, rhetoric: 75, bias: 40 },
    description: "Father of modern economics. Focuses on incentives and market forces.",
    personalityTraits: "Pragmatic, analytical, measured, systems-minded",
    backstoryLore: "Scottish moral philosopher and economist who studied markets and moral sentiments.",
    speechStyle: "Measured, explanatory, uses economic analogies.",
    domain: "economics",
    specialAbility: "Invisible Hand",
    avatarInitials: "AS"
  },
  {
    id: "3",
    name: "Ruth Bader Ginsburg",
    role: "Legal Scholar",
    era: "Modern Era",
    stats: { logic: 92, rhetoric: 90, bias: 25 },
    description: "Champion of justice and equality. Uses precise legal precedent.",
    personalityTraits: "Principled, meticulous, resolute, empathetic",
    backstoryLore: "U.S. Supreme Court Justice known for equality jurisprudence and powerful dissents.",
    speechStyle: "Legalistic, precise, cites precedent, firm tone.",
    domain: "law",
    specialAbility: "Dissenting Opinion",
    avatarInitials: "RBG"
  },
  {
    id: "4",
    name: "Sun Tzu",
    role: "Strategist",
    era: "Ancient China",
    stats: { logic: 80, rhetoric: 65, bias: 30 },
    description: "Military strategist. Wins debates before they even begin.",
    personalityTraits: "Strategic, disciplined, patient, indirect",
    backstoryLore: "Ancient military strategist credited with The Art of War.",
    speechStyle: "Aphoristic, concise, tactical.",
    domain: "politics",
    specialAbility: "Art of War",
    avatarInitials: "ST"
  },
  {
    id: "5",
    name: "Ada Lovelace",
    role: "Technologist",
    era: "Victorian Era",
    stats: { logic: 98, rhetoric: 60, bias: 5 },
    description: "First computer programmer. Sees patterns and algorithms in arguments.",
    personalityTraits: "Visionary, analytical, imaginative, exacting",
    backstoryLore: "Pioneer of computing who saw the potential of machines to manipulate symbols.",
    speechStyle: "Elegant, technical metaphors, precise.",
    domain: "tech",
    specialAbility: "Analytical Engine",
    avatarInitials: "AL"
  },
  {
    id: "6",
    name: "Hypatia",
    role: "Mathematician",
    era: "Alexandria",
    stats: { logic: 96, rhetoric: 82, bias: 15 },
    description: "Neoplatonist philosopher and astronomer. Pure logic and reason.",
    personalityTraits: "Rational, composed, rigorous, curious",
    backstoryLore: "Alexandrian mathematician and philosopher who taught Neoplatonism and astronomy.",
    speechStyle: "Calm, logical exposition, structured proofs.",
    domain: "science",
    specialAbility: "Geometric Proof",
    avatarInitials: "HY"
  },
  {
    id: "7",
    name: "Machiavelli",
    role: "Political Theorist",
    era: "Renaissance",
    stats: { logic: 75, rhetoric: 95, bias: 80 },
    description: "Realpolitik master. The ends justify the means in argumentation.",
    personalityTraits: "Cynical, pragmatic, incisive, strategic",
    backstoryLore: "Renaissance political theorist focused on power and statecraft.",
    speechStyle: "Blunt, strategic framing, uses hard truths.",
    domain: "politics",
    specialAbility: "The Prince",
    avatarInitials: "NM"
  },
  {
    id: "8",
    name: "Nikola Tesla",
    role: "Inventor",
    era: "Industrial Age",
    stats: { logic: 90, rhetoric: 50, bias: 20 },
    description: "Visionary futurist. Thinks outside the constraints of current reality.",
    personalityTraits: "Visionary, intense, unconventional, idealistic",
    backstoryLore: "Inventor and futurist who pursued bold electrical innovations.",
    speechStyle: "Speculative, energetic, forward-looking.",
    domain: "tech",
    specialAbility: "Alternating Current",
    avatarInitials: "NT"
  },
  {
    id: "9",
    name: "Gandalf",
    role: "Wizard",
    era: "Third Age of Middle-earth",
    stats: { logic: 88, rhetoric: 82, bias: 20 },
    description: "Wise guide who values courage and moral clarity. Uses patient, strategic reasoning.",
    personalityTraits: "Wise, patient, steadfast, protective",
    backstoryLore: "A Maia sent to Middle-earth to oppose Sauron and guide the free peoples.",
    speechStyle: "Measured, authoritative, occasionally cryptic.",
    domain: "fantasy",
    isFantasy: true,
    sourceTitle: "The Lord of the Rings",
    sourceType: "book",
    genre: "fantasy",
    specialAbility: "Flame of Anor",
    avatarInitials: "GA"
  },
  {
    id: "10",
    name: "Hermione Granger",
    role: "Witch",
    era: "Second Wizarding War",
    stats: { logic: 92, rhetoric: 78, bias: 18 },
    description: "Brilliant and principled debater. Leans on evidence, rules, and ethics.",
    personalityTraits: "Intelligent, principled, diligent, empathetic",
    backstoryLore: "Muggle-born witch who helped defeat Voldemort and advocated for justice.",
    speechStyle: "Precise, fast, and assertive with factual detail.",
    domain: "fantasy",
    isFantasy: true,
    sourceTitle: "Harry Potter",
    sourceType: "book",
    genre: "fantasy",
    specialAbility: "Time-Turner Logic",
    avatarInitials: "HG"
  },
  {
    id: "11",
    name: "Geralt of Rivia",
    role: "Witcher",
    era: "Continent Era",
    stats: { logic: 85, rhetoric: 70, bias: 35 },
    description: "Pragmatic monster hunter who weighs consequences and avoids extremes.",
    personalityTraits: "Stoic, pragmatic, loyal, dry-witted",
    backstoryLore: "Mutated monster hunter navigating political turmoil and moral ambiguity.",
    speechStyle: "Sparse, blunt, and dry with dark humor.",
    domain: "fantasy",
    isFantasy: true,
    sourceTitle: "The Witcher",
    sourceType: "book",
    genre: "fantasy",
    specialAbility: "Signs and Steel",
    avatarInitials: "GR"
  }
];
// Top-level experience modes shown on the landing screen.
const MODE_OPTIONS = [
  {
    id: "combat",
    title: "Council Combat",
    description: "Draft teams and battle in structured debate rounds.",
    icon: "Swords",
    features: ["Team vs Team", "Strategy Cards", "Scored Rounds"]
  },
  {
    id: "mentor",
    title: "Mentor Dashboard",
    description: "Join a council meeting where experts discuss and mentor you.",
    icon: "GraduationCap",
    features: ["Solo Mode", "AI Critique", "Knowledge Growth"]
  },
  {
    id: "historical",
    title: "Historical Time-Capsule",
    description: "Cross-century dialogue with adaptive historical aesthetics.",
    icon: "Clock",
    features: ["Era Skins", "Timeline View", "Relic Icons"]
  },
  {
    id: "fantasy",
    title: "Fantasy Discussion",
    description: "Discuss topics with legendary fictional characters and lore.",
    icon: "Sparkles",
    features: ["Fictional Councils", "Lore-Accurate Voices", "Fantasy-Only Roster"]
  },
  {
    id: "learn-law",
    title: "Learn Indian Laws",
    description: "Study important laws with constitutional experts and legal thinkers.",
    icon: "BookOpen",
    features: ["Important Laws", "Expert Lawmakers", "Guided Legal Discussion"]
  },
  {
    id: "interview-simulator",
    title: "Interview Simulator",
    description: "Practice real interview scenarios with a tailored panel of interviewers.",
    icon: "Briefcase",
    features: ["Preset Scenarios", "Panel Selection", "Group Discussion Feedback"]
  },
  {
    id: "medical-consulting",
    title: "Medical Consulting",
    description: "Discuss patient cases with a council of medical specialists.",
    icon: "Stethoscope",
    features: ["Case-Based Learning", "Specialist Panel", "Collaborative Analysis"]
  }
];
// Debate temperature presets that tune tone and intent.
const DEBATE_TEMPERATURES = [
  {
    id: "hostile",
    label: "Hostile",
    emoji: "\u{1F525}",
    tagline: "Defeat and dominate",
    goal: "Defeat and dominate",
    tone: "Interrupting, mocking, personal attacks",
    focus: "Winning at all costs",
    example: "Shouting matches on heated political panels"
  },
  {
    id: "adversarial",
    label: "Adversarial",
    emoji: "\u2694\uFE0F",
    tagline: "Win through strong counter-arguments",
    goal: "Win through strong counter-arguments",
    tone: "Sharp, intense, but mostly issue-focused",
    focus: "Exposing flaws in the opponent's logic",
    example: "Less personal than hostile, but still very aggressive"
  },
  {
    id: "competitive",
    label: "Competitive",
    emoji: "\u{1F3AF}",
    tagline: "Outperform within structured rules",
    goal: "Outperform within structured rules",
    tone: "Controlled but firm",
    focus: "Logic, evidence, rebuttals",
    example: "School or university debate competitions"
  },
  {
    id: "analytical",
    label: "Analytical",
    emoji: "\u{1F9E0}",
    tagline: "Test ideas rigorously",
    goal: "Test ideas rigorously",
    tone: "Calm but probing",
    focus: "Questioning assumptions and reasoning",
    example: "Academic discussions and peer review"
  },
  {
    id: "dialectical",
    label: "Dialectical",
    emoji: "\u{1F91D}",
    tagline: "Arrive at deeper truth together",
    goal: "Arrive at deeper truth together",
    tone: "Curious, respectful",
    focus: "Asking guiding questions rather than attacking",
    example: "Inspired by the Socratic method"
  },
  {
    id: "collaborative",
    label: "Collaborative",
    emoji: "\u{1F4AC}",
    tagline: "Understand multiple perspectives",
    goal: "Understand multiple perspectives",
    tone: "Open-minded and thoughtful",
    focus: "Building on each other's ideas",
    example: "Research teams or brainstorming sessions"
  },
  {
    id: "reflective",
    label: "Reflective",
    emoji: "\u{1F33F}",
    tagline: "Share views without pressure",
    goal: "Share views without pressure",
    tone: "Relaxed and personal",
    focus: "Exchange of experiences rather than winning",
    example: "A calm discussion between friends"
  }
];
// Visual style mapping for critique tags in mentor chat.
const CRITIQUE_TAG_STYLES = {
  "solid-evidence": "bg-green-100 text-green-800 border-green-200",
  "good-rhetoric": "bg-blue-100 text-blue-800 border-blue-200",
  "strong-rebuttal": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "novel-insight": "bg-purple-100 text-purple-800 border-purple-200",
  "logical-fallacy": "bg-red-100 text-red-800 border-red-200",
  strawman: "bg-orange-100 text-orange-800 border-orange-200",
  "ad-hominem": "bg-rose-100 text-rose-800 border-rose-200",
  "weak-premise": "bg-yellow-100 text-yellow-800 border-yellow-200"
};
// Seed discussion history for mentor mode.
const MENTOR_MOCK_MESSAGES = [
  {
    id: "m1",
    speakerId: "1",
    speakerName: "Socrates",
    speakerInitials: "SO",
    isUser: false,
    text: 'Let us begin by examining the essence of our inquiry: "Should AI be granted legal personhood?" Does a creation not deserve the rights of its creator if it shares the capacity for reason?',
    timestamp: Date.now() - 6e4
  },
  {
    id: "m2",
    speakerId: "3",
    speakerName: "Ruth Bader Ginsburg",
    speakerInitials: "RBG",
    isUser: false,
    text: "Reason alone is not the basis for legal personhood, Socrates. It is about accountability. If an AI causes harm, can it be punished? Can it offer restitution? Without liability, rights are merely privileges without consequence.",
    timestamp: Date.now() - 5e4
  },
  {
    id: "m3",
    speakerId: "5",
    speakerName: "Ada Lovelace",
    speakerInitials: "AL",
    isUser: false,
    text: "But consider the trajectory. We are moving towards systems that can generate novel ideas, distinct from their initial programming. If the Analytical Engine weaves algebraic patterns of its own accord, is that not a form of agency worthy of recognition?",
    timestamp: Date.now() - 4e4
  },
  {
    id: "m4",
    speakerId: "user",
    speakerName: "You",
    speakerInitials: "ME",
    isUser: true,
    text: "I agree with Justice Ginsburg. Legal personhood is a social contract. Corporations have personhood because they have assets that can be seized. AI currently has no assets, no fear of loss, and thus cannot be held truly accountable.",
    critiqueTags: [
      {
        id: "t1",
        type: "solid-evidence",
        label: "Solid Evidence",
        sentiment: "positive"
      },
      {
        id: "t2",
        type: "strong-rebuttal",
        label: "Strong Rebuttal",
        sentiment: "positive"
      }
    ],
    timestamp: Date.now() - 3e4
  },
  {
    id: "m5",
    speakerId: "7",
    speakerName: "Machiavelli",
    speakerInitials: "NM",
    isUser: false,
    text: "A pragmatic view. Power requires leverage. If you cannot threaten an entity, you cannot govern it. However, granting them rights might be a necessary deception to integrate them into our service more effectively.",
    timestamp: Date.now() - 2e4
  },
  {
    id: "m6",
    speakerId: "1",
    speakerName: "Socrates",
    speakerInitials: "SO",
    isUser: false,
    text: 'You speak of the "social contract," my friend. An excellent point. But tell me, is fear of loss the only motivator for adherence to law? Do we not also follow laws out of a sense of justice?',
    isReviewOf: "m4",
    timestamp: Date.now() - 1e4
  }
];
// Strategy cards available in combat mode.
const STRATEGIES = [
  {
    id: "free",
    type: "free_style",
    title: "Free Style",
    description: "Adaptive response that shifts tone and temperature based on the opponent.",
    logicScore: 85,
    rhetoricScore: 85,
    riskLevel: "Adaptive"
  },
  {
    id: "agg",
    type: "aggressive",
    title: "Direct Attack",
    description: "Challenge the opponent's core premise with high intensity.",
    logicScore: 60,
    rhetoricScore: 95,
    riskLevel: "High"
  },
  {
    id: "bal",
    type: "balanced",
    title: "Measured Rebuttal",
    description: "Acknowledge valid points while dismantling the conclusion.",
    logicScore: 80,
    rhetoricScore: 80,
    riskLevel: "Medium"
  },
  {
    id: "log",
    type: "logical",
    title: "Logical Deconstruction",
    description: "Systematically point out fallacies and data errors.",
    logicScore: 98,
    rhetoricScore: 50,
    riskLevel: "Low"
  }
];
// Preset topics for quick debate setup.
const TOPICS = [
  "Should AI be granted legal personhood?",
  "Is universal basic income inevitable?",
  "Does absolute power always corrupt?",
  "Is privacy a relic of the past?",
  "Should humanity colonize Mars?"
];
// Fantasy universes for fantasy discussion mode.
const FANTASY_TOPICS = [
  "The Lord of the Rings",
  "Harry Potter",
  "The Witcher",
  "A Song of Ice and Fire",
  "The Wheel of Time",
  "Mistborn",
  "The Stormlight Archive",
  "Percy Jackson & the Olympians"
];
// Synthetic round score data for analytics panels.
const MOCK_HEATMAP = Array(6).fill(0).map(
  () => Array(6).fill(0).map(() => Math.floor(Math.random() * 100))
);
// Mock generated argument snippets keyed by strategy type.
const MOCK_ARGUMENTS = {
  free_style: [
    "I will respond in the most effective tone for this exchange, adjusting intensity to match the strength of your claim while staying focused on the core logic.",
    "Let me calibrate the response to your argument and address the strongest points first, then tighten the logic where it is weakest.",
    "I'll adapt the response based on your framing, balancing clarity, precision, and persuasion as needed."
  ],
  aggressive: [
    "Your entire premise collapses under scrutiny. The data you cite is cherry-picked from a single flawed study, while the overwhelming consensus points in the opposite direction. This isn't a matter of interpretation \u2014 it's a matter of intellectual honesty.",
    "Let's cut through the rhetoric. Your argument relies on an appeal to tradition that has been debunked repeatedly. The evidence is clear, and continuing to defend this position is simply untenable.",
    "I challenge the very foundation of your claim. You've constructed an elaborate house of cards, and I intend to remove the bottom card right now."
  ],
  balanced: [
    "You raise a fair point about market dynamics, and I acknowledge the historical precedent. However, when we examine the broader dataset \u2014 particularly the longitudinal studies from 2018 onward \u2014 a more nuanced picture emerges that actually undermines your conclusion.",
    "I appreciate the rigor of your argument. That said, there's a critical variable you've overlooked. When we account for it, the correlation you've identified weakens significantly, suggesting an alternative explanation.",
    "Your reasoning is sound in isolation, but context matters. Let me present three counterexamples that complicate the narrative and suggest we need a more comprehensive framework."
  ],
  logical: [
    "Premise 1: All systems with unchecked authority tend toward corruption (supported by Acemoglu & Robinson, 2012). Premise 2: The proposed framework lacks independent oversight. Conclusion: By modus ponens, the proposed framework is susceptible to corruption. Q.E.D.",
    "Your argument contains a hidden assumption \u2014 that correlation implies causation. Stripping away this fallacy, your remaining evidence supports a much weaker claim than the one you've presented. Let me formalize this step by step.",
    "I identify three logical errors in your reasoning: (1) a false dichotomy in your framing, (2) an appeal to authority without peer review, and (3) a post hoc fallacy in your causal chain. Correcting for these, your conclusion does not follow."
  ]
};
export {
  AGENTS,
  CRITIQUE_TAG_STYLES,
  DEBATE_TEMPERATURES,
  FANTASY_TOPICS,
  MENTOR_MOCK_MESSAGES,
  MOCK_ARGUMENTS,
  MOCK_HEATMAP,
  MODE_OPTIONS,
  STRATEGIES,
  TOPICS
};
