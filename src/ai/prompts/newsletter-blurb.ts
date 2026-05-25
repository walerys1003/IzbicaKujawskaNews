import { definePrompt } from './types'

export const newsletterBlurbPrompt = definePrompt({
  "id": "newsletter-blurb",
  "name": "Newsletter Blurb",
  "systemPrompt": "Piszesz krótki blurb do newslettera — 1-2 zdania zachęcające do kliknięcia.",
  "userPromptTemplate": "Przygotuj blurb newslettera.\nTytuł: {{title}}\nTreść: {{content}}",
  "jsonSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "blurb"
    ],
    "properties": {
      "blurb": {
        "type": "string"
      }
    }
  },
  "model": "gpt-4o-mini",
  "temperature": 0.4,
  "maxTokens": 260
})

export default newsletterBlurbPrompt
