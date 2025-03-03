/**
 * Speech handler for text-to-speech functionality with synchronized highlighting
 */
export default class SpeechHandler {
  constructor(options = {}) {
    this.speaking = false;
    this.paused = false;
    this.utterance = null;
    this.currentElement = null;
    this.highlightedElements = [];
    this.wordBoundaryPositions = [];
    this.currentWordIndex = -1;
    this.highlightColor = options.highlightColor || 'rgba(66, 133, 244, 0.3)';
    
    this.options = {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      voiceName: null,
      ...options
    };
    
    // Check if speech synthesis is available
    this.available = 'speechSynthesis' in window;
    
    if (this.available) {
      // Initialize speech synthesis
      this.synth = window.speechSynthesis;
      
      // Get available voices
      this.voices = [];
      this.fetchVoices();
      
      // Voice change handler
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.fetchVoices();
        };
      }
    }
  }
  
  /**
   * Fetch available voices
   */
  fetchVoices() {
    if (!this.available) return [];
    
    this.voices = this.synth.getVoices();
    return this.voices;
  }
  
  /**
   * Get available voices
   */
  getVoices() {
    return this.voices || [];
  }
  
  /**
   * Set speech options
   * @param {Object} options - Speech options (rate, pitch, volume, voiceName, highlightColor)
   */
  setOptions(options) {
    this.options = {
      ...this.options,
      ...options
    };
    
    if (options.highlightColor) {
      this.highlightColor = options.highlightColor;
    }
    
    if (this.utterance && this.speaking) {
      // Update current utterance if speaking
      this.utterance.rate = this.options.rate;
      this.utterance.pitch = this.options.pitch;
      this.utterance.volume = this.options.volume;
      
      // Voice can't be changed on an active utterance
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
    
    // Prepare the element for highlighting by wrapping words
    this.prepareElementForHighlighting(element);
    
    // Create utterance
    this.utterance = new SpeechSynthesisUtterance(text);
    
    // Set options
    this.utterance.rate = this.options.rate;
    this.utterance.pitch = this.options.pitch;
    this.utterance.volume = this.options.volume;
    
    // Set voice if specified
    if (this.options.voiceName && this.voices.length > 0) {
      const voice = this.voices.find(v => v.name === this.options.voiceName);
      if (voice) {
        this.utterance.voice = voice;
      }
    }
    
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
   * Prepare element for word-by-word highlighting
   * @param {Element} element - The element to prepare
   */
  prepareElementForHighlighting(element) {
    // Store original content for restoration later
    this.originalContent = element.innerHTML;
    
    // Get the original text
    const originalText = element.textContent;
    
    // Split the text into words and punctuation
    const words = originalText.match(/\S+\s*/g) || [];
    
    // Clear the element
    element.textContent = '';
    
    // Create spans for each word and add them to the element
    this.wordBoundaryPositions = [];
    let charPosition = 0;
    
    words.forEach((word) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'accessflow-word';
      wordSpan.textContent = word;
      element.appendChild(wordSpan);
      
      this.wordBoundaryPositions.push({
        start: charPosition,
        end: charPosition + word.length,
        element: wordSpan
      });
      
      charPosition += word.length;
    });
    
    this.highlightedElements = Array.from(element.querySelectorAll('.accessflow-word'));
  }
  
  /**
   * Handle word boundary events for highlighting
   * @param {number} charIndex - Character index in the text
   */
  handleWordBoundary(charIndex) {
    // Find the word span that contains this character position
    const position = this.wordBoundaryPositions.find(pos => 
      charIndex >= pos.start && charIndex < pos.end
    );
    
    // Remove highlighting from all words
    this.highlightedElements.forEach(el => {
      el.style.backgroundColor = '';
    });
    
    // Add highlighting to the current word
    if (position && position.element) {
      position.element.style.backgroundColor = this.highlightColor;
      
      // Scroll the word into view if needed
      position.element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest' 
      });
    }
  }
  
  /**
   * Set up word highlighting during speech
   */
  setupHighlighting() {
    if (!this.utterance || !this.currentElement) return;
    
    // Boundary event (triggered when a new word or sentence is spoken)
    this.utterance.onboundary = (event) => {
      if (event.name === 'word') {
        this.handleWordBoundary(event.charIndex);
      }
    };
    
    // Start event
    this.utterance.onstart = () => {
      this.currentElement.classList.add('being-read');
      
      // Dispatch custom event when reading starts
      const event = new CustomEvent('accessflow-reading-start', { 
        bubbles: true 
      });
      this.currentElement.dispatchEvent(event);
    };
    
    // End event
    this.utterance.onend = () => {
      this.removeHighlighting();
      this.restoreOriginalContent();
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
      this.restoreOriginalContent();
      this.speaking = false;
      this.utterance = null;
      
      // Dispatch error event
      const errorEvent = new CustomEvent('accessflow-reading-error', {
        bubbles: true,
        detail: { error: event.error }
      });
      this.currentElement.dispatchEvent(errorEvent);
    };
  }
  
  /**
   * Remove highlighting from all words
   */
  removeHighlighting() {
    if (!this.currentElement) return;
    
    this.currentElement.classList.remove('being-read');
    
    // Remove all word highlighting
    this.highlightedElements.forEach(el => {
      el.style.backgroundColor = '';
    });
  }
  
  /**
   * Restore the original content of the element
   */
  restoreOriginalContent() {
    if (this.currentElement && this.originalContent) {
      this.currentElement.innerHTML = this.originalContent;
      this.originalContent = null;
      this.highlightedElements = [];
      this.wordBoundaryPositions = [];
    }
  }
  
  /**
   * Check if speech synthesis is available
   * @returns {boolean} Whether speech synthesis is available
   */
  isAvailable() {
    return this.available;
  }
  
  /**
   * Check if currently speaking
   * @returns {boolean} Whether currently speaking
   */
  isSpeaking() {
    return this.speaking;
  }
  
  /**
   * Check if speech is paused
   * @returns {boolean} Whether speech is paused
   */
  isPaused() {
    return this.paused;
  }
}
