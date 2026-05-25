import { definePrompt } from './types'

export const translatePlEnPrompt = definePrompt({
  "id": "translate-pl-en",
  "name": "Translate PL to EN",
  "systemPrompt": "Tłumaczysz tekst z polskiego na naturalny angielski dla turystów. Zachowujesz nazwy własne i lokalny kontekst.",
  "userPromptTemplate": "Przetłumacz materiał z polskiego na angielski.\nTreść: {{content}}",
  "jsonSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "translation"
    ],
    "properties": {
      "translation": {
        "type": "string"
      }
    }
  },
  "model": "claude-3-5-sonnet",
  "temperature": 0.2,
  "maxTokens": 700
})

export default translatePlEnPrompt
