import headlineGeneratorPrompt from './headline-generator'
import leadWriterPrompt from './lead-writer'
import summaryTldrPrompt from './summary-tldr'
import seoMetaPrompt from './seo-meta'
import factCheckerPrompt from './fact-checker'
import toneRewriterPrompt from './tone-rewriter'
import quoteExtractorPrompt from './quote-extractor'
import tagsClassifierPrompt from './tags-classifier'
import imagePromptGeneratorPrompt from './image-prompt-generator'
import socialSnippetsPrompt from './social-snippets'
import newsletterBlurbPrompt from './newsletter-blurb'
import pushNotificationPrompt from './push-notification'
import translatePlEnPrompt from './translate-pl-en'
import plainLanguagePrompt from './plain-language'
import commentsModeratorPrompt from './comments-moderator'

export const ALL_PROMPTS = [
  headlineGeneratorPrompt,
  leadWriterPrompt,
  summaryTldrPrompt,
  seoMetaPrompt,
  factCheckerPrompt,
  toneRewriterPrompt,
  quoteExtractorPrompt,
  tagsClassifierPrompt,
  imagePromptGeneratorPrompt,
  socialSnippetsPrompt,
  newsletterBlurbPrompt,
  pushNotificationPrompt,
  translatePlEnPrompt,
  plainLanguagePrompt,
  commentsModeratorPrompt,
] as const

export const getPromptById = (id: string) => ALL_PROMPTS.find(prompt => prompt.id === id)
