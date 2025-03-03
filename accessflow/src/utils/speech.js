/**
 * Handles text-to-speech functionality with synchronized highlighting
 */
export default class SpeechHandler {
  constructor() {
    this.synth = window.speechSynthesis;
    this.utterance = null;
    this.isPaused = false;
    this.isReading = false;
    this.textElement = null;
    this.options = {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      voice: null
    };
    
    // Get available voices when they're ready
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
      };
    }
    this.voices = this.synth.getVoices();
  }

  getVoices() {
    return this.synth.getVoices();
  }
  
  setOptions(options = {}) {
    this.options = { ...this.options, ...options };
    return this;
  }
  
  /**
   * Speak the content of the provided element with word highlighting
   * @param {HTMLElement} element - The element containing text to read
   */
  speak(element) {
    if (!element || !this.synth) return;
    
    // Stop any ongoing speech
    this.stop();
    
    // Store the element for later use
    this.textElement = element;
    
    // Get the text to read
    const text = element.textContent;
    if (!text) return;
    
    // Create an utterance
    this.utterance = new SpeechSynthesisUtterance(text);
    
    // Apply options
    this.utterance.rate = this.options.rate;
    this.utterance.pitch = this.options.pitch;
    this.utterance.volume = this.options.volume;
    
    // Set voice if specified
    if (this.options.voice) {
      this.utterance.voice = this.options.voice;
    }
    
    // Prepare text for word-by-word highlighting
    const words = this.prepareTextForHighlighting(element);
    
    // Handle events
    this.utterance.onboundary = (e) => this.handleBoundary(e, words);
    this.utterance.onend = () => this.handleEnd();
    this.utterance.onerror = (e) => this.handleError(e);
    
    // Start speaking
    this.isReading = true;
    this.synth.speak(this.utterance);
  }
  
  /**
   * Stop speech
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isReading = false;
    this.isPaused = false;
    
    // Remove any highlights
    if (this.textElement) {
      this.removeHighlights(this.textElement);
    }
  }
  
  /**
   * Pause speech
   */
  pause() {
    if (!this.isReading || !this.synth) return;
    
    this.isPaused = true;
    this.synth.pause();
  }
  
  /**
   * Resume speech
   */
  resume() {
    if (!this.isPaused || !this.synth) return;
    
    this.isPaused = false;
    this.synth.resume();
  }
  
  /**
   * Toggle between pause and resume
   */
  toggle() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }
  
  /**
   * Prepare text for word-by-word highlighting
   * @param {HTMLElement} element - The element with text
   * @returns {Array} - Array of word data objects
   */
  prepareTextForHighlighting(element) {
    const originalContent = element.innerHTML;
    const text = element.textContent;
    
    // Split text into words
    const wordRegex = /\b\w+\b/g;
    let match;
    const words = [];
    
    // Get each word and its position
    while ((match = wordRegex.exec(text)) !== null) {
      words.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    // Wrap each word in a span for highlighting
    let wrappedContent = originalContent;
    const highlights = [];
    
    words.forEach((wordData, index) => {
      // Create a span with a unique ID for each word
      const spanId = `accessflow-word-${index}`;
      
      // Track the span for later
      highlights.push({
        id: spanId,
        word: wordData.word,
        index: index
      });
    });
    
    return highlights;
  }
  
  /**
   * Handle speech boundary events (word changes)
   * @param {SpeechSynthesisEvent} event - The boundary event
   * @param {Array} words - Array of word data objects
   */
  handleBoundary(event, words) {
    if (event.name === 'word' && event.charIndex !== undefined && this.textElement) {
      // Remove previous highlights
      this.removeHighlights(this.textElement);
      
      // Find which word we're on based on character index
      const currentIndex = event.charIndex;
      const text = this.textElement.textContent;
      
      // Get the current word
      const currentWordMatch = text.substring(currentIndex).match(/\b\w+\b/);
      if (currentWordMatch) {
        const currentWord = currentWordMatch[0];
        const wordStart = currentIndex;
        const wordEnd = currentIndex + currentWord.length;
        
        // Create a range for the current word
        const range = document.createRange();
        const textNode = this.findTextNode(this.textElement, currentIndex);
        
        if (textNode) {
          // Calculate offset within the text node
          let nodeStart = 0;
          let currentNode = this.textElement.firstChild;
          
          while (currentNode !== textNode && currentNode) {
            if (currentNode.nodeType === Node.TEXT_NODE) {
              nodeStart += currentNode.textContent.length;
            }
            currentNode = currentNode.nextSibling;
          }
          
          const startOffset = currentIndex - nodeStart;
          const endOffset = Math.min(startOffset + currentWord.length, textNode.textContent.length);
          
          try {
            // Set the range to the current word
            range.setStart(textNode, startOffset);
            range.setEnd(textNode, endOffset);
            
            // Create a span to highlight the word
            const highlightSpan = document.createElement('span');
            highlightSpan.className = 'accessflow-highlight';
            range.surroundContents(highlightSpan);
          } catch (e) {
            console.error('Error highlighting word:', e);
          }
        }
      }
    }
  }
  
  /**
   * Find the text node containing the character at the given index
   * @param {HTMLElement} element - The element containing text
   * @param {number} index - Character index
   * @returns {Node|null} - The text node or null
   */
  findTextNode(element, index) {
    let currentIndex = 0;
    let result = null;
    
    function searchNode(node) {
      if (result) return;
      
      if (node.nodeType === Node.TEXT_NODE) {
        if (currentIndex <= index && currentIndex + node.textContent.length > index) {
          result = node;
          return;
        }
        currentIndex += node.textContent.length;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          searchNode(node.childNodes[i]);
        }
      }
    }
    
    searchNode(element);
    return result;
  }
  
  /**
   * Remove highlight spans from the element
   * @param {HTMLElement} element - The element with highlights
   */
  removeHighlights(element) {
    const highlights = element.querySelectorAll('.accessflow-highlight');
    
    highlights.forEach(span => {
      // Replace the span with its text content
      const textNode = document.createTextNode(span.textContent);
      span.parentNode.replaceChild(textNode, span);
    });
  }
  
  /**
   * Handle the end of speech
   */
  handleEnd() {
    // Remove any highlights at the end
    if (this.textElement) {
      this.removeHighlights(this.textElement);
    }
    
    this.isReading = false;
    this.utterance = null;
  }
  
  /**
   * Handle speech synthesis errors
   * @param {SpeechSynthesisErrorEvent} error - The error event
   */
  handleError(error) {
    console.error('Speech synthesis error:', error);
    this.isReading = false;
    
    // Remove any highlights on error
    if (this.textElement) {
      this.removeHighlights(this.textElement);
    }
  }
}
