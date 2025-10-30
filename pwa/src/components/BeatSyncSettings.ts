/**
 * BeatSyncSettings Component
 *
 * UI for configuring beat animations
 * Provides element selection, animation customization, and preset management
 */

import { ANIMATION_TYPES, ANIMATION_TYPE_INFO, ELEMENT_PRESETS, COLOR_PALETTES } from '../utils/animationPresets.js'
import beatSyncConfig from '../services/BeatSyncConfig.js'

export class BeatSyncSettings {
  constructor() {
    this.currentTab = 'elements'
    this.pickerMode = false
    this.pickerCallback = null
  }

  /**
   * Render settings modal
   */
  render() {
    return `
      <div class="beat-sync-settings">
        <!-- Tabs -->
        <div class="tabs">
          <button class="tab ${this.currentTab === 'elements' ? 'active' : ''}"
                  onclick="window.beatSyncSettings.switchTab('elements')">
            🎯 Elemente
          </button>
          <button class="tab ${this.currentTab === 'presets' ? 'active' : ''}"
                  onclick="window.beatSyncSettings.switchTab('presets')">
            ⭐ Presets
          </button>
          <button class="tab ${this.currentTab === 'advanced' ? 'active' : ''}"
                  onclick="window.beatSyncSettings.switchTab('advanced')">
            ⚙️ Erweitert
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          ${this.renderTabContent()}
        </div>
      </div>
    `
  }

  /**
   * Render current tab content
   */
  renderTabContent() {
    switch (this.currentTab) {
      case 'elements':
        return this.renderElementsTab()
      case 'presets':
        return this.renderPresetsTab()
      case 'advanced':
        return this.renderAdvancedTab()
      default:
        return ''
    }
  }

  /**
   * Render Elements Tab
   */
  renderElementsTab() {
    const config = beatSyncConfig.config
    const allElements = [...config.elements, ...config.customElements]

    return `
      <div class="element-list">
        ${allElements.map((element, index) => this.renderElementItem(element, index)).join('')}
      </div>
    `
  }

