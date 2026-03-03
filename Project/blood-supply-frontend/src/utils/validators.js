export const validators = {
  email: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email) ? null : 'Invalid email address';
  },

  required: (value, fieldName) => {
    return value && value.trim() ? null : `${fieldName} is required`;
  },

  minLength: (value, min, fieldName) => {
    return value.length >= min ? null : `${fieldName} must be at least ${min} characters`;
  },

  maxLength: (value, max, fieldName) => {
    return value.length <= max ? null : `${fieldName} must be less than ${max} characters`;
  },

  number: (value, fieldName) => {
    return !isNaN(value) && value > 0 ? null : `${fieldName} must be a valid number`;
  },

  phone: (phone) => {
    const regex = /^\+?[\d\s-]{10,}$/;
    return regex.test(phone) ? null : 'Invalid phone number';
  },

  bloodType: (type) => {
    const validTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    return validTypes.includes(type) ? null : 'Invalid blood type';
  },

  date: (date) => {
    const selected = new Date(date);
    const now = new Date();
    return selected >= now ? null : 'Date must be in the future';
  },

  password: (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  },
};

export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = rules[field];
    
    if (Array.isArray(fieldRules)) {
      fieldRules.forEach(rule => {
        const error = rule(value);
        if (error && !errors[field]) {
          errors[field] = error;
        }
      });
    } else {
      const error = fieldRules(value);
      if (error) {
        errors[field] = error;
      }
    }
  });
  
  return errors;
};