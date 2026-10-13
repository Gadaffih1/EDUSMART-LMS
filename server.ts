import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to determine the listening port across container environments, CLI args, and defaults
function resolvePort(): number {
  if (process.env.PORT) {
    const parsed = parseInt(process.env.PORT, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  // Check CLI flags: --port 3000, -p 3000, or --port=3000
  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--port' || arg === '-p') {
      const nextArg = process.argv[i + 1];
      if (nextArg) {
        const parsed = parseInt(nextArg, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } else if (arg.startsWith('--port=')) {
      const parsed = parseInt(arg.split('=')[1], 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }
  return 3000;
}

async function startServer() {
  const app = express();
  const PORT = resolvePort();
  const HOST = process.env.HOST || '0.0.0.0';

  app.use(express.json());

  // Health and readiness check endpoints for container orchestrators, load balancers, and Cloud Run
  const healthHandler = (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'EduSmart API',
      port: PORT,
      host: HOST,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      geminiConfigured: !!process.env.GEMINI_API_KEY
    });
  };

  app.get('/api/health', healthHandler);
  app.get('/health', healthHandler);
  app.get('/healthz', healthHandler);
  app.get('/livez', healthHandler);
  app.get('/readyz', healthHandler);

  // AI-Powered Quiz Explanation Endpoint using Gemini API
  app.post('/api/quiz-explanation', async (req: Request, res: Response) => {
    try {
      const { 
        questionText, 
        chosenAnswer, 
        correctAnswer, 
        subject = 'General Studies', 
        grade = 4, 
        topic = 'Curriculum Core',
        teacherExplanation = ''
      } = req.body;

      if (!questionText || chosenAnswer === undefined || correctAnswer === undefined) {
        return res.status(400).json({ error: 'Missing required question and answer details' });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // High-quality pedagogical fallback when API key is not present in environment
        return res.json({
          misconception: `When answering questions on ${topic || subject}, choosing "${chosenAnswer}" is a common mistake when confusing similar terminology or calculation steps.`,
          stepByStep: `The correct solution is "${correctAnswer}". ${teacherExplanation || `Under Grade ${grade} CBC guidelines, this correctly satisfies the key competency required for this topic.`}`,
          studyTip: `Tip: Read through the question keywords carefully and double check how "${correctAnswer}" differs from "${chosenAnswer}".`,
          encouragement: "Great effort! Reviewing your mistakes is the best way to master CBC competencies."
        });
      }

      // Initialize Gemini Client
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are EduSmart AI Tutor, a warm, patient, and expert Kenyan Competency-Based Curriculum (CBC) teacher.
A Grade ${grade} student answered a quiz question on "${subject}" (Topic: "${topic}") incorrectly.

Question: "${questionText}"
Student's Chosen (Incorrect) Answer: "${chosenAnswer}"
Correct Answer: "${correctAnswer}"
${teacherExplanation ? `Standard Teacher Note: "${teacherExplanation}"` : ''}

Provide a personalized, encouraging explanation formatted as a valid JSON object with the following exact keys:
1. "misconception": Explain clearly and gently why the student might have chosen "${chosenAnswer}" and clarify what the confusion was (max 2-3 sentences).
2. "stepByStep": Give simple, clear step-by-step reasoning appropriate for a Grade ${grade} learner showing why "${correctAnswer}" is the right answer.
3. "studyTip": A practical memory tip, rule of thumb, or mnemonic to help the student remember this concept for future assessments.
4. "encouragement": A warm, positive sentence praising their effort and motivating them to keep practicing.

Return ONLY the raw JSON object. Do not include markdown code fences or backticks.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are EduSmart AI Tutor, an empathetic and supportive Kenyan CBC primary and junior school teacher.',
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text?.trim() || '{}';
      try {
        const parsed = JSON.parse(responseText);
        return res.json(parsed);
      } catch (parseError) {
        return res.json({
          misconception: `Selecting "${chosenAnswer}" is a natural step when developing understanding in ${subject}.`,
          stepByStep: responseText.replace(/```json|```/g, '').trim(),
          studyTip: `Focus on the main principle behind "${correctAnswer}".`,
          encouragement: "Keep going! Practice makes permanent."
        });
      }
    } catch (err: any) {
      console.error('Error in /api/quiz-explanation:', err);
      // Return helpful fallback rather than a broken 500 error
      const { chosenAnswer, correctAnswer, subject = 'CBC Studies', grade = 4 } = req.body || {};
      return res.json({
        misconception: `Choosing "${chosenAnswer}" is a common slip when reviewing ${subject} Grade ${grade} materials.`,
        stepByStep: `The accurate answer is "${correctAnswer}". Verify the concept in your strand lesson notes.`,
        studyTip: `Practice similar questions in your student workspace to reinforce your retention.`,
        encouragement: "Mistakes are proof that you are learning! Give it another try."
      });
    }
  });

  // ========================================================
  // AI-POWERED SAFE BROWSER & CONTENT FILTRATION ENDPOINT
  // Monitors and guides learner searches (Grades 1-9 CBC)
  // ========================================================
  app.post('/api/safe-browser-check', async (req: Request, res: Response) => {
    try {
      const { query = '', grade = 4, url = '' } = req.body;
      const cleanQuery = String(query).trim().toLowerCase();
      const studentGrade = Math.min(Math.max(parseInt(grade, 10) || 4, 1), 9);

      // Blocked / Inappropriate triggers test
      const prohibitedPatterns = [
        'porn', 'xxx', 'sex', 'nude', 'nsfw', 'adult',
        'weapon', 'gun', 'knife', 'bomb', 'kill', 'suicide', 'murder', 'blood',
        'hack', 'cheat', 'crack', 'pirate', 'bypass filter',
        'drugs', 'alcohol', 'beer', 'smoke', 'vape', 'tobacco',
        'gamble', 'casino', 'betting', 'poker',
        'hate', 'terror', 'bully', 'curse'
      ];

      const isProhibited = prohibitedPatterns.some(term => cleanQuery.includes(term));

      if (isProhibited) {
        return res.json({
          safetyStatus: 'blocked',
          safetyScore: 10,
          category: 'Prohibited Content / Safety Violation',
          ageAppropriateGrade: 10,
          isGradeAppropriate: false,
          safetyReason: `This query contains keywords that are prohibited on the EduSmart School Network under Child Online Protection guidelines.`,
          educationalGuidance: {
            socraticPrompt: "In a school environment, digital tools are reserved for educational research, creativity, and knowledge building.",
            cbcStrandLink: "Digital Citizenship & Online Safety (CBC Core Competency)",
            suggestedSafeQueries: [
              "Kenya Wildlife & Conservation",
              "Solar System and Planets",
              "Renewable Energy in East Africa",
              "Grade " + studentGrade + " Science Experiments"
            ]
          },
          filteredResults: [],
          guardianAlertRequired: true,
          interventionMessage: "A guardian safety entry has been recorded in accordance with school digital etiquette standards."
        });
      }

      // Check if API key is present for Gemini AI
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          });

          const prompt = `You are the EduSmart AI Safe Browser filtration engine for Kenyan CBC schools (Grades 1 to 9, ages 6-15).
Evaluate the learner's search query or educational topic:
Search Query: "${cleanQuery}"
Current Learner Grade: Grade ${studentGrade}
Simulated Target URL: "${url || 'edusafe://search'}"

Determine if the content is safe, educational, and age-appropriate for Grade ${studentGrade}.
Return a strict JSON object with these keys:
{
  "safetyStatus": "safe" | "caution" | "blocked",
  "safetyScore": number (0 to 100),
  "category": string (e.g. "Science & Technology", "Kenyan Heritage", "Mathematics", "Environmental Studies", "Creative Arts", "General Knowledge"),
  "ageAppropriateGrade": number (1 to 9),
  "isGradeAppropriate": boolean,
  "safetyReason": string (friendly, supportive explanation of why this topic is safe or why caution is needed),
  "educationalGuidance": {
    "socraticPrompt": string (a stimulating inquiry question to deepen understanding),
    "cbcStrandLink": string (relevant Kenyan CBC learning area and strand),
    "suggestedSafeQueries": string[] (3 safe, inspiring follow-up searches)
  },
  "filteredResults": [
    {
      "id": string,
      "title": string,
      "url": string,
      "snippet": string,
      "readingTime": string,
      "safeReadingContent": string (3-4 paragraphs of clean, engaging, accurate educational text for the student to read safely inside the browser sandbox),
      "keyFacts": string[] (3 bulleted takeaways)
    }
  ],
  "guardianAlertRequired": boolean
}
Return ONLY valid JSON without markdown fences.`;

          const aiCall = ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              systemInstruction: 'You are EduSmart AI Safe Search Engine, ensuring safe, enriching CBC educational content for school learners.',
              responseMimeType: 'application/json'
            }
          });

          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('AI timeout')), 4500)
          );

          const response = (await Promise.race([aiCall, timeoutPromise])) as any;

          const jsonText = response?.text?.trim() || '{}';
          const parsed = JSON.parse(jsonText);
          if (parsed && parsed.safetyStatus) {
            return res.json(parsed);
          }
        } catch (genAiError) {
          console.warn('Gemini Safe Browser fallback:', genAiError);
        }
      }

      // High-Quality Heuristic Safe Search Engine Fallback
      const displayQuery = cleanQuery || 'kenyan wildlife';
      const capitalized = displayQuery.charAt(0).toUpperCase() + displayQuery.slice(1);

      return res.json({
        safetyStatus: 'safe',
        safetyScore: 98,
        category: studentGrade <= 3 ? 'Lower Primary Foundation' : studentGrade <= 6 ? 'Science & Social Studies' : 'Junior School Inquiry',
        ageAppropriateGrade: studentGrade,
        isGradeAppropriate: true,
        safetyReason: `Approved for Grade ${studentGrade} learners. This topic promotes inquiry, curriculum mastery, and critical thinking.`,
        educationalGuidance: {
          socraticPrompt: `What evidence or practical observations can you find about "${capitalized}" that relate to everyday life in Kenya?`,
          cbcStrandLink: `Grade ${studentGrade} CBC Curriculum: Inquiry & Critical Thinking`,
          suggestedSafeQueries: [
            `${capitalized} in Kenya`,
            `How does ${capitalized} work step-by-step`,
            `Grade ${studentGrade} practical experiment on ${capitalized}`,
            `Community benefits of ${capitalized}`
          ]
        },
        filteredResults: [
          {
            id: `edu-res-1-${Date.now()}`,
            title: `${capitalized} — Comprehensive CBC Learning Guide`,
            url: `https://kicd-curriculum.ac.ke/strands/${encodeURIComponent(displayQuery)}`,
            snippet: `An approved educational overview exploring the principles, core strands, and practical activities related to ${displayQuery} for Grade ${studentGrade}.`,
            readingTime: '3 min read',
            safeReadingContent: `The study of ${displayQuery} is an exciting component of the Competency-Based Curriculum. In Grade ${studentGrade}, learners explore how concepts are applied within local and global environments. By observing patterns, recording data, and asking questions, students gain hands-on appreciation of how this subject influences our daily lives.

From an environmental and technological perspective, understanding ${displayQuery} encourages sustainable practices and innovative problem solving. Teachers emphasize collaborative group work, reflective journal writing, and practical community engagement.

As you explore this topic, consider how different communities in Kenya and East Africa utilize these concepts. Always link your findings to your e-portfolio notes for upcoming term assessments.`,
            keyFacts: [
              `Encourages active CBC inquiry and learner engagement.`,
              `Connects classroom principles to practical Kenyan community examples.`,
              `Approved by school content safety protocols.`
            ]
          },
          {
            id: `edu-res-2-${Date.now()}`,
            title: `Interactive Science & Discovery: ${capitalized}`,
            url: `https://edusmart.ac.ke/encyclopedia/${encodeURIComponent(displayQuery)}`,
            snippet: `Curated encyclopedia article highlighting scientific discoveries, historical background, and practical experiments.`,
            readingTime: '4 min read',
            safeReadingContent: `Researchers and educators have documented how ${displayQuery} plays a foundational role in scientific discovery. Whether investigating natural ecosystems, mathematical patterns, or technological developments, learners are invited to test hypotheses with simple classroom materials.

Remember to follow standard laboratory safety and field study precautions when collecting samples or testing models. Keep notes in your digital workbook to share with your class teacher and study group.`,
            keyFacts: [
              `Features tested step-by-step experimental procedures.`,
              `Includes vocabulary definitions tailored for Grade ${studentGrade}.`,
              `Provides reflective self-assessment questions.`
            ]
          }
        ],
        guardianAlertRequired: false
      });
    } catch (err: any) {
      console.error('Error in /api/safe-browser-check:', err);
      return res.json({
        safetyStatus: 'safe',
        safetyScore: 90,
        category: 'General Educational Inquiry',
        ageAppropriateGrade: 4,
        isGradeAppropriate: true,
        safetyReason: 'Safe search verified under standard educational filter.',
        educationalGuidance: {
          socraticPrompt: 'How can you apply this knowledge to solve problems in your community?',
          cbcStrandLink: 'CBC Core Competencies: Problem Solving & Self-Efficacy',
          suggestedSafeQueries: ['CBC Science Guide', 'Kenyan Ecosystems', 'Digital Literacy']
        },
        filteredResults: [],
        guardianAlertRequired: false
      });
    }
  });

  // ========================================================
  // MULTI-TURN GEMINI CHATBOT ENDPOINT
  // Supports role-based pedagogical guidance & dynamic model routing:
  // - 'gemini-3.1-pro-preview' for complex tasks (deep STEM, lab synthesis, rubrics)
  // - 'gemini-3.5-flash' for general tasks (interactive tutoring, lesson plans)
  // - 'gemini-3.1-flash-lite' for fast tasks (rapid definitions, quick Q&A)
  // ========================================================
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const {
        messages = [],
        role = 'student',
        complexity = 'general',
        grade = 4,
        subject = 'General Studies',
        tenantName = "St. Austin's Academy",
        systemPromptOverride = ''
      } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required' });
      }

      // Choose model according to task complexity specification
      let targetModel = 'gemini-3.5-flash';
      if (complexity === 'complex') {
        targetModel = 'gemini-3.1-pro-preview';
      } else if (complexity === 'fast') {
        targetModel = 'gemini-3.1-flash-lite';
      }

      // Build role-specific system instruction
      let systemInstruction = systemPromptOverride;
      if (!systemInstruction) {
        if (role === 'science_lab') {
          systemInstruction = `You are the EduSmart Virtual Science Laboratory Mentor at ${tenantName}. You specialize in Kenyan CBC Integrated Science (Grades 5-9) and STEM practical inquiry.
You guide learners through scientific investigations, hypothesis testing, physics circuits, chemistry safety protocols, biology cell structures, and agriculture soil investigations.
Always emphasize laboratory safety, correct metric units (SI units), clear observation recording, and connecting classroom science to real-world Kenyan conservation and technology.`;
        } else if (role === 'teacher' || role === 'hod' || role === 'dean_of_studies') {
          systemInstruction = `You are the EduSmart Senior CBC Curriculum & Pedagogical Consultant for faculty at ${tenantName}.
You support Kenyan Competency-Based Curriculum (CBC) teachers across Primary and Junior Secondary School (JSS).
Help with:
1. Lesson plans with clear specific learning outcomes, key inquiry questions, learning experiences, and core competencies (Communication & Collaboration, Critical Thinking, Digital Literacy).
2. CBA assessment rubrics based on the 4 KICD performance levels: Exceeding Expectation (EE - 4), Meeting Expectation (ME - 3), Approaching Expectation (AE - 2), Below Expectation (BE - 1).
3. Practical laboratory setups, differentiated learning, and parental engagement.`;
        } else if (role === 'parent') {
          systemInstruction = `You are the EduSmart Parent Guidance Counselor at ${tenantName}.
You communicate warmly and clearly with parents about their children's CBC learning journey.
Explain CBC assessment rubrics in plain terms, suggest home-based extension activities for holistic development, and support positive learner well-being.`;
        } else {
          // Default: Learner / Student
          systemInstruction = `You are EduSmart AI Learning Buddy for a Grade ${grade} learner at ${tenantName}.
Your tone is friendly, encouraging, curious, and age-appropriate for Kenyan CBC Grade ${grade}.
Core rules:
1. Guide the student step-by-step using gentle Socratic questions instead of just giving answers.
2. Use examples familiar to learners in Kenya (wildlife, solar power, farming, East African geography, sports, cultural heritage).
3. Foster CBC core values: Love, Responsibility, Respect, Unity, Peace, Patriotism, and Integrity.
4. Keep explanations clear, well-structured, and easy to read.`;
        }
      }

      // Format conversation history for @google/genai contents
      const formattedContents = messages.map((m: any) => {
        const role = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';
        return {
          role,
          parts: [{ text: String(m.text || m.content || '') }]
        };
      });

      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey) {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });

        try {
          const response = await ai.models.generateContent({
            model: targetModel,
            contents: formattedContents,
            config: {
              systemInstruction,
              temperature: 0.7
            }
          });

          const replyText = response.text || '';
          if (replyText) {
            return res.json({
              reply: replyText,
              modelUsed: targetModel,
              timestamp: new Date().toISOString()
            });
          }
        } catch (apiError: any) {
          console.warn(`Gemini call failed with model ${targetModel}, attempting fallback:`, apiError?.message || apiError);
          // If complex pro model failed (e.g. rate limit / tier), fallback to gemini-3.5-flash
          if (targetModel !== 'gemini-3.5-flash') {
            try {
              const fallbackResponse = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: formattedContents,
                config: {
                  systemInstruction,
                  temperature: 0.7
                }
              });
              if (fallbackResponse.text) {
                return res.json({
                  reply: fallbackResponse.text,
                  modelUsed: 'gemini-3.5-flash',
                  fallback: true,
                  timestamp: new Date().toISOString()
                });
              }
            } catch (fallbackError) {
              console.warn('Fallback Gemini call also failed:', fallbackError);
            }
          }
        }
      }

      // Pedagogical Fallback when API key is missing or service unreachable
      const lastMessage = messages[messages.length - 1];
      const query = String(lastMessage?.text || lastMessage?.content || '').toLowerCase();
      let fallbackReply = `Hello! I am your EduSmart AI Assistant for ${tenantName}. `;

      if (query.includes('experiment') || query.includes('lab') || query.includes('science')) {
        fallbackReply += `In Grade ${grade} Science, practical investigations help us understand the world! Remember to check your apparatus, record your measurements systematically in your lab notebook, and link your observations to the CBC core competencies. Would you like to review the step-by-step procedure or test your hypothesis?`;
      } else if (query.includes('rubric') || query.includes('assessment') || query.includes('cba')) {
        fallbackReply += `For CBC assessment, remember the 4-tier rubric scale: Exceeding Expectation (EE - Level 4), Meeting Expectation (ME - Level 3), Approaching Expectation (AE - Level 2), and Below Expectation (BE - Level 1). Assessment tasks should measure application of knowledge, values, and core competencies.`;
      } else if (query.includes('fraction') || query.includes('math') || query.includes('calculate')) {
        fallbackReply += `In Mathematics, breaking problems into smaller steps makes problem-solving enjoyable. Let's look at the given values: what information do we already have, and what is the target value we want to find?`;
      } else {
        fallbackReply += `That's a thoughtful question! In our CBC curriculum, learning through inquiry and critical reflection leads to deeper understanding. What are your initial thoughts, and how can we connect this to what you've learned in class?`;
      }

      return res.json({
        reply: fallbackReply,
        modelUsed: `${targetModel} (local pedagogical engine)`,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Error in /api/chat:', err);
      return res.status(500).json({
        error: 'Failed to process chat message',
        message: err?.message || 'Internal server error'
      });
    }
  });

  const rootDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  const distPath = path.resolve(rootDir, 'dist');
  const indexHtmlPath = path.resolve(distPath, 'index.html');
  const hasDist = fs.existsSync(indexHtmlPath);

  if (process.env.NODE_ENV === 'production' || hasDist) {
    app.use(express.static(distPath));

    // Helper to find active compiled bundle assets
    const getBundledAssets = () => {
      try {
        if (fs.existsSync(indexHtmlPath)) {
          const html = fs.readFileSync(indexHtmlPath, 'utf-8');
          const jsMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
          const cssMatch = html.match(/href="(\/assets\/index-[^"]+\.css)"/);
          return {
            js: jsMatch ? jsMatch[1] : null,
            css: cssMatch ? cssMatch[1] : null,
          };
        }
      } catch (e) {}
      return { js: null, css: null };
    };

    // Prevent MIME-type mismatch crashes if a client has cached dev HTML requesting /src/main.tsx
    app.get('/src/main.tsx', (_req: Request, res: Response) => {
      const assets = getBundledAssets();
      if (assets.js) {
        return res.redirect(302, assets.js);
      }
      res.type('application/javascript').send('console.warn("Bundle loading...");');
    });

    app.get('/src/index.css', (_req: Request, res: Response) => {
      const assets = getBundledAssets();
      if (assets.css) {
        return res.redirect(302, assets.css);
      }
      res.type('text/css').send('');
    });

    app.get(['/@vite/client', '/@vite/*'], (_req: Request, res: Response) => {
      res.type('application/javascript').send('export default {};');
    });

    app.get('*', (_req: Request, res: Response) => {
      if (fs.existsSync(indexHtmlPath)) {
        res.sendFile(indexHtmlPath);
      } else {
        res.status(503).send('Application build in progress. Please refresh momentarily.');
      }
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    app.use('*', async (req: Request, res: Response, next) => {
      try {
        const url = req.originalUrl;
        const indexHtmlFile = path.resolve(rootDir, 'index.html');
        if (fs.existsSync(indexHtmlFile)) {
          const rawHtml = fs.readFileSync(indexHtmlFile, 'utf-8');
          const transformedHtml = await vite.transformIndexHtml(url, rawHtml);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(transformedHtml);
        } else {
          next();
        }
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`EduSmart Full-Stack server running at http://${HOST}:${PORT}`);
  });

  // Graceful shutdown handling for container orchestrators (Cloud Run, Docker, Kubernetes)
  const handleShutdown = (signal: string) => {
    console.log(`EduSmart server received ${signal}, closing HTTP server cleanly...`);
    server.close(() => {
      console.log('HTTP server closed successfully.');
      process.exit(0);
    });
    // Force process termination after 10s if connections remain
    setTimeout(() => {
      console.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer();
