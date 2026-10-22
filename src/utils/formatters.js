/**
 * Data Formatters and String Helpers
 */

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export const truncateHash = (hash, front = 8, back = 6) => {
  if (!hash || typeof hash !== 'string') return '—';
  if (hash.length <= front + back + 3) return hash;
  return `${hash.slice(0, front)}...${hash.slice(-back)}`;
};

export const getDocumentTypeLabel = (type) => {
  const map = {
    offer_letter: 'Offer Letter',
    letter_of_intent: 'Letter of Intent',
    experience_letter: 'Experience Letter',
    relieving_letter: 'Relieving Letter'
  };
  return map[type] || type || 'Employment Document';
};

export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'U';
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
};
