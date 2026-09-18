export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isText = (value, max) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max

export const isOptionalText = (value, max) =>
  value === undefined || value === null || (typeof value === 'string' && value.length <= max)

export const isList = (value) =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.length <= 20 &&
  value.every((item) => typeof item === 'string' && item.length <= 50)

export const isEmail = (value) => isText(value, 200) && EMAIL_PATTERN.test(value.trim())
