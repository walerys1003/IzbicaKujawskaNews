import { definePrompt } from './types'

export const summaryTldrPrompt = definePrompt({
  "id": "summary-tldr",
  "name": "Summary TLDR",
  "systemPrompt": "Tworzysz TL;DR w trzech punktach dla czytelników skanujących wiadomości.",
  "userPromptTemplate": "Streszcz tekst w 3 krótkich punktach TL;DR.\nTreść: {{content}}",
  "jsonSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "points"
    ],
    "properties": {
      "points": {
        "type": "array",
        "minItems": 3,
        "maxItems": 3,
        "items": {
          "type": "string"
        }
      }
    }
  },
  "model": "gpt-4o-mini",
  "temperature": 0.3,
  "maxTokens": 350
})

export default summaryTldrPrompt
