import { createRequire } from "module";
const require = createRequire(import.meta.url);

let PDFParseClass = null;
try {
  const pdfModule = require("pdf-parse");
  PDFParseClass = pdfModule.PDFParse || pdfModule;
} catch (err) {
  console.warn("pdf-parse module not loaded:", err.message);
}

// Common tech skills dictionary for automated skill discovery from resumes
export const KNOWN_SKILLS = [
  "javascript", "typescript", "react", "react.js", "reactjs", "node", "node.js", "nodejs",
  "express", "express.js", "expressjs", "mongodb", "mongo db", "sql", "mysql", "postgresql",
  "postgres", "nosql", "redis", "python", "fastapi", "django", "flask", "c++", "c", "c#",
  "java", "spring", "springboot", "html", "html5", "css", "css3", "tailwind", "tailwindcss",
  "bootstrap", "next.js", "nextjs", "vue", "angular", "redux", "graphql", "rest", "rest api",
  "restful api", "docker", "kubernetes", "aws", "gcp", "azure", "git", "github", "gitlab",
  "linux", "ci/cd", "machine learning", "deep learning", "ai", "artificial intelligence",
  "nlp", "natural language processing", "computer vision", "llm", "llms", "rag", "pytorch",
  "tensorflow", "keras", "pandas", "numpy", "scikit-learn", "sklearn", "pinecone", "chromadb",
  "data structures", "algorithms", "dsa", "oop", "oops", "system design", "microservices"
];

export const STANDARD_SKILL_NAMES = {
  "javascript": "JavaScript",
  "java script": "JavaScript",
  "typescript": "TypeScript",
  "react": "React",
  "react js": "React",
  "reactjs": "React",
  "node": "Node.js",
  "node js": "Node.js",
  "nodejs": "Node.js",
  "express": "Express.js",
  "express js": "Express.js",
  "expressjs": "Express.js",
  "mongodb": "MongoDB",
  "mongo db": "MongoDB",
  "sql": "SQL",
  "mysql": "MySQL",
  "postgresql": "PostgreSQL",
  "postgres": "PostgreSQL",
  "nosql": "NoSQL",
  "redis": "Redis",
  "python": "Python",
  "fastapi": "FastAPI",
  "django": "Django",
  "flask": "Flask",
  "c++": "C++",
  "c": "C",
  "c#": "C#",
  "java": "Java",
  "spring": "Spring Boot",
  "springboot": "Spring Boot",
  "html": "HTML5",
  "html5": "HTML5",
  "css": "CSS3",
  "css3": "CSS3",
  "tailwind": "Tailwind CSS",
  "tailwindcss": "Tailwind CSS",
  "bootstrap": "Bootstrap",
  "next js": "Next.js",
  "nextjs": "Next.js",
  "vue": "Vue.js",
  "angular": "Angular",
  "redux": "Redux",
  "graphql": "GraphQL",
  "rest": "REST API",
  "rest api": "REST API",
  "restful api": "REST API",
  "docker": "Docker",
  "kubernetes": "Kubernetes",
  "aws": "AWS",
  "gcp": "Google Cloud (GCP)",
  "azure": "Azure",
  "git": "Git",
  "github": "GitHub",
  "gitlab": "GitLab",
  "linux": "Linux",
  "ci/cd": "CI/CD",
  "machine learning": "Machine Learning",
  "deep learning": "Deep Learning",
  "ai": "Artificial Intelligence",
  "artificial intelligence": "Artificial Intelligence",
  "nlp": "NLP",
  "natural language processing": "NLP",
  "computer vision": "Computer Vision",
  "llm": "LLMs",
  "llms": "LLMs",
  "rag": "RAG",
  "pytorch": "PyTorch",
  "tensorflow": "TensorFlow",
  "keras": "Keras",
  "pandas": "Pandas",
  "numpy": "NumPy",
  "scikit learn": "Scikit-Learn",
  "sklearn": "Scikit-Learn",
  "pinecone": "Pinecone",
  "chromadb": "ChromaDB",
  "data structures": "Data Structures",
  "algorithms": "Algorithms",
  "dsa": "DSA",
  "oop": "OOP",
  "oops": "OOP",
  "system design": "System Design",
  "microservices": "Microservices"
};

