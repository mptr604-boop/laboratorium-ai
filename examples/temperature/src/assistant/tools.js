import { z } from 'zod';
import { contract, STATUSES, TEMPERATURE_RANGE } from '../contract.js';
import { errorStats } from '../stats.js';

// Wyłącznie odczyt. Nie ma tu żadnego narzędzia zapisującego, więc model nic nie zmieni,
// nawet jeśli ktoś wstrzyknie mu instrukcję w danych.
export function createTools(store) {
  return {
    get_error_stats: {
      args: z.object({ device_id: z.number().int().positive(), window: z.number().int().min(1).max(500).default(50) }),
      run: ({ device_id, window }) => errorStats(store.recentStatuses(device_id, window)),
    },
    get_recent_measurements: {
      args: z.object({ device_id: z.number().int().positive(), limit: z.number().int().min(1).max(100).default(20) }),
      run: ({ device_id, limit }) => store.recentStatuses(device_id, limit),
    },
    describe_contract: {
      args: z.object({}),
      run: () => ({ contract, statuses: STATUSES, temperatureRange: TEMPERATURE_RANGE }),
    },
  };
}
