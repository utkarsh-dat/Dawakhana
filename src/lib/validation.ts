
/**
 * Validates an Indian mobile number.
 * Must be 10 digits and start with 6, 7, 8, or 9.
 */
export const isValidIndianPhoneNumber = (phone: string): boolean => {
    // Remove any +91 prefix or spaces/dashes
    const cleanPhone = phone.replace(/^(\+91|91)/, "").replace(/[\s-]/g, "");
    return /^[6-9]\d{9}$/.test(cleanPhone);
};

/**
 * Validates an Indian PIN code.
 * Must be 6 digits and not start with 0.
 */
export const isValidIndianPostalCode = (pincode: string): boolean => {
    const cleanPin = pincode.replace(/\s/g, "");
    return /^[1-9][0-9]{5}$/.test(cleanPin);
};

/**
 * Validates a name (First or Last).
 * Must be at least 2 characters and contain only letters and spaces.
 */
export const isValidName = (name: string): boolean => {
    return /^[a-zA-Z\s]{2,}$/.test(name.trim());
};

/**
 * Validates an address.
 * Must be at least 10 characters long to ensure it's not gibberish.
 * Can be made more complex if needed.
 */
export const isValidAddress = (address: string): boolean => {
    return address.trim().length >= 10;
};
