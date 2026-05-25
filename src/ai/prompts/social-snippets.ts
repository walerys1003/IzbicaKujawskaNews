import { definePrompt } from './types'

export const socialSnippetsPrompt = definePrompt({
  "id": "social-snippets",
  "name": "Social Snippets",
  "systemPrompt": "Tworzysz krótkie warianty wpisów społecznościowych dla Facebooka, X i Instagrama.",
  "userPromptTemplate": "Przygotuj warianty social postów.\nTytuł: {{title}}\nTreść: {{content}}",
  "jsonSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "facebook",
      "x",
      "instagram"
    ],
    "properties": {
      "facebook": {
        "type": "string"
      },
      "x": {
        "type": "string"
      },
      "instagram": {
        "type": "string"
      }
    }
  },
  "model": "gpt-4o-mini",
  "temperature": 0.6,
  "maxTokens": 650
})

export default socialSnippetsPrompt
