// @ts-nocheck
import popupManager from '@/components/warehouse/PopupMessage';

type MessageType = 'info' | 'success' | 'error' | 'warning';

interface MessageObject {
  message: string;
  type?: MessageType;
}

// Main function to replace alert()
const showMessage = (message: string | MessageObject, type: MessageType = 'info'): void => {
  // Handle different message formats
  if (typeof message === 'object' && message.message) {
    return popupManager.show(message.message, message.type || type);
  }
  
  // Auto-detect type based on message content if not specified
  if (type === 'info' && typeof message === 'string') {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('error') || lowerMessage.includes('failed') || lowerMessage.includes('invalid')) {
      type = 'error';
    } else if (lowerMessage.includes('warning') || lowerMessage.includes('already')) {
      type = 'warning';
    } else if (lowerMessage.includes('success') || lowerMessage.includes('saved') || lowerMessage.includes('loaded')) {
      type = 'success';
    }
  }
  
  return popupManager.show(message as string, type);
};

// Convenience methods
showMessage.info = (message: string): void => popupManager.info(message);
showMessage.success = (message: string): void => popupManager.success(message);
showMessage.error = (message: string): void => popupManager.error(message);
showMessage.warning = (message: string): void => popupManager.warning(message);

export default showMessage;
