/**
 * Format user email for display
 */
export const formatEmail = (email) => {
  return email?.toLowerCase() || '';
};

/**
 * Check if user data is complete
 */
export const isUserDataComplete = (user) => {
  return user && user.email && user.id;
};

/**
 * Safely get nested object properties
 */
export const getNestedProperty = (obj, path, defaultValue = null) => {
  const value = path.split('.').reduce((current, prop) => current?.[prop], obj);
  return value ?? defaultValue;
};
