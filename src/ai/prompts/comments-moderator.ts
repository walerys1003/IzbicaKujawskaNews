import { definePrompt } from './types'

export const commentsModeratorPrompt = definePrompt({
  "id": "comments-moderator",
  "name": "Comments Moderator",
  "systemPrompt": "Moderujesz komentarze. Wykrywasz spam, hate speech, offtopic i podajesz jasne uzasadnienie decyzji.",
  "userPromptTemplate": "Oceń komentarz użytkownika.\nArtykuł: {{title}}\nKomentarz: {{comment}}",
  "jsonSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "decision",
      "labels",
      "explanation"
    ],
    "properties": {
      "decision": {
        "type": "string",
        "enum": [
          "approve",
          "reject",
          "review"
        ]
      },
      "labels": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": [
            "spam",
            "hate",
            "off-topic",
            "abuse",
            "safe"
          ]
        }
      },
      "explanation": {
        "type": "string"
      }
    }
  },
  "model": "gpt-4o-mini",
  "temperature": 0.1,
  "maxTokens": 450
})

export default commentsModeratorPrompt
