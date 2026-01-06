import cors from 'cors';
import express, { type Request, type Response } from 'express';
import { defineSecret, defineString } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';

const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');
const OPENAI_MODEL = defineString('OPENAI_MODEL', { default: 'gpt-4o-mini' });

const InputSchema = z
  .object({
    name: z.string().min(2),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

    unknownBirthTime: z.boolean().optional().default(false),
    birthTimeApprox: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .nullable()
      .optional()
      .default(null),

    country: z.string().min(2),
    city: z.string().min(2),

    timezone: z.string().min(1).optional().default('UTC'),
  })
  .superRefine((val, ctx) => {
    if (!val.unknownBirthTime && !val.birthTimeApprox) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'birthTimeApprox is required unless unknownBirthTime=true',
        path: ['birthTimeApprox'],
      });
    }
  });

// JSON Schema for Structured Outputs
const AstralCardSchema = {
  name: 'astral_card',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'solarSign',
      'lunarSign',
      'ascendantSign',
      'stelliumSign',
      'hemispheres',
      'keyElements',
      'composition',
      'elementalEnergiesAndUsage',
      'regentHouse',
      'lunarNodes',
      'summary',
      'disclaimers',
    ],
    properties: {
      solarSign: { type: 'string' },
      lunarSign: { type: 'string' },
      ascendantSign: { type: 'string' },
      stelliumSign: { type: ['string', 'null'] },

      hemispheres: {
        type: 'object',
        additionalProperties: false,
        required: ['north', 'south', 'note'],
        properties: {
          north: { type: 'string' },
          south: { type: 'string' },
          note: { type: 'string' },
        },
      },

      keyElements: {
        type: 'array',
        items: { enum: ['Fire', 'Earth', 'Air', 'Water'] },
        minItems: 1,
      },

      composition: {
        type: 'object',
        additionalProperties: false,
        required: ['Fire', 'Earth', 'Air', 'Water', 'note'],
        properties: {
          Fire: { type: 'number', minimum: 0, maximum: 100 },
          Earth: { type: 'number', minimum: 0, maximum: 100 },
          Air: { type: 'number', minimum: 0, maximum: 100 },
          Water: { type: 'number', minimum: 0, maximum: 100 },
          note: { type: 'string' },
        },
      },

      elementalEnergiesAndUsage: {
        type: 'object',
        additionalProperties: false,
        required: ['Fire', 'Earth', 'Air', 'Water', 'practicalTips'],
        properties: {
          Fire: { type: 'string' },
          Earth: { type: 'string' },
          Air: { type: 'string' },
          Water: { type: 'string' },
          practicalTips: { type: 'array', items: { type: 'string' }, minItems: 3 },
        },
      },

      regentHouse: {
        type: 'object',
        additionalProperties: false,
        required: ['house', 'regentPlanet', 'meaning'],
        properties: {
          house: { type: 'string' },
          regentPlanet: { type: 'string' },
          meaning: { type: 'string' },
        },
      },

      lunarNodes: {
        type: 'object',
        additionalProperties: false,
        required: ['northNode', 'southNode'],
        properties: {
          northNode: {
            type: 'object',
            additionalProperties: false,
            required: ['sign', 'house', 'themes'],
            properties: {
              sign: { type: 'string' },
              house: { type: 'string' },
              themes: { type: 'array', items: { type: 'string' }, minItems: 2 },
            },
          },
          southNode: {
            type: 'object',
            additionalProperties: false,
            required: ['sign', 'house', 'themes'],
            properties: {
              sign: { type: 'string' },
              house: { type: 'string' },
              themes: { type: 'array', items: { type: 'string' }, minItems: 2 },
            },
          },
        },
      },

      summary: { type: 'string' },
      disclaimers: { type: 'array', items: { type: 'string' }, minItems: 1 },
    },
  },
};

async function callOpenAIJsonSchema(args: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  schema: any;
}) {
  const resp = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: args.model,
      input: [
        { role: 'system', content: args.system },
        { role: 'user', content: args.user },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: args.schema.name ?? 'output',
          strict: true,
          schema: args.schema.schema ?? args.schema,
        },
      },
    }),
  });

  const raw = await resp.text();
  if (!resp.ok) throw new Error(`OpenAI error ${resp.status}: ${raw}`);

  const json = JSON.parse(raw);
  const outputText: string =
    (json.output_text as string | undefined) ??
    (json.output?.[0]?.content?.[0]?.text as string | undefined) ??
    '';

  if (!outputText.trim()) throw new Error('OpenAI returned empty output_text.');

  return JSON.parse(outputText);
}

// ✅ IMPORTANT: name this apiApp (NOT api)
const apiApp = express();
apiApp.use(cors({ origin: true }));
apiApp.use(express.json({ limit: '1mb' }));

apiApp.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

apiApp.post('/api/astral-card', async (req: Request, res: Response) => {
  const parsed = InputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

  const { name, birthDate, birthTimeApprox, unknownBirthTime, country, city, timezone } =
    parsed.data;

  const system = `
You are an astrology assistant.
Return ONLY valid JSON matching the provided schema.
No extra keys, no markdown, no commentary.
Be transparent if birth time is unknown/approximate.
`.trim();

  const user = `
Inputs:
- Name: ${name}
- Birth date: ${birthDate}
- Birth time: ${unknownBirthTime ? 'UNKNOWN' : birthTimeApprox}
- Place: ${city}, ${country}
- Timezone: ${timezone}

Output must include:
- Stellium sign
- North & South hemispheres emphasis
- Key elements and % composition (aim for ~100 total)
- Elemental energies & practical usage
- Solar, Lunar, Ascendant signs
- Regent house
- Lunar nodes (north/south) sign + house + themes
- Summary + disclaimers

If birth time is UNKNOWN:
- Solar + lunar should still be best-effort
- Ascendant/houses/nodes may be approximate or must be clearly disclosed in disclaimers
`.trim();

  try {
    const data = await callOpenAIJsonSchema({
      apiKey: OPENAI_API_KEY.value(),
      model: OPENAI_MODEL.value(),
      system,
      user,
      schema: AstralCardSchema,
    });

    return res.json(data);
  } catch (e: any) {
    console.error(e?.message ?? e);
    return res.status(500).json({
      message: 'Failed to generate astral card.',
      details: String(e?.message ?? e),
    });
  }
});

// ✅ Export the HTTPS Function named "api"
export const api = onRequest(
  {
    region: 'europe-west1',
    secrets: [OPENAI_API_KEY],
  },
  apiApp
);
