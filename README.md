# laboratorium-ai

Asystent AI dla [laboratorium-iot](https://github.com/mptr604-boop/laboratorium-iot): wykrywa wzorce błędów aparatów i podpowiada, co sprawdzić.
Kod liczy, AI interpretuje, człowiek zatwierdza.

Status i ograniczenia: [docs/STATUS.md](./docs/STATUS.md). Decyzje: [docs/USTALENIA.md](./docs/USTALENIA.md).

## Szybki start

```bash
cd examples/temperature
npm install
npm test          # 24 testy, bez sieci i bez modelu
npm run demo      # asystent z atrapą modelu (reguły)
```

Przykład ESP32 + DHT11 (szkic i opis): [examples/esp32-dht11](./examples/esp32-dht11).

## Prawdziwy model: lokalna Ollama (za darmo)

Adapter `src/assistant/llm-model.js` mówi protokołem OpenAI (`chat/completions`). Adres, klucz i model pochodzą ze zmiennych środowiskowych, więc ten sam kod działa z lokalną Ollamą, z OpenAI i z innymi serwerami o takim interfejsie.

**1. Instalacja (Linux):**

```bash
curl -fsSL https://ollama.com/install.sh | sh     # wymaga sudo
# bez roota: pobierz ollama-linux-amd64.tar.zst z https://ollama.com/download i rozpakuj do ~/.local/ollama
```

Na macOS i Windows: instalator z [ollama.com/download](https://ollama.com/download).

**2. Model i serwer:**

```bash
ollama pull qwen2.5:3b       # ok. 1,9 GB, działa na CPU
ollama serve                 # jeśli nie działa jako usługa (domyślnie localhost:11434)
```

**3. Uruchomienie asystenta:**

```bash
cd examples/temperature
LAB_AI_URL=http://localhost:11434/v1/chat/completions \
LAB_AI_KEY=ollama \
LAB_AI_MODEL=qwen2.5:3b \
npm run demo:llm
```

`LAB_AI_KEY` może być dowolnym tekstem (Ollama go nie sprawdza), ale adapter wymaga, by był ustawiony.

**Inne serwery:** dla OpenAI pomiń `LAB_AI_URL` (domyślny adres), ustaw prawdziwy klucz i nazwę modelu. Klucz trzymaj tylko w zmiennej środowiskowej, nigdy w repo.

**Czego się spodziewać:** model 3B jest mały. W teście 2 z 4 przypadków przeszły, a 2 odrzuciły strażniki (schemat odpowiedzi, kontrola werdyktu przy małej próbce), więc zła odpowiedź nie wychodzi do użytkownika. Wyniki i wnioski: [docs/STATUS.md](./docs/STATUS.md). Do lepszych wyników użyj większego modelu (np. 7B).
