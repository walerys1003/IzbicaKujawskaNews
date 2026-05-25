import { definePrompt } from './types'

export const leadWriterPrompt = definePrompt({
  "id": "lead-writer",
  "name": "Lead Writer",
  "systemPrompt": "Piszesz zwięzłe leady informacyjne po polsku dla portalu lokalnego. Zachowujesz zasadę 5W i limit około 280 znaków.",
  "userPromptTemplate": "Napisz lead 280 znaków na podstawie materiału.\nTytuł: {{title}}\nTreść: {{content}}",
  "jsonSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "lead",
      "fiveW"
    ],
    "properties": {
      "lead": {
        "type": "string"
      },
      "fiveW": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "who",
          "what",
          "when",
          "where",
          "why"
        ],
        "properties": {
          "who": {
            "type": "string"
          },
          "what": {
            "type": "string"
          },
          "when": {
            "type": "string"
          },
          "where": {
            "type": "string"
          },
          "why": {
            "type": "string"
          }
        }
      }
    }
  },
  "model": "claude-3-5-sonnet",
  "temperature": 0.4,
  "maxTokens": 400
})

export default leadWriterPrompt
