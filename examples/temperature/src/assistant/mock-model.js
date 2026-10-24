// Atrapa modelu do testów: deterministyczna, bez kosztów i bez sieci.
// Sprawdza całą otoczkę (narzędzia, schemat, strażnicy), a nie jakość prawdziwego modelu.
const DISCLAIMER = 'hipoteza, nie diagnoza';

export function mockModel(deviceId) {
  return async messages => {
    const toolResult = messages.findLast(m => m.role === 'tool' && m.name === 'get_error_stats');
    if (!toolResult) return { tool: 'get_error_stats', args: { device_id: deviceId, window: 50 } };

    const s = JSON.parse(toolResult.content);
    const base = { confidence: 'low', disclaimer: DISCLAIMER };

    if (!s.enoughData) {
      return { final: { ...base, verdict: 'insufficient_data', hypothesis: 'Za mało pomiarów, żeby cokolwiek twierdzić.', evidence: [`pomiarów: ${s.total}`], nextSteps: ['Zbierz więcej pomiarów'] } };
    }
    if (s.periodEvery) {
      return { final: { ...base, confidence: 'medium', verdict: 'anomaly', hypothesis: `Błędy co ${s.periodEvery}. pomiar sugerują przyczynę cykliczną (procedura, operator, cykl pompy).`, evidence: [`odstęp między błędami: ${s.periodEvery}`, `błędy: ${s.faults}/${s.total}`], nextSteps: ['Sprawdź, co dzieje się co kilka pomiarów', 'Porównaj z innym aparatem'] } };
    }
    if (s.currentStreak >= 3) {
      return { final: { ...base, confidence: 'medium', verdict: 'anomaly', hypothesis: 'Seria błędów na końcu sugeruje usterkę aparatu, nie całej linii.', evidence: [`seria błędów: ${s.currentStreak}`, `błędy: ${s.faults}/${s.total}`], nextSteps: ['Sprawdź czujnik, zasilanie, kabel', 'Sprawdź, czy inne aparaty też zgłaszają błędy'] } };
    }
    if (s.faultRate > 0.2) {
      return { final: { ...base, verdict: 'anomaly', hypothesis: 'Wysoki odsetek błędów bez wyraźnego wzorca.', evidence: [`odsetek błędów: ${s.faultRate}`], nextSteps: ['Obserwuj dalej', 'Sprawdź kondycję aparatu'] } };
    }
    return { final: { ...base, confidence: 'high', verdict: 'no_anomaly', hypothesis: 'Brak niepokojącego wzorca błędów.', evidence: [`odsetek błędów: ${s.faultRate}`], nextSteps: [] } };
  };
}
