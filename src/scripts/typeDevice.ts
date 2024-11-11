export const isTouchDevice = () => {
  if (typeof window !== "undefined" && window.innerWidth < 1300) {
      return 'ontouchstart' in window;
  }
  return false;
};
