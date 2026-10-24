# Instrukcje dla agentów

1. **Najpierw przeczytaj [docs/STATUS.md](./docs/STATUS.md)**: stan, mapa plików, znane problemy, decyzje. Nie skanuj całego repo, jeśli to wystarcza.
2. Szczegóły zakresu: `docs/USTALENIA.md`. Wzorzec architektury: `docs/WZORZEC.md`.
3. Po każdej zmianie kodu lub decyzji zaktualizuj `docs/STATUS.md` (stan funkcji, problemy, dziennik zmian) w tym samym commicie.
4. Zasady: kod liczy, AI interpretuje, człowiek zatwierdza. Model dostaje tylko narzędzia do odczytu. Nie dodawaj zależności ani funkcji „na zapas".
5. Komentarze po polsku, identyfikatory po angielsku. Testy: `cd examples/temperature && npm test`, smoke: `./scripts/smoke.sh`.
6. Nie dodawaj remote i nie wypychaj repo bez wyraźnej zgody użytkownika.
