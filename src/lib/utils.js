export const useDebounce = (value, delay) => {
  return value; // Simplified until full implementation if needed (or React 18 / 19 hooks)
};

export const generateId = () => Math.random().toString(36).substr(2, 9);