  /**
   * Render single element item
   */
  renderElementItem(element, index) {
    const preset = ELEMENT_PRESETS.find(p => p.id === element.id)
    const icon = preset?.icon || '📦'
    const typeInfo = ANIMATION_TYPE_INFO[element.animationType] || {}

    return `
      <div class="element-item ${element.enabled ? 'enabled' : ''}" data-element-id="${element.id}">
        <!-- Header -->
        <div class="element-header">
          <div class="element-info">
            <span class="element-icon">${icon}</span>
            <div>
              <div class="element-name">${element.name}</div>
              <div class="element-selector">${element.selector}</div>
            </div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox"
                   ${element.enabled ? 'checked' : ''}
                   onchange="window.beatSyncSettings.toggleElement('${element.id}')" />
            <span class="slider"></span>
          </label>
        </div>

        <!-- Controls (only if enabled) -->
        ${element.enabled ? `
          <div class="element-controls">
            <!-- Animation Type -->
            <div class="control-row">
              <span class="control-label">Animation</span>
              <select class="select-input flex-1"
                      onchange="window.beatSyncSettings.updateElementAnimation('${element.id}', this.value)">
                ${Object.values(ANIMATION_TYPES).map(type => {
                  const info = ANIMATION_TYPE_INFO[type]
                  return `<option value="${type}" ${element.animationType === type ? 'selected' : ''}>
                    ${info.icon} ${info.name}
                  </option>`
                }).join('')}
              </select>
            </div>

            <!-- Intensity -->
            <div class="control-row">
              <span class="control-label">Intensität</span>
              <input type="range"
                     class="intensity-slider"
                     min="0"
                     max="100"
                     value="${element.intensity}"
                     oninput="window.beatSyncSettings.updateElementIntensity('${element.id}', this.value)" />
              <span class="intensity-value">${element.intensity}%</span>
            </div>

            <!-- Color Picker (for color-based animations) -->
            ${(element.animationType === 'color' || element.animationType === 'glow' || element.animationType === 'border-pulse') ? `
              <div class="control-row">
                <span class="control-label">Farbe</span>
                <div class="color-palette">
                  ${this.renderColorPicker(element)}
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `
  }

  /**
   * Render color picker
   */
  renderColorPicker(element) {
    const currentColor = element.colors?.[0] || '#6366f1'
    const palettes = Object.values(COLOR_PALETTES)

    return `
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        ${palettes.flat().map(color => `
          <div class="color-swatch ${currentColor === color ? 'active' : ''}"
               style="background: ${color};"
               onclick="window.beatSyncSettings.updateElementColor('${element.id}', '${color}')">
          </div>
        `).join('')}
        <input type="color"
               value="${currentColor}"
               onchange="window.beatSyncSettings.updateElementColor('${element.id}', this.value)"
               style="width: 40px; height: 40px; border: 2px solid var(--border); border-radius: 8px; cursor: pointer;" />
      </div>
    `
  }

  /**
   * Render Presets Tab
   */
  renderPresetsTab() {
    const presets = beatSyncConfig.getPresets()

    return `
      <div class="preset-grid">
        ${Object.entries(presets).map(([key, preset]) => `
          <div class="preset-card" onclick="window.beatSyncSettings.loadPreset('${key}')">
            <div class="preset-icon">${preset.name.match(/[\p{Emoji}]/u)?.[0] || '🎵'}</div>
            <div class="preset-name">${preset.name.replace(/[\p{Emoji}]/gu, '').trim()}</div>
            <div class="preset-description">${preset.description}</div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top: 32px; padding-top: 32px; border-top: 2px solid var(--border);">
        <h3 style="margin-bottom: 16px;">💾 Eigenes Preset speichern</h3>
        <div style="display: flex; gap: 12px;">
          <input type="text"
                 id="preset-name-input"
                 class="input flex-1"
                 placeholder="Preset-Name (z.B. Mein Favorit)" />
          <button class="btn btn-accent" onclick="window.beatSyncSettings.savePreset()">
            Speichern
          </button>
        </div>
      </div>
    `
  }

  /**
   * Render Advanced Tab
   */
  renderAdvancedTab() {
    return `
      <div style="display: grid; gap: 24px;">
        <!-- Custom Element -->
        <div class="card">
          <h3 style="margin-bottom: 16px;">🎯 Eigenes Element hinzufügen</h3>
          <div style="display: grid; gap: 12px;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">CSS-Selektor</label>
              <input type="text"
                     id="custom-selector-input"
                     class="input"
                     placeholder="z.B. .my-class oder #my-id" />
              <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                Beliebiger CSS-Selektor für dein Element
              </p>
            </div>

            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Name (optional)</label>
              <input type="text"
                     id="custom-name-input"
                     class="input"
                     placeholder="z.B. Mein Header" />
            </div>

            <div style="display: flex; gap: 12px;">
              <button class="btn btn-outline flex-1"
                      onclick="window.beatSyncSettings.startElementPicker()">
                🎯 Element mit Klick auswählen
              </button>
              <button class="btn btn-accent flex-1"
                      onclick="window.beatSyncSettings.addCustomElement()">
                ➕ Hinzufügen
              </button>
            </div>
          </div>
        </div>

        <!-- Live Preview Toggle -->
        <div class="card">
          <h3 style="margin-bottom: 16px;">👀 Live Preview</h3>
          <label class="toggle-switch-large">
            <input type="checkbox"
                   id="live-preview-toggle"
                   onchange="window.beatSyncSettings.toggleLivePreview(this.checked)" />
            <span>Animationen während der Einstellung testen</span>
          </label>
          <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
            Musik muss abgespielt werden
          </p>
        </div>

        <!-- Export/Import -->
        <div class="card">
          <h3 style="margin-bottom: 16px;">💾 Export / Import</h3>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-outline flex-1" onclick="window.beatSyncSettings.exportConfig()">
              📤 Konfiguration exportieren
            </button>
            <button class="btn btn-outline flex-1" onclick="document.getElementById('import-file-input').click()">
              📥 Konfiguration importieren
            </button>
          </div>
          <input type="file"
                 id="import-file-input"
                 accept=".json"
                 style="display: none;"
                 onchange="window.beatSyncSettings.importConfig(this)" />
        </div>

        <!-- Reset -->
        <div class="card">
          <h3 style="margin-bottom: 16px;">🔄 Zurücksetzen</h3>
          <button class="btn btn-danger" onclick="window.beatSyncSettings.resetConfig()">
            Alle Einstellungen zurücksetzen
          </button>
        </div>
      </div>
    `
  }

  /**
   * Switch tab
   */
  switchTab(tab) {
    this.currentTab = tab
    this.updateModal()
  }

  /**
   * Toggle element enabled/disabled
   */
  toggleElement(elementId) {
    const config = beatSyncConfig.config
    const element = [...config.elements, ...config.customElements].find(el => el.id === elementId)

    if (element) {
      element.enabled = !element.enabled
      beatSyncConfig.save()

      // Update only this specific element card
      const elementCard = document.querySelector(`[data-element-id="${elementId}"]`)
      if (elementCard) {
        const allElements = [...config.elements, ...config.customElements]
        const index = allElements.findIndex(el => el.id === elementId)
        if (index !== -1) {
          const newHTML = this.renderElementItem(allElements[index], index)
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = newHTML
          // Use firstElementChild instead of firstChild to skip text nodes
          if (tempDiv.firstElementChild) {
            elementCard.replaceWith(tempDiv.firstElementChild)
          }
        }
      }
    }
  }

  /**
   * Update element animation type
   */
  updateElementAnimation(elementId, animationType) {
    beatSyncConfig.updateElement(elementId, { animationType })
    this.updateModal()
  }

  /**
   * Update element intensity
   */
  updateElementIntensity(elementId, intensity) {
    beatSyncConfig.updateElement(elementId, { intensity: parseInt(intensity) })

    // Update display only (no full modal refresh)
    const element = document.querySelector(`[data-element-id="${elementId}"] .intensity-value`)
    if (element) {
      element.textContent = `${intensity}%`
    }

    // Save but don't re-render
    beatSyncConfig.save()
  }

  /**
   * Update element color
   */
  updateElementColor(elementId, color) {
    beatSyncConfig.updateElement(elementId, { colors: [color] })
    this.updateModal()
  }

  /**
   * Load preset
   */
  loadPreset(presetKey) {
    beatSyncConfig.loadPreset(presetKey)
    this.updateModal()

    if (window.game && typeof window.game.showToast === 'function') {
      const preset = beatSyncConfig.getPresets()[presetKey]
      window.game.showToast(`Preset "${preset.name}" geladen!`, 'success')
    }
  }

  /**
   * Save custom preset
   */
  savePreset() {
    const nameInput = document.getElementById('preset-name-input')
    const name = nameInput?.value.trim()

    if (!name) {
      if (window.game) window.game.showToast('Bitte gib einen Namen ein', 'warning')
      return
    }

    // Save to localStorage with custom prefix
    const customPresets = JSON.parse(localStorage.getItem('mxster_custom_presets') || '{}')
    customPresets[name.toLowerCase().replace(/\s+/g, '-')] = {
      name,
      description: 'Eigenes Preset',
      config: beatSyncConfig.config
    }
    localStorage.setItem('mxster_custom_presets', JSON.stringify(customPresets))

    if (window.game) window.game.showToast(`Preset "${name}" gespeichert!`, 'success')
    nameInput.value = ''
  }

  /**
   * Add custom element
   */
  addCustomElement() {
    const selectorInput = document.getElementById('custom-selector-input')
    const nameInput = document.getElementById('custom-name-input')

    const selector = selectorInput?.value.trim()
    const name = nameInput?.value.trim() || selector

    if (!selector) {
      if (window.game) window.game.showToast('Bitte gib einen Selektor ein', 'warning')
      return
    }

    const success = beatSyncConfig.addCustomElement(selector, name)
    if (success) {
      if (window.game) window.game.showToast('Element hinzugefügt!', 'success')
      selectorInput.value = ''
      nameInput.value = ''
      this.updateModal()
    } else {
      if (window.game) window.game.showToast('Ungültiger Selektor', 'error')
    }
  }

  /**
   * Start element picker mode
   */
  startElementPicker() {
    this.pickerMode = true
    document.body.classList.add('beat-picker-active')

    if (window.game) {
      window.game.showToast('Klicke auf ein Element, um es auszuwählen', 'info')
      window.game.closeModal() // Close settings modal temporarily
    }

    // Add click handler
    this.pickerCallback = (event) => {
      event.preventDefault()
      event.stopPropagation()

      const target = event.target

      // Generate selector
      let selector = target.tagName.toLowerCase()
      if (target.id) {
        selector = `#${target.id}`
      } else if (target.className && typeof target.className === 'string') {
        const classes = target.className.split(' ').filter(c => c && !c.includes('beat-picker'))
        if (classes.length > 0) {
          selector = `.${classes[0]}`
        }
      }

      // Fill input
      document.getElementById('custom-selector-input').value = selector

      // Reopen settings modal
      if (window.game) {
        window.game.openBeatSettings()
        window.game.showToast(`Element ausgewählt: ${selector}`, 'success')
      }

      this.stopElementPicker()
    }

