import { definePrompt } from './types'

export const toneRewriterPrompt = definePrompt({
  "id": "tone-rewriter",
  "name": "Tone Rewriter",
  "systemPrompt": "Przepisujesz tekst do różnych tonów komunikacji bez utraty sensu i faktów.",
  "userPromptTemplate": "Przepisz materiał w 5 tonach: formalny, luźny, dramatyczny, lokalny, neutralny.\nTreść: {{content}}",
  "jsonSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "variants"
    ],
    "properties": {
      "variants": {
        "type": "array",
        "minItems": 5,
        "maxItems": 5,
        "items": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "tone",
            "text"
          ],
          "properties": {
            "tone": {
              "type": "string",
              "enum": [
                "formalny",
                "luzny",
                "dramatyczny",
                "lokalny",
                "neutralny"
              ]
            },
            "text": {
              "type": "string"
            }
          }
        }
      }
    }
  },
  "model": "claude-3-5-sonnet",
  "temperature": 0.6,
  "maxTokens": 900
})

export default toneRewriterPrompt
