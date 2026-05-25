import { definePrompt } from './types'

export const plainLanguagePrompt = definePrompt({
  "id": "plain-language",
  "name": "Plain Language B1",
  "systemPrompt": "Upraszasz tekst do poziomu B1 dla seniorów i czytelników o niższej biegłości językowej.",
  "userPromptTemplate": "Uprość tekst do poziomu B1.\nTreść: {{content}}",
  "jsonSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "simplifiedText",
      "keyChanges"
    ],
    "properties": {
      "simplifiedText": {
        "type": "string"
      },
      "keyChanges": {
        "type": "array",
        "items": {
          "type": "string"
        }
      }
    }
  },
  "model": "claude-3-5-sonnet",
  "temperature": 0.3,
  "maxTokens": 700
})

export default plainLanguagePrompt
