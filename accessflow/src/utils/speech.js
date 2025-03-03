/**
 * Speech handler for text-to-speech functionality
 */
export default class SpeechHandler {
  constructor(options = {}) {
    this.speaking = false;
    this.paused = false;
    this.utterance = null;
    this.currentElement = null;
    this.options = {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      ...options
    };
    
    // Check if speech synthesis is available
    this.available = 'speechSynthesis' in window;
    
    if (this.available) {
      // Initialize speech synthesis
      this.synth = window.speechSynthesis;
    }
  }
  
  /**
   * Set speech options
   * @param {Object} options - Speech options (rate, pitch, volume)
   */
  setOptions(options) {
    this.options = {
      ...this.options,
      ...options
    };
    
    if (this.utterance && this.speaking) {
      // Update current utterance if speaking
      this.utterance.rate = this.options.rate;
      this.utterance.pitch = this.options.pitch;
      this.utterance.volume = this.options.volume;
    }
  }
  
  /**
   * Speak the text content of an element
   * @param {Element} element - Element containing text to read
   */
  speak(element) {
    if (!this.available || !element) return;
    
    // Stop any current speech
    this.stop();
    
    this.currentElement = element;
    const text = element.textContent;
    
    if (!text.trim()) return;
    
    // Create utterance
    this.utterance = new SpeechSynthesisUtterance(text);
    
    // Set options
    this.utterance.rate = this.options.rate;
    this.utterance.pitch = this.options.pitch;
    this.utterance.volume = this.options.volume;
    
    // Set up event handlers for highlighting
    this.setupHighlighting();
    
    // Set flag
    this.speaking = true;
    this.paused = false;
    
    // Start speaking
    this.synth.speak(this.utterance);
  }
  
  /**
   * Stop speaking
   */
  stop() {
    if (!this.available || !this.speaking) return;
    
    this.synth.cancel();
    this.speaking = false;
    this.paused = false;
    this.utterance = null;
    
    // Remove any highlighting
    this.removeHighlighting();
  }
  
  /**
   * Pause speech
   */
  pause() {
    if (!this.available || !this.speaking || this.paused) return;
    
    this.synth.pause();
    this.paused = true;
  }
  
  /**
   * Resume speech
   */
  resume() {
    if (!this.available || !this.speaking || !this.paused) return;
    
    this.synth.resume();
    this.paused = false;
  }
  
  /**
   * Toggle pause/resume
   */
  togglePause() {
    if (this.paused) {
      this.resume();
    } else {
      this.pause();
    }
  }
  
  /**
   * Set up word highlighting during speech
   */
  setupHighlighting() {
    if (!this.utterance || !this.currentElement) return;
    
    // Since we can't reliably highlight words during speech with the basic API,
    // we'll provide visual indication that the text is being read in other ways
    this.currentElement.classList.add('being-read');
    
    // End event
    this.utterance.onend = () => {
      this.removeHighlighting();
      this.speaking = false;
      this.paused = false;
      this.utterance = null;
      
      // Dispatch custom event when reading is complete
      const event = new CustomEvent('accessflow-reading-complete', { 
        bubbles: true 
      });
      this.currentElement.dispatchEvent(event);
    };
    
    // Error event
    this.utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.removeHighlighting();
      this.speaking = false;
      this.utterance = null;
    };
  }
  
  /**
   * Remove highlighting
   */
  removeHighlighting() {
    if (!this.currentElement) return;
    
    this.currentElement.classList.remove('being-read');
  }
}
