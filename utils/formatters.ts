// Extract utility functions
export const formatDateTime = (timestamp: any) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp.seconds * 1000);
  
  // Format date as mm/dd/yy
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  
  // Format time in 12-hour format with AM/PM
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert to 12-hour format
  
  return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
};
 
export const formatDate = (date: Date | number | string, format?: string) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // If format is specified and matches a specific pattern, use custom formatting
  if (format === 'MMMM d, yyyy') {
    return dateObj.toLocaleDateString('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Default format
  return dateObj.toLocaleDateString('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
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
