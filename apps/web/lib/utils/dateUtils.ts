export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) {
    return "Not available";
  }

  try {
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${dateString}`);
      return "Invalid date";
    }

    return date.toLocaleDateString();
  } catch (error) {
    console.warn(`Error parsing date: ${dateString}`, error);
    return "Invalid date";
  }
};

export const formatDateTime = (
  dateString: string | undefined | null,
): string => {
  if (!dateString) {
    return "Not available";
  }

  try {
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${dateString}`);
      return "Invalid date";
    }

    return date.toLocaleString();
  } catch (error) {
    console.warn(`Error parsing date: ${dateString}`, error);
    return "Invalid date";
  }
};
