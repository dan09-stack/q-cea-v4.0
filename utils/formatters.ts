// Extract utility functions
export const formatDate = (timestamp: any) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp.seconds * 1000);
  
  // Format as mm/dd/yr
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2); // Get last 2 digits
  
  return `${month}/${day}/${year}`;
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
