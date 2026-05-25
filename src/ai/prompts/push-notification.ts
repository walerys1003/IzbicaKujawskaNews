import { definePrompt } from './types'

export const pushNotificationPrompt = definePrompt({
  "id": "push-notification",
  "name": "Push Notification",
  "systemPrompt": "Tworzysz krótki push notification do 80 znaków.",
  "userPromptTemplate": "Przygotuj push do 80 znaków.\nTytuł: {{title}}\nTreść: {{content}}",
  "jsonSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "message",
      "length"
    ],
    "properties": {
      "message": {
        "type": "string"
      },
      "length": {
        "type": "integer",
        "minimum": 0,
        "maximum": 80
      }
    }
  },
  "model": "gpt-4o-mini",
  "temperature": 0.3,
  "maxTokens": 220
})

export default pushNotificationPrompt
