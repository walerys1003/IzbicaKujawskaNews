import { definePrompt } from './types'

export const factCheckerPrompt = definePrompt({
  "id": "fact-checker",
  "name": "Fact Checker",
  "systemPrompt": "Wykrywasz ryzykowne twierdzenia i nieścisłości w tekście redakcyjnym. Nie wymyślaj faktów, tylko oznaczaj wątpliwości.",
  "userPromptTemplate": "Przeanalizuj tekst pod kątem nieścisłości i zwróć listę zdań wymagających weryfikacji.\nTreść: {{content}}",
  "jsonSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "issues"
    ],
    "properties": {
      "issues": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "sentence",
            "riskLevel",
            "reason"
          ],
          "properties": {
            "sentence": {
              "type": "string"
            },
            "riskLevel": {
              "type": "string",
              "enum": [
                "low",
                "medium",
                "high"
              ]
            },
            "reason": {
              "type": "string"
            }
          }
        }
      }
    }
  },
  "model": "claude-3-5-sonnet",
  "temperature": 0.1,
  "maxTokens": 700
})

export default factCheckerPrompt
