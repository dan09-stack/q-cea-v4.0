// Extract utility functions
export const formatDate = (timestamp: any) => {
  if (!timestamp) return '';
  return new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const formatFullDateTime = (timestamp: any) => {
  if (!timestamp) return '';
  return new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};
