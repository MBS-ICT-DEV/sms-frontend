/**
 * Validation utilities for all forms
 */

/*
 * Nigerian phone numbers, mirrors the backend rules in
 * sms-backend/utils/phone.js. Accepted inputs:
 *   08012345678 | 8012345678 | +2348012345678 | 2348012345678
 * Spaces, dashes and parentheses are ignored. Every accepted value is
 * normalized to E.164 (+2348012345678) before it is sent to the API.
 * Phone numbers are never unique — siblings may share one guardian number.
 */
const LOCAL_NUMBER_PATTERN = /^0[789]\d{9}$/;
const LOCAL_NUMBER_WITHOUT_ZERO_PATTERN = /^[789]\d{9}$/;
const INTERNATIONAL_NUMBER_PATTERN = /^234[789]\d{9}$/;

export const PHONE_VALIDATION_MESSAGE =
  'Enter a valid Nigerian phone number (e.g. 08012345678 or +2348012345678)';

export const normalizeNigerianPhone = (value) => {
  if (value === null || value === undefined) return null;

  const digits = String(value).replace(/[^\d+]/g, '').replace(/\+/g, '');

  if (!digits) return null;

  if (LOCAL_NUMBER_PATTERN.test(digits)) return `+234${digits.slice(1)}`;
  if (LOCAL_NUMBER_WITHOUT_ZERO_PATTERN.test(digits)) return `+234${digits}`;
  if (INTERNATIONAL_NUMBER_PATTERN.test(digits)) return `+${digits}`;

  return null;
};

export const isValidNigerianPhone = (value) =>
  normalizeNigerianPhone(value) !== null;

export const validators = {
  // Email validation
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) || 'Invalid email address';
  },

  // Password validation (min 6 chars)
  password: (value) => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return true;
  },

  // Phone validation (Nigerian format, normalized to E.164 on submit)
  phone: (value) => {
    if (value === null || value === undefined || String(value).trim() === '') {
      return 'Phone number is required';
    }
    return isValidNigerianPhone(value) || PHONE_VALIDATION_MESSAGE;
  },

  // Optional phone: empty is valid, anything else must be a Nigerian number
  optionalPhone: (value) => {
    if (value === null || value === undefined || String(value).trim() === '') {
      return true;
    }
    return isValidNigerianPhone(value) || PHONE_VALIDATION_MESSAGE;
  },

  // Name validation (alphabetic + spaces)
  name: (value) => {
    if (!value || value.trim().length === 0) return 'Name is required';
    if (value.length < 2) return 'Name must be at least 2 characters';
    if (!/^[a-zA-Z\s]+$/.test(value)) return 'Name can only contain letters and spaces';
    return true;
  },

  // Registration number (alphanumeric)
  registrationNumber: (value) => {
    if (!value) return 'Registration number is required';
    if (!/^[A-Z0-9\-\/]+$/.test(value)) return 'Invalid registration number format';
    return true;
  },

  // Class code
  classCode: (value) => {
    if (!value) return 'Class code is required';
    if (!/^[A-Z0-9]{2,10}$/.test(value)) return 'Class code must be 2-10 alphanumeric characters';
    return true;
  },

  // Required field
  required: (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return 'This field is required';
    }
    return true;
  },

  // Number validation
  number: (value) => {
    if (isNaN(value) || value === '') return 'Must be a number';
    return true;
  },

  // Score validation (0-100)
  score: (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'Score must be a number';
    if (num < 0 || num > 100) return 'Score must be between 0 and 100';
    return true;
  },

  // URL validation
  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return 'Invalid URL';
    }
  },

  // File validation
  file: (file, allowedTypes = []) => {
    if (!file) return 'File is required';
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `File type must be one of: ${allowedTypes.join(', ')}`;
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) return 'File size must be less than 10MB';
    return true;
  },

  // Excel file validation
  excelFile: (file) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    return validators.file(file, validTypes);
  },

  // Date validation
  date: (value) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Invalid date';
    return true;
  },

  // Date not in past
  futureDate: (value) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Invalid date';
    if (date < new Date()) return 'Date cannot be in the past';
    return true;
  },

  // Date not in future
  pastDate: (value) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Invalid date';
    if (date > new Date()) return 'Date cannot be in the future';
    return true;
  },

  // Range validation
  minLength: (min) => (value) => {
    if (!value || value.length < min) return `Must be at least ${min} characters`;
    return true;
  },

  maxLength: (max) => (value) => {
    if (value && value.length > max) return `Must be no more than ${max} characters`;
    return true;
  },

  // Custom regex
  pattern: (regex, message) => (value) => {
    return regex.test(value) || message;
  },

  // Match field (for confirm password, etc.)
  match: (compareValue, fieldName = 'field') => (value) => {
    return value === compareValue || `Does not match ${fieldName}`;
  },
};

/**
 * Validate form data
 * @param {Object} data - Form data to validate
 * @param {Object} schema - Validation schema { fieldName: [validator1, validator2, ...] }
 * @returns {Object} - { isValid: bool, errors: {} }
 */
export const validateForm = (data, schema) => {
  const errors = {};

  for (const field in schema) {
    const validatorList = Array.isArray(schema[field]) ? schema[field] : [schema[field]];

    for (const validator of validatorList) {
      const result = validator(data[field]);
      if (result !== true) {
        errors[field] = result;
        break; // Stop at first error for this field
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Get error message for a field
 */
export const getFieldError = (errors, fieldName) => {
  return errors[fieldName] || '';
};

/**
 * Check if field has error
 */
export const hasFieldError = (errors, fieldName) => {
  return !!errors[fieldName];
};

/**
 * Common validation schemas
 */
export const validationSchemas = {
  login: {
    email: [validators.required, validators.email],
    password: [validators.required, validators.password],
  },

  createStudent: {
    firstName: [validators.required, validators.name],
    lastName: [validators.required, validators.name],
    email: [validators.required, validators.email],
    phoneNumber: [validators.phone],
    classId: [validators.required],
  },

  createClass: {
    name: [validators.required, validators.name],
    code: [validators.required, validators.classCode],
  },

  uploadResults: {
    file: [validators.required, validators.excelFile],
    classId: [validators.required],
    term: [validators.required],
  },

  uploadAssignment: {
    title: [validators.required, validators.minLength(3)],
    file: [validators.required, validators.file],
    description: [validators.minLength(10)],
  },

  markAttendance: {
    classId: [validators.required],
    date: [validators.required, validators.pastDate],
  },

  approveResults: {
    comment: [validators.minLength(5)],
  },
};

export default {
  validators,
  validateForm,
  getFieldError,
  hasFieldError,
  validationSchemas,
  normalizeNigerianPhone,
  isValidNigerianPhone,
  PHONE_VALIDATION_MESSAGE,
};
