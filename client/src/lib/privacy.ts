/**
 * Privacy masking utilities for ClaimSignal
 * Masks sensitive data to protect homeowner privacy and prevent legal issues
 */

/**
 * Mask a claim number - shows only last 4 characters
 * Example: "0001064902" -> "***-4902"
 */
export function maskClaimNumber(claimId: string): string {
  if (!claimId) return '';
  if (claimId.length <= 4) return claimId;
  return `***-${claimId.slice(-4)}`;
}

/**
 * Mask a person's name - shows first letter of each word
 * Example: "John Smith" -> "J*** S***"
 */
export function maskName(name: string): string {
  if (!name) return '';
  return name.split(' ').map(word => {
    if (word.length <= 1) return word;
    return word[0] + '***';
  }).join(' ');
}

/**
 * Mask a street address - shows only first part and city
 * Example: "123 Main Street, Houston, TX 77001" -> "123 M*** St, Houston"
 */
export function maskAddress(address: string): string {
  if (!address) return '';
  
  // Split by comma to get parts
  const parts = address.split(',').map(p => p.trim());
  
  if (parts.length === 0) return '';
  
  // Mask the street part (first part)
  const streetParts = parts[0].split(' ');
  const maskedStreet = streetParts.map((word, idx) => {
    // Keep house number (first item if numeric)
    if (idx === 0 && /^\d+$/.test(word)) return word;
    // Mask street name
    if (word.length <= 2) return word;
    return word[0] + '***';
  }).join(' ');
  
  // If there's a city, add it
  if (parts.length > 1) {
    return `${maskedStreet}, ${parts[1]}`;
  }
  
  return maskedStreet;
}

/**
 * Mask an email address
 * Example: "john.smith@email.com" -> "j***@e***.com"
 */
export function maskEmail(email: string): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  
  const domainParts = domain.split('.');
  const maskedDomain = domainParts.map((part, idx) => {
    if (idx === domainParts.length - 1) return part; // Keep TLD
    if (part.length <= 1) return part;
    return part[0] + '***';
  }).join('.');
  
  const maskedLocal = local.length <= 1 ? local : local[0] + '***';
  
  return `${maskedLocal}@${maskedDomain}`;
}

/**
 * Mask a phone number - shows only last 4 digits
 * Example: "(555) 123-4567" -> "***-4567"
 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  // Extract just digits
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;
  return `***-${digits.slice(-4)}`;
}
