/**
 * WhatsApp Integration Utility
 * Handles opening WhatsApp with predefined messages for different scenarios
 */

export const WHATSAPP_PHONE_NUMBER = "919902713551";

export interface WhatsAppMessageOptions {
  phoneNumber?: string;
  message: string;
}

/**
 * Open WhatsApp with a specific phone number and message
 */
export const openWhatsApp = (options: WhatsAppMessageOptions) => {
  const { phoneNumber = WHATSAPP_PHONE_NUMBER, message } = options;
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

/**
 * Predefined messages for different scenarios
 */
export const WHATSAPP_MESSAGES = {
  HOST_INQUIRY: "Hi! I'm interested in your property on Spoto. Could you please provide more details?",
  HOSTING_INTEREST: "Hi! I'm interested in hosting my property on Spoto. Could you please provide more details?",
  GENERAL_INQUIRY: "Hi! I have a question about Spoto. Could you please help me?",
  BOOKING_INQUIRY: "Hi! I have a question about my booking on Spoto. Could you please help me?",
} as const;

/**
 * Convenience functions for common WhatsApp scenarios
 */
export const whatsappUtils = {
  /**
   * Open WhatsApp for host inquiry
   */
  contactHost: (customMessage?: string) => {
    openWhatsApp({
      message: customMessage || WHATSAPP_MESSAGES.HOST_INQUIRY,
    });
  },

  /**
   * Open WhatsApp for hosting interest
   */
  contactForHosting: (customMessage?: string) => {
    openWhatsApp({
      message: customMessage || WHATSAPP_MESSAGES.HOSTING_INTEREST,
    });
  },

  /**
   * Open WhatsApp for general inquiry
   */
  contactSupport: (customMessage?: string) => {
    openWhatsApp({
      message: customMessage || WHATSAPP_MESSAGES.GENERAL_INQUIRY,
    });
  },

  /**
   * Open WhatsApp for booking inquiry
   */
  contactForBooking: (customMessage?: string) => {
    openWhatsApp({
      message: customMessage || WHATSAPP_MESSAGES.BOOKING_INQUIRY,
    });
  },
};
