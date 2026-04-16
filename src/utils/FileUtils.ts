/**
 * Utility to handle file validations and formatting
 */
export const fileUtils = {
  ALLOWED_TYPES: {
    DOCUMENTS: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ],
  },

  validateFile: (file, allowedTypes = null, maxSizeMB = 50) => {
    // Default to DOCUMENTS if no types provided
    const types = allowedTypes || fileUtils.ALLOWED_TYPES.DOCUMENTS;

    if (!file) return { valid: false, error: "No file selected" };

    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSizeMB) {
      return { valid: false, error: `File size exceeds ${maxSizeMB}MB` };
    }

    if (!types.includes(file.type)) {
      return { valid: false, error: "Invalid format. Only PDF, Word, or Images allowed." };
    }

    return { valid: true };
  },

  prepareFormData: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      // Only append if data exists
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return formData;
  },
};
