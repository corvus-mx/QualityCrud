export const CAR_TYPES = {
  DMT: 'dmt',
  NDMT: 'ndmt'
};

export const generateDMTId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `DMT-${timestamp}-${random}`.toUpperCase();
};
