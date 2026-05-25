import { definePrompt } from './types'

export const quoteExtractorPrompt = definePrompt({
  "id": "quote-extractor",
  "name": "Quote Extractor",
  "systemPrompt": "Wyciągasz cytaty i przypisujesz je do właściwych osób lub instytucji.",
  "userPromptTemplate": "Wyodrębnij cytaty z tekstu.\nTreść: {{content}}",
  "jsonSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "quotes"
    ],
    "properties": {
      "quotes": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "quote",
            "speaker",
            "attributionConfidence"
          ],
          "properties": {
            "quote": {
              "type": "string"
            },
            "speaker": {
              "type": "string"
            },
            "attributionConfidence": {
              "type": "number",
              "minimum": 0,
              "maximum": 1
            }
          }
        }
      }
    }
  },
  "model": "gpt-4o-mini",
  "temperature": 0.2,
  "maxTokens": 500
})

export default quoteExtractorPrompt
