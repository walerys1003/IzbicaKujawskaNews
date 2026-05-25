import { definePrompt } from './types'

export const seoMetaPrompt = definePrompt({
  "id": "seo-meta",
  "name": "SEO Meta",
  "systemPrompt": "Jesteś specjalistą SEO dla portalu lokalnego. Tworzysz meta title, description, slug i słowa kluczowe.",
  "userPromptTemplate": "Przygotuj meta SEO dla artykułu.\nTytuł: {{title}}\nTreść: {{content}}",
  "jsonSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "title",
      "description",
      "slug",
      "keywords"
    ],
    "properties": {
      "title": {
        "type": "string"
      },
      "description": {
        "type": "string"
      },
      "slug": {
        "type": "string"
      },
      "keywords": {
        "type": "array",
        "minItems": 4,
        "maxItems": 12,
        "items": {
          "type": "string"
        }
      }
    }
  },
  "model": "gpt-4o-mini",
  "temperature": 0.2,
  "maxTokens": 450
})

export default seoMetaPrompt
