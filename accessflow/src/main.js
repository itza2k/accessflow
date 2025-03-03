import './style.css'
import { setupAccessFlow } from './utils/dom.js'

document.querySelector('#app').innerHTML = `
  <div class="accessflow-container">
    <h1>AccessFlow</h1>
    <div class="text-processor">
      <textarea id="input-text" aria-label="Enter text to process"></textarea>
      <div class="controls">
        <button id="simplify-btn" aria-label="Simplify text">Simplify</button>
        <button id="summarize-btn" aria-label="Summarize text">Summarize</button>
      </div>
      <div id="output-text" aria-live="polite" class="output"></div>
    </div>
    <div id="key-concepts" aria-label="Key concepts" class="key-concepts"></div>
  </div>
`

setupAccessFlow()
