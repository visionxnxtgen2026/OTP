/**
 * Canonical Phone Normalizer for DDS Auth
 * Normalizes any variation of an Indian mobile number into canonical E.164 (+91XXXXXXXXXX)
 * Examples:
 *   "8637628773"       -> "+918637628773"
 *   "+91 86376 28773"  -> "+918637628773"
 *   "+91-8637628773"   -> "+918637628773"
 *   "08637628773"      -> "+918637628773"
 *   "+918637628773"    -> "+918637628773"
 */
export function normalizeMobile(input) {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Mobile number is required' }
  }

  // Remove all whitespace, dashes, parentheses, dots
  let cleaned = input.trim().replace(/[\s\-\(\)\.]/g, '')

  // Remove leading '+' for initial parsing
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1)
  }

  // Handle leading 0 (e.g. 08637628773)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1)
  }

  let countryCode = '+91'
  let nationalNumber = ''

  if (cleaned.startsWith('91') && cleaned.length === 12) {
    nationalNumber = cleaned.substring(2)
  } else if (cleaned.length === 10) {
    nationalNumber = cleaned
  } else {
    return {
      isValid: false,
      error: 'Invalid mobile number format. Must be a 10-digit number.'
    }
  }

  // Ensure nationalNumber contains only digits
  if (!/^\d{10}$/.test(nationalNumber)) {
    return {
      isValid: false,
      error: 'Mobile number must contain exactly 10 digits.'
    }
  }

  const canonical = `${countryCode}${nationalNumber}`

  return {
    isValid: true,
    canonical,
    countryCode,
    nationalNumber,
    formatted: `${countryCode} ${nationalNumber.slice(0, 5)} ${nationalNumber.slice(5)}`
  }
}
