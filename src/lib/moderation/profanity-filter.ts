const PROFANITY = ['cholera', 'idiota', 'debil', 'kurde', 'głupek']

export const hasProfanity = (text: string): boolean => {
  const normalized = text.toLowerCase()
  return PROFANITY.some((word) => normalized.includes(word))
}

export const sanitizeProfanity = (text: string): string => {
  let output = text
  for (const word of PROFANITY) {
    const mask = `${word[0]}${'*'.repeat(Math.max(word.length - 2, 1))}${word[word.length - 1]}`
    output = output.replace(new RegExp(word, 'gi'), mask)
  }
  return output
}
