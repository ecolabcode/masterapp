import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const port = Number(process.env.PORT || 8787);

// --- Safety checks
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️ OPENAI_API_KEY is not set. Create server/.env with OPENAI_API_KEY=...');
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------------------------
// Input validation (matches your frontend)
// ---------------------------
const InputSchema = z
  .object({
    name: z.string().min(2),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    unknownBirthTime: z.boolean().optional().default(false),
    birthTimeApprox: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .nullable()
      .optional(),
    country: z.string().min(2),
    city: z.string().min(2),
    timezone: z.string().min(3).optional(),
  })
  .superRefine((data, ctx) => {
    // If time is NOT unknown, require birthTimeApprox
    if (!data.unknownBirthTime) {
      if (!data.birthTimeApprox) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['birthTimeApprox'],
          message: 'birthTimeApprox is required unless unknownBirthTime=true',
        });
      }
    }
  });

// ---------------------------
// Output schema (Zod) – parsed directly by the SDK
// ---------------------------
const AstralCardZod = z.object({
  solarSign: z.string(),
  lunarSign: z.string(),
  ascendantSign: z.string(),
  stelliumSign: z.string().nullable(),

  hemispheres: z.object({
    north: z.string(),
    south: z.string(),
    note: z.string(),
  }),

  keyElements: z.array(z.enum(['Fire', 'Earth', 'Air', 'Water'])).min(1),

  composition: z.object({
    Fire: z.number().min(0).max(100),
    Earth: z.number().min(0).max(100),
    Air: z.number().min(0).max(100),
    Water: z.number().min(0).max(100),
    note: z.string(),
  }),

  elementalEnergiesAndUsage: z.object({
    Fire: z.string(),
    Earth: z.string(),
    Air: z.string(),
    Water: z.string(),
    practicalTips: z.array(z.string()).min(3),
  }),

  regentHouse: z.object({
    house: z.string(),
    regentPlanet: z.string(),
    meaning: z.string(),
  }),

  lunarNodes: z.object({
    northNode: z.object({
      sign: z.string(),
      house: z.string(),
      themes: z.array(z.string()).min(2),
    }),
    southNode: z.object({
      sign: z.string(),
      house: z.string(),
      themes: z.array(z.string()).min(2),
    }),
  }),

  summary: z.string(),
  disclaimers: z.array(z.string()).min(1),
});

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/astral-card', async (req, res) => {
  const parsed = InputSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid input',
      issues: parsed.error.issues,
    });
  }

  const { name, birthDate, birthTimeApprox, unknownBirthTime, country, city, timezone } =
    parsed.data;

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  // NOTE: Structured Outputs via json_schema are supported in GPT-4o+ era models
  // and the docs show using responses.parse with zodTextFormat. :contentReference[oaicite:2]{index=2}

  const system = `
You are an astrology assistant.
You MUST return a single JSON object that matches the provided schema exactly.
Be transparent: if birth time is unknown/approximate, ascendant/houses/nodes may be approximate or set to best-effort.
No markdown. No extra keys.
  `.trim();

  const user = `
Inputs:
- Name: ${name}
- Birth date: ${birthDate}
- Birth time: ${unknownBirthTime ? 'UNKNOWN' : birthTimeApprox}
- Location: ${city}, ${country}
- Timezone: ${timezone ?? 'not provided'}

Output must include:
- Stellium sign
- North & South hemisphere emphasis
- Key elements and % composition (aim for ~100 total)
- Elemental energies & practical usage
- Solar, Lunar, Ascendant signs (Ascendant may be approximate/unknown if time is unknown)
- Regent house
- Lunar nodes (north/south) sign + house + themes
- Summary + disclaimers
  `.trim();

  try {
    const response = await client.responses.parse({
      model,
      input: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      text: {
        format: zodTextFormat(AstralCardZod, 'astral_card'),
      },
    });

    // Parsed output (no manual JSON.parse)
    const data = response.output_parsed;

    if (!data) {
      // This should be rare; but return something useful if it happens
      return res.status(502).json({
        message: 'Model did not return parseable structured output.',
        output_text: response.output_text ?? null,
      });
    }

    return res.json(data);
  } catch (e: any) {
    // Return real status and helpful details to the frontend
    const status = e?.status || e?.response?.status || 500;

    console.error('❌ OpenAI call failed');
    console.error('Status:', status);
    console.error('Message:', e?.message);
    console.error('Error:', e?.error);
    console.error('Response data:', e?.response?.data);

    return res.status(status).json({
      message: e?.message || 'Failed to generate astral card.',
      status,
      details: e?.error || e?.response?.data || null,
    });
  }
});

app.listen(port, () => {
  console.log(`✅ Backend running on http://localhost:${port}`);
  console.log(`✅ Health check: http://localhost:${port}/health`);
});

const RatingMove = z.object({
  type: z.enum(['upgrade', 'downgrade']),
  name: z.string(),
  symbol: z.string(),
  gradingCompany: z.string(),
  previousGrade: z.string(),
  newGrade: z.string(),
  previousPrice: z.number().nullable(),
  newPrice: z.number().nullable(),
  currentPrice: z.number().nullable(),
});

const FinancialAdvisorZod = z.object({
  generatedAt: z.string(),
  upgrades: z.array(RatingMove).length(6),
  downgrades: z.array(RatingMove).length(6),
  disclaimers: z.array(z.string()).min(1),
});

app.get('/api/financial-advisor', async (_req, res) => {
  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const now = new Date().toISOString();

    const system = `
You are a market assistant.
Return ONLY valid JSON matching the provided schema.
No markdown, no extra keys.
If you do not know real-time prices, set previousPrice/newPrice/currentPrice to null.
`.trim();

    const user = `
Prompt:
get 6 Upgrades & 6 Downgrades of today of Stocks from any Analysts.
Provide the Name, Symbol, gradingCompany, Previous Grade, New Grade, Previous Price, New Price & Current Price.
Set generatedAt="${now}".
Return exactly 6 upgrades and 6 downgrades.
Include disclaimers.
`.trim();

    const response = await client.responses.parse({
      model,
      input: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      text: { format: zodTextFormat(FinancialAdvisorZod, 'financial_advisor') },
    });

    const data = response.output_parsed;
    if (!data) return res.status(502).json({ message: 'Model did not return structured output.' });

    return res.json(data);
  } catch (e: any) {
    const status = e?.status || 500;
    console.error('financial-advisor failed:', status, e?.message, e?.error);
    return res
      .status(status)
      .json({ message: e?.message || 'Failed.', status, details: e?.error || null });
  }
});
