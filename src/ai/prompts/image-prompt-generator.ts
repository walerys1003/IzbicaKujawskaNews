import { definePrompt } from './types'

export const imagePromptGeneratorPrompt = definePrompt({
  "id": "image-prompt-generator",
  "name": "Image Prompt Generator",
  "systemPrompt": "Tworzysz prompt do generatora obrazów dla hero image artykułu. Prompt ma być precyzyjny i fotorealistyczny.",
  "userPromptTemplate": "Przygotuj prompt do DALL-E / Stable Diffusion dla hero image.\nTytuł: {{title}}\nTreść: {{content}}",
  "jsonSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "prompt",
      "negativePrompt",
      "style"
    ],
    "properties": {
      "prompt": {
        "type": "string"
      },
      "negativePrompt": {
        "type": "string"
      },
      "style": {
        "type": "string"
      }
    }
  },
  "model": "claude-3-5-sonnet",
  "temperature": 0.7,
  "maxTokens": 500
})

export default imagePromptGeneratorPrompt
