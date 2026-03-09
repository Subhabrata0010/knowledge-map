/**
 * Input validation and sanitization utilities with security features
 */

import { ValidationError } from './errors';

/**
 * SQL Injection patterns to block
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
  /(;|\-\-|\/\*|\*\/|xp_|sp_)/gi,
  /('|(--)|;|\/\*|\*\/|@@|@|char|nchar|varchar|nvarchar|alter|begin|cast|create|cursor|declare|delete|drop|end|exec|execute|fetch|insert|kill|open|select|sys|sysobjects|syscolumns|table|update)/gi,
];

/**
 * XSS patterns to block
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers like onclick=, onload=
  /<embed/gi,
  /<object/gi,
  /<img[^>]+src[^>]*>/gi,
  /eval\(/gi,
  /expression\(/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
];

/**
 * Sanitize input to prevent SQL injection and XSS
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Check for SQL injection patterns
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      throw new ValidationError('Input contains potentially malicious SQL patterns');
    }
  }

  // Check for XSS patterns
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(sanitized)) {
      throw new ValidationError('Input contains potentially malicious script patterns');
    }
  }

  // HTML entity encode special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized;
}

export class Validator {
  static validateTopic(topic: string): string {
    if (!topic || typeof topic !== 'string') {
      throw new ValidationError('Topic must be a non-empty string');
    }

    const trimmed = topic.trim();
    
    if (trimmed.length === 0) {
      throw new ValidationError('Topic cannot be empty');
    }

    if (trimmed.length > 200) {
      throw new ValidationError('Topic must be less than 200 characters');
    }

    // Check for malicious patterns (SQL injection, XSS)
    try {
      sanitizeInput(trimmed);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Topic validation failed');
    }

    // Allow alphanumeric, spaces, hyphens, underscores
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
      throw new ValidationError('Topic contains invalid characters. Only letters, numbers, spaces, hyphens, and underscores are allowed');
    }

    // Additional security: Check for excessive character repetition
    if (/(.)\1{5,}/.test(trimmed)) {
      throw new ValidationError('Topic contains suspicious character patterns');
    }

    // Basic sanitization
    const sanitized = trimmed.replace(/[<>\"]/g, '');
    
    return sanitized;
  }

  static validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      
      // Block localhost and internal IPs
      if (
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname.startsWith('192.168.') ||
        parsed.hostname.startsWith('10.') ||
        parsed.hostname.startsWith('172.')
      ) {
        return false;
      }

      // Only allow http and https
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static sanitizeInput(input: string): string {
    return input.replace(/[<>\"'`]/g, '');
  }
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Remove all HTML tags except safe ones
  const safeTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li'];
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  
  return html.replace(tagPattern, (match, tag) => {
    if (safeTags.includes(tag.toLowerCase())) {
      return match;
    }
    return '';
  });
}

/**
 * Rate limiting key generator
 */
export function generateRateLimitKey(identifier: string, endpoint: string): string {
  const sanitizedId = identifier.replace(/[^a-zA-Z0-9]/g, '');
  const sanitizedEndpoint = endpoint.replace(/[^a-zA-Z0-9/_-]/g, '');
  
  return `ratelimit:${sanitizedEndpoint}:${sanitizedId}`;
}
