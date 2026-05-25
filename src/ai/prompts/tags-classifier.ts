import { definePrompt } from './types'

export const tagsClassifierPrompt = definePrompt({
  "id": "tags-classifier",
  "name": "Tags Classifier",
  "systemPrompt": "Klasyfikujesz tekst do kategorii portalu izbica24 oraz proponujesz trafne sub-tagi.",
  "userPromptTemplate": "Skategoryzuj materiał.\nTytuł: {{title}}\nTreść: {{content}}",
  "jsonSchema": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "primaryCategory",
      "confidence",
      "subTags"
    ],
    "properties": {
      "primaryCategory": {
        "type": "string",
        "enum": [
          "samorzad",
          "kultura",
          "sport",
          "historia",
          "ludzie",
          "zycie",
          "edukacja",
          "zdrowie",
          "srodowisko",
          "rolnictwo",
          "komunikaty",
          "spoleczne",
          "solectwa",
          "multimedia",
          "opinie",
          "ogloszenia",
          "na-sygnale",
          "inwestycje",
          "turystyka",
          "religia",
          "biznes",
          "wydarzenia"
        ]
      },
      "confidence": {
        "type": "number",
        "minimum": 0,
        "maximum": 1
      },
      "subTags": {
        "type": "array",
        "minItems": 2,
        "maxItems": 8,
        "items": {
          "type": "string"
        }
      }
    }
  },
  "model": "gpt-4o-mini",
  "temperature": 0.1,
  "maxTokens": 450
})

export default tagsClassifierPrompt
