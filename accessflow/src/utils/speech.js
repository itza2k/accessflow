/**
 * SpeechHandler - A class to manage text-to-speech functionality
 */
export default class SpeechHandler {
  constructor() {
    this.synth = window.speechSynthesis;
    this.utterance = null;
    this.isPaused = false;
    this.isReading = false;
    this.textElement = null;
    this.currentWordIndex = 0;
    this.words = [];
    this.options = {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      voice: null
    };
  }

  /**
   * Get available voices
   */
  getVoices() {
    return this.synth.getVoices();
  }

  /**
   * Set speech options
   * @param {Object} options - Speech options (rate, pitch, volume, voice)
   */
  setOptions(options = {}) {
    this.options = { ...this.options, ...options };
    return this;
  }

  /**
   * Speak text from a DOM element
   * @param {Element} element - The DOM element containing text to read
   */
  speak(element) {
    if (!element || this.isReading) return;

    this.textElement = element;
    this.isReading = true;
    const text = element.textContent;
    
    // Split text into words
    this.words = text.split(/\s+/);
    this.currentWordIndex = 0;

    if (this.words.length === 0) {
      this.isReading = false;
      return;
    }

    // Create utterance
    this.utterance = new SpeechSynthesisUtterance(text);
    
    // Set options
    this.utterance.rate = this.options.rate;
    this.utterance.pitch = this.options.pitch;
    this.utterance.volume = this.options.volume;
    
    if (this.options.voice) {
      this.utterance.voice = this.options.voice;
    }

    // Set event listeners
    this.utterance.onend = () => {
      this.stop();
    };

    this.utterance.onboundary = (event) => {
      // Only process word boundaries
      if (event.name !== 'word') return;
      
      // Get the word index
      this.currentWordIndex = this.getWordIndexFromCharIndex(event.charIndex);
      
      // Highlight current word
      this.highlightCurrentWord();
    };

    // Clear any existing highlights
    this.clearHighlights();
    
    // Start speaking
    this.synth.speak(this.utterance);
  }

  /**
   * Get word index from character index
   * @param {number} charIndex - Index of character in text
   * @returns {number} Word index
   */
  getWordIndexFromCharIndex(charIndex) {
    let text = this.textElement.textContent;
    let charCount = 0;
    let wordIndex = 0;
    
    const words = text.split(/\s+/);
    
    for (let i = 0; i < words.length; i++) {
      charCount += words[i].length + 1; // +1 for space
      if (charCount > charIndex) {
        wordIndex = i;
        break;
      }
    }
    
    return wordIndex;
  }

  /**
   * Highlight the current word being spoken
   */
  highlightCurrentWord() {
    // Clear existing highlights
    this.clearHighlights();
    
    // Create text nodes and highlight spans
    const text = this.textElement.textContent;
    const words = text.split(/\s+/);
    
    // Clear element
    this.textElement.innerHTML = '';
    
    // Rebuild content with highlight
    for (let i = 0; i < words.length; i++) {
      const wordSpan = document.createElement('span');
      wordSpan.textContent = words[i];
      
      if (i === this.currentWordIndex) {
        wordSpan.classList.add('accessflow-highlight');
      }
      
      this.textElement.appendChild(wordSpan);
      
      // Add space between words (except last word)
      if (i < words.length - 1) {
        this.textElement.appendChild(document.createTextNode(' '));
      }
    }
  }

  /**
   * Clear all highlights
   */
  clearHighlights() {
    if (this.textElement) {
      const highlights = this.textElement.querySelectorAll('.accessflow-highlight');
      highlights.forEach(el => {
        el.classList.remove('accessflow-highlight');
      });
    }
  }

  /**
   * Stop speaking
   */
  stop() {
    this.synth.cancel();
    this.isReading = false;
    this.isPaused = false;
    this.clearHighlights();

    // Restore original text formatting
    if (this.textElement) {
      const text = this.textElement.textContent;
      this.textElement.textContent = text;
    }
  }

  /**
   * Pause speaking
   */
  pause() {
    if (this.isReading && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
    }
  }

  /**
   * Resume speaking
   */
  resume() {
    if (this.isReading && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
    }
  }
}