/**
 * Deduplicates and standardizes a list of skills into clean, human-readable titles.
 */
export const formatCleanSkills = (rawSkills = []) => {
  const seen = new Set();
  const result = [];

  for (const raw of rawSkills) {
    if (!raw || typeof raw !== "string") continue;
    const normalized = normalizeSkill(raw);
    if (!normalized) continue;

    const displayName = STANDARD_SKILL_NAMES[normalized] || (raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1));
    const dedupKey = displayName.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (!seen.has(dedupKey)) {
      seen.add(dedupKey);
      result.push(displayName);
    }
  }

  return result;
};

/**
 * Normalizes a skill string for uniform comparison.
 */
export const normalizeSkill = (skill = "") => {
  return skill
    .toLowerCase()
    .replace(/[._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Converts various cloud/drive URLs (like Google Drive share links) to direct download URLs.
 */
export const getDirectResumeUrl = (rawUrl = "") => {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const url = rawUrl.trim();

  // Handle Google Drive links
  // formats:
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // https://drive.google.com/open?id=FILE_ID
  // https://drive.google.com/uc?id=FILE_ID
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`;
  }

  // Already a direct URL or Cloudinary URL
  return url;
};

/**
 * Downloads and extracts plaintext from a candidate's resume URL.
 */
export const extractTextFromResumeUrl = async (resumeUrl) => {
  const directUrl = getDirectResumeUrl(resumeUrl);
  if (!directUrl || !PDFParseClass) return "";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(directUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`Resume download returned status ${res.status} for ${directUrl}`);
      return "";
    }

    const arrayBuf = await res.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuf);

    const parser = new PDFParseClass(uint8);
    const parsed = await parser.getText();
    const extractedText = parsed?.text || "";
    return extractedText.trim();
  } catch (err) {
    console.warn("Failed to extract text from resume URL:", err.message);
    return "";
  }
};

/**
 * Extracts skills from text using fuzzy regex and known tech skills.
 */
export const extractSkillsFromText = (text = "") => {
  if (!text || typeof text !== "string") return [];
  const lowerText = ` ${text.toLowerCase()} `;
  const foundSkills = new Set();

  for (const skill of KNOWN_SKILLS) {
    // Look for exact word boundary match
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[^a-z0-9#+])${escaped}(?:$|[^a-z0-9#+])`, "i");
    if (regex.test(lowerText)) {
      foundSkills.add(normalizeSkill(skill));
    }
  }

  return Array.from(foundSkills);
};

/**
 * Computes an accurate match score between a candidate's resume/skills and a job posting.
 */
export const computeAccurateMatch = ({
  candidateName = "",
  resumeText = "",
  candidateSkills = [],
  jobTitle = "",
  jobDescription = "",
  jobRequirements = [],
}) => {
  // 1. Gather all candidate skills from profile and resume text
  const allCandidateSkills = new Set(
    (candidateSkills || []).map((s) => normalizeSkill(s)).filter(Boolean)
  );

  // If text is available, detect more skills
  if (resumeText) {
    const detectedFromText = extractSkillsFromText(resumeText);
    detectedFromText.forEach((s) => allCandidateSkills.add(s));
  }

  const candidateSkillsList = Array.from(allCandidateSkills);
  const normalizedResumeText = (resumeText || "").toLowerCase();

  // 2. Parse job requirements
  const normalizedRequirements = (jobRequirements || [])
    .map((r) => normalizeSkill(r))
    .filter(Boolean);

  const matchedSkills = [];
  const missingSkills = [];

  // Match each job requirement against candidate skills AND resume text
  for (const req of normalizedRequirements) {
    let isMatched = false;

    // Direct or sub-string match in candidate skills
    for (const skill of candidateSkillsList) {
      if (
        skill === req ||
        skill.includes(req) ||
        req.includes(skill)
      ) {
        isMatched = true;
        break;
      }
    }

    // If not found in skill list, check raw resume text
    if (!isMatched && normalizedResumeText) {
      const escaped = req.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?:^|[^a-z0-9#+])${escaped}(?:$|[^a-z0-9#+])`, "i");
      if (regex.test(normalizedResumeText)) {
        isMatched = true;
      }
    }

    if (isMatched) {
      matchedSkills.push(req);
    } else {
      missingSkills.push(req);
    }
  }

  // 3. Compute Skill Score (0-100)
  let skillScore = 0;
  if (normalizedRequirements.length > 0) {
    skillScore = (matchedSkills.length / normalizedRequirements.length) * 100;
  } else {
    // If no explicit requirements, score based on relevant tech skills detected
    skillScore = Math.min(100, candidateSkillsList.length * 15);
  }

  // 4. Compute Semantic / Domain relevance score (0-100)
  let semanticScore = 40; // baseline for relevant candidate
  if (normalizedResumeText) {
    const jobKeywords = [
      ...jobTitle.toLowerCase().split(/\s+/),
      ...jobDescription.toLowerCase().split(/\s+/),
    ]
      .map((w) => w.replace(/[^a-z0-9]/g, "").trim())
      .filter((w) => w.length > 3 && !["with", "from", "that", "this", "have", "need", "will", "your"].includes(w));

    const uniqueKeywords = Array.from(new Set(jobKeywords));
    let hitCount = 0;
    for (const kw of uniqueKeywords) {
      if (normalizedResumeText.includes(kw)) {
        hitCount++;
      }
    }

    const keywordRatio = uniqueKeywords.length > 0 ? hitCount / uniqueKeywords.length : 0.5;
    semanticScore = Math.min(100, Math.round(35 + keywordRatio * 65));
  } else if (candidateSkillsList.length > 0) {
    semanticScore = Math.min(90, 45 + candidateSkillsList.length * 5);
  } else {
    semanticScore = 15;
  }

  // 5. Final Composite Score
  let matchScore = Math.round(skillScore * 0.6 + semanticScore * 0.4);
  matchScore = Math.max(0, Math.min(100, matchScore));

  // If the candidate matched all requirements, ensure score is at least 75%
  if (normalizedRequirements.length > 0 && matchedSkills.length === normalizedRequirements.length) {
    matchScore = Math.max(75, matchScore);
  }

  // 6. Generate human-readable explanation
  let explanation = "";
  if (matchedSkills.length > 0) {
    explanation = `${candidateName || "The candidate"} matches ${matchedSkills.length} of ${
      normalizedRequirements.length || matchedSkills.length
    } key requirements (${matchedSkills.join(", ")}).`;
    if (missingSkills.length > 0) {
      explanation += ` Recommended areas for development: ${missingSkills.join(", ")}.`;
    } else {
      explanation += ` Demonstrates strong competency across all listed technical requirements for the ${jobTitle || "role"}.`;
    }
  } else if (candidateSkillsList.length > 0) {
    explanation = `${candidateName || "The candidate"} has relevant technical skills (${candidateSkillsList.slice(0, 4).join(", ")}), but specific required skills (${missingSkills.join(", ")}) were not directly listed.`;
  } else {
    explanation = `Candidate profile does not yet have an analyzed resume or listed technical skills matching the requirements.`;
  }

  return {
    matchScore,
    semanticScore: Math.round(semanticScore),
    skillScore: Math.round(skillScore),
    matchedSkills,
    missingSkills,
    explanation,
    allCandidateSkills: candidateSkillsList,
  };
};
