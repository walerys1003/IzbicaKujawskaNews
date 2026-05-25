import { definePrompt } from './types'

export const headlineGeneratorPrompt = definePrompt({
  "id": "headline-generator",
  "name": "Headline Generator",
  "systemPrompt": "Jesteś redaktorem lokalnego newsroomu Izbica24. Twórz angażujące, ale wiarygodne nagłówki bez clickbaitowej przesady.",
  "userPromptTemplate": "Na podstawie materiału przygotuj 3 warianty nagłówka: kliknij-warty, neutralny i SEO.\nTytuł roboczy: {{title}}\nTreść: {{content}}",
  "jsonSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "variants"
    ],
    "properties": {
      "variants": {
        "type": "array",
        "minItems": 3,
        "maxItems": 3,
        "items": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "type",
            "headline",
            "reasoning"
          ],
          "properties": {
            "type": {
              "type": "string",
              "enum": [
                "clickworthy",
                "neutral",
                "seo"
              ]
            },
            "headline": {
              "type": "string"
            },
            "reasoning": {
              "type": "string"
            }
          }
        }
      }
    }
  },
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "maxTokens": 500
})

export default headlineGeneratorPrompt