    document.addEventListener('click', this.pickerCallback, { capture: true })

    // Highlight on hover
    this.hoverCallback = (event) => {
      document.querySelectorAll('.beat-picker-highlight').forEach(el => {
        el.classList.remove('beat-picker-highlight')
      })
      event.target.classList.add('beat-picker-highlight')
    }
    document.addEventListener('mouseover', this.hoverCallback)
  }

  /**
   * Stop element picker mode
   */
  stopElementPicker() {
    this.pickerMode = false
    document.body.classList.remove('beat-picker-active')

    if (this.pickerCallback) {
      document.removeEventListener('click', this.pickerCallback, { capture: true })
      this.pickerCallback = null
    }

    if (this.hoverCallback) {
      document.removeEventListener('mouseover', this.hoverCallback)
      this.hoverCallback = null
    }

    document.querySelectorAll('.beat-picker-highlight').forEach(el => {
      el.classList.remove('beat-picker-highlight')
    })
  }

  /**
   * Toggle live preview
   */
  toggleLivePreview(enabled) {
    // This will be handled by main.js
    if (window.beatAnimator) {
      if (enabled) {
        if (window.game) window.game.showToast('Live Preview aktiviert', 'success')
      } else {
        if (window.game) window.game.showToast('Live Preview deaktiviert', 'info')
      }
    }
  }

  /**
   * Export configuration
   */
  exportConfig() {
    const config = beatSyncConfig.exportConfig()
    const blob = new Blob([config], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mxster-beat-config-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    if (window.game) window.game.showToast('Konfiguration exportiert!', 'success')
  }

  /**
   * Import configuration
   */
  importConfig(fileInput) {
    const file = fileInput.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const success = beatSyncConfig.importConfig(e.target.result)
      if (success) {
        this.updateModal()
        if (window.game) window.game.showToast('Konfiguration importiert!', 'success')
      } else {
        if (window.game) window.game.showToast('Import fehlgeschlagen', 'error')
      }
    }
    reader.readAsText(file)
  }

  /**
   * Reset configuration
   */
  resetConfig() {
    if (confirm('Alle Einstellungen zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      beatSyncConfig.reset()
      this.updateModal()
      if (window.game) window.game.showToast('Einstellungen zurückgesetzt', 'info')
    }
  }

  /**
   * Update modal content
   */
  updateModal() {
    if (window.game && typeof window.game.openBeatSettings === 'function') {
      window.game.openBeatSettings()
    }
  }
}

// Export singleton instance
export default new BeatSyncSettings()
