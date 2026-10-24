import { z } from 'zod';

// Jedyny kształt odpowiedzi, jaki przyjmujemy od modelu. Wszystko poza schematem jest odrzucane.
export const AnalysisSchema = z.object({
  verdict: z.enum(['anomaly', 'no_anomaly', 'insufficient_data']),
  hypothesis: z.string().min(1).max(500),
  evidence: z.array(z.string().min(1).max(200)).min(1).max(5),
  confidence: z.enum(['low', 'medium', 'high']),
  nextSteps: z.array(z.string().min(1).max(200)).max(5),
  disclaimer: z.literal('hipoteza, nie diagnoza'),
});

// Model może zrobić tylko jedną z dwóch rzeczy: poprosić o narzędzie albo oddać wynik.
export const ModelTurnSchema = z.union([
  z.object({ tool: z.string(), args: z.record(z.string(), z.unknown()).default({}) }),
  z.object({ final: z.unknown() }),
]);
