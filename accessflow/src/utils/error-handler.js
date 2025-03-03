/**
 * Error types for better categorization
 */
export const ErrorTypes = {
  API_ERROR: 'api_error',
  NETWORK_ERROR: 'network_error',
  AUTH_ERROR: 'auth_error',
  USER_INPUT_ERROR: 'user_input_error',
  PROCESSING_ERROR: 'processing_error',
  UNKNOWN_ERROR: 'unknown_error'
};

/**
 * Handles errors and returns user-friendly messages
 */
export class ErrorHandler {
  /**
   * Get user-friendly error message based on error type
   * 
   * @param {Error} error - The error object
   * @param {string} context - Context where the error occurred
   * @returns {Object} Object containing error message, type and details
   */
  static handleError(error, context = '') {
    // Default error object
    let errorObject = {
      message: 'An unknown error occurred.',
      type: ErrorTypes.UNKNOWN_ERROR,
      details: error?.message || '',
      context: context,
      original: error
    };
    
    // Network errors
    if (!navigator.onLine || error?.name === 'NetworkError' || error?.message?.includes('network')) {
      errorObject = {
        message: 'Please check your internet connection and try again.',
        type: ErrorTypes.NETWORK_ERROR,
        details: 'Unable to connect to the server.',
        context: context,
        original: error
      };
    } 
    // API key errors
    else if (error?.message?.includes('API key') || error?.message?.includes('authorization') || error?.message?.includes('auth')) {
      errorObject = {
        message: 'There was a problem with your API key. Please check your settings.',
        type: ErrorTypes.AUTH_ERROR,
        details: error?.message || 'API key validation failed.',
        context: context,
        original: error
      };
    } 
    // API errors (e.g., from Gemini)
    else if (error?.message?.includes('API') || context === 'api') {
      errorObject = {
        message: 'There was a problem with the AI service. Please try again later.',
        type: ErrorTypes.API_ERROR,
        details: error?.message || 'API request failed.',
        context: context,
        original: error
      };
    }
    // User input errors
    else if (error?.message?.includes('input') || context === 'input') {
      errorObject = {
        message: error?.message || 'Please check your input and try again.',
        type: ErrorTypes.USER_INPUT_ERROR,
        details: 'Invalid or missing user input.',
        context: context,
        original: error
      };
    }
    // Text processing errors
    else if (context === 'processing') {
      errorObject = {
        message: 'There was a problem processing your text. Please try again.',
        type: ErrorTypes.PROCESSING_ERROR,
        details: error?.message || 'Text processing failed.',
        context: context,
        original: error
      };
    }
    
    // Log the error for debugging
    console.error(`AccessFlow Error [${errorObject.type}]:`, {
      message: errorObject.message,
      details: errorObject.details,
      context: errorObject.context,
      originalError: error
    });
    
    return errorObject;
  }
  
  /**
   * Display error in UI
   * 
   * @param {Object} errorObject - Error object from handleError
   * @param {Element} container - Container to display error
   * @returns {Element} - The error element that was created
   */
  static displayError(errorObject, container) {
    if (!container) return null;
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = `accessflow-error error-type-${errorObject.type}`;
    
    // Create error content
    const errorContent = `
      <div class="error-message">${errorObject.message}</div>
      ${errorObject.details ? `<div class="error-details">${errorObject.details}</div>` : ''}
      ${errorObject.type === ErrorTypes.NETWORK_ERROR ? 
        '<button class="accessflow-button retry-button">Retry</button>' : ''}
    `;
    
    errorElement.innerHTML = errorContent;
    
    // Add retry functionality for network errors
    if (errorObject.type === ErrorTypes.NETWORK_ERROR) {
      const retryButton = errorElement.querySelector('.retry-button');
      if (retryButton) {
        retryButton.addEventListener('click', () => {
          // Dispatch retry event
          const retryEvent = new CustomEvent('accessflow-retry', {
            bubbles: true,
            detail: { context: errorObject.context }
          });
          container.dispatchEvent(retryEvent);
        });
      }
    }
    
    // Clear container and add error
    container.innerHTML = '';
    container.appendChild(errorElement);
    
    return errorElement;
  }
  
  /**
   * Handle network connectivity changes
   * 
   * @param {Function} onlineCallback - Callback when online
   * @param {Function} offlineCallback - Callback when offline
   */
  static monitorConnectivity(onlineCallback, offlineCallback) {
    window.addEventListener('online', () => {
      onlineCallback && onlineCallback();
    });
    
    window.addEventListener('offline', () => {
      offlineCallback && offlineCallback();
    });
  }
  
  /**
   * Create an error object
   * 
   * @param {string} message - Error message
   * @param {string} type - Error type from ErrorTypes
   * @param {string} details - Additional details
   * @returns {Error} Custom error
   */
  static createError(message, type = ErrorTypes.UNKNOWN_ERROR, details = '') {
    const error = new Error(message);
    error.type = type;
    error.details = details;
    return error;
  }
}

/**
 * Add global error handling for uncaught errors
 */
export function setupGlobalErrorHandling() {
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    
    // Prevent default error handling
    event.preventDefault();
    
    // Display error notification
    try {
      const errorObject = ErrorHandler.handleError(event.error, 'global');
      
      // Create notification element
      const notification = document.createElement('div');
      notification.className = 'accessflow-feedback error';
      notification.textContent = errorObject.message;
      
      // Add to page
      document.body.appendChild(notification);
      
      // Remove after 5 seconds
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.remove();
        }
      }, 5000);
    } catch (handlingError) {
      // Last resort error display
      console.error('Error in error handler:', handlingError);
    }
    
    return true;
  });
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent default handling
    event.preventDefault();
    
    // Use our error handler
    const errorObject = ErrorHandler.handleError(event.reason, 'promise');
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'accessflow-feedback error';
    notification.textContent = errorObject.message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.remove();
      }
    }, 5000);
    
    return true;
  });
}