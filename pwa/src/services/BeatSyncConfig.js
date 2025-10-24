/**
 * BeatSyncConfig
 *
 * Configuration management for beat animations
 * Handles loading, saving, and validating animation settings
 */

const STORAGE_KEY = 'mxster_beat_config'

class BeatSyncConfig {
  constructor() {
    this.presets = this.getDefaultPresets()
    this.config = this.load() || this.getDefaultConfig()
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      enabled: true,
      elements: [
        {
          id: 'background',
          selector: 'body',
          name: 'Hintergrund',
          animationType: 'pulse',
          intensity: 30,
          duration: null, // Use beat duration
          syncType: 'beat',
          colors: ['#6366f1', '#8b5cf6'],
          enabled: true
        },
        {
          id: 'timeline-cards',
          selector: '.timeline-card',
          name: 'Timeline-Karten',
          animationType: 'scale',
          intensity: 50,
          duration: null,
          syncType: 'beat',
          colors: [],
          enabled: true
        },
        {
          id: 'score-overview',
          selector: '.score-overview',
          name: 'Score-Übersicht',
          animationType: 'glow',
          intensity: 40,
          duration: null,
          syncType: 'beat',
          colors: ['#10b981'],
          enabled: false
        },
        {
          id: 'player-area',
          selector: '#audio-player',
          name: 'Player-Bereich',
          animationType: 'pulse',
          intensity: 35,
          duration: null,
          syncType: 'beat',
          colors: [],
          enabled: false
        },
        {
          id: 'buttons',
          selector: '.btn',
          name: 'Buttons',
          animationType: 'glow',
          intensity: 25,
          duration: null,
          syncType: 'beat',
          colors: ['#f59e0b'],
          enabled: false
        }
      ],
      customElements: [] // User-added custom selectors
    }
  }

  /**
   * Get default presets
   */
  getDefaultPresets() {
    return {
      'bass-heavy': {
        name: '🎸 Bass Heavy',
        description: 'Intensive Hintergrund-Pulse',
        config: {
          enabled: true,
          elements: [
            {
              id: 'background',
              selector: 'body',
              name: 'Hintergrund',
              animationType: 'flash',
              intensity: 80,
              duration: null,
              syncType: 'beat',
              colors: ['#dc2626', '#b91c1c'],
              enabled: true
            },
            {
              id: 'timeline-cards',
              selector: '.timeline-card',
              name: 'Timeline-Karten',
              animationType: 'scale',
              intensity: 60,
              duration: null,
              syncType: 'beat',
              colors: [],
              enabled: true
            }
          ],
          customElements: []
        }
      },
      'subtle-glow': {
        name: '✨ Subtle Glow',
        description: 'Sanfte Button-Glows',
        config: {
          enabled: true,
          elements: [
            {
              id: 'buttons',
              selector: '.btn',
              name: 'Buttons',
              animationType: 'glow',
              intensity: 30,
              duration: null,
              syncType: 'beat',
              colors: ['#3b82f6'],
              enabled: true
            },
            {
              id: 'timeline-cards',
              selector: '.timeline-card',
              name: 'Timeline-Karten',
              animationType: 'pulse',
              intensity: 20,
              duration: null,
              syncType: 'beat',
              colors: [],
              enabled: true
            }
          ],
          customElements: []
        }
      },
      'party-mode': {
        name: '🎉 Party Mode',
        description: 'Alle Elemente, hohe Intensität',
        config: {
          enabled: true,
          elements: [
            {
              id: 'background',
              selector: 'body',
              name: 'Hintergrund',
              animationType: 'color',
              intensity: 70,
              duration: null,
              syncType: 'beat',
              colors: ['#ec4899', '#8b5cf6', '#3b82f6'],
              enabled: true
            },
            {
              id: 'timeline-cards',
              selector: '.timeline-card',
              name: 'Timeline-Karten',
              animationType: 'shake',
              intensity: 50,
              duration: null,
              syncType: 'beat',
              colors: [],
              enabled: true
            },
            {
              id: 'score-overview',
              selector: '.score-overview',
              name: 'Score-Übersicht',
              animationType: 'glow',
              intensity: 60,
              duration: null,
              syncType: 'beat',
              colors: ['#10b981'],
              enabled: true
            },
            {
              id: 'buttons',
              selector: '.btn',
              name: 'Buttons',
              animationType: 'scale',
              intensity: 40,
              duration: null,
              syncType: 'beat',
              colors: [],
              enabled: true
            }
          ],
          customElements: []
        }
      },
      'minimal': {
        name: '🌙 Minimal',
        description: 'Nur Timeline-Karten Pulse',
        config: {
          enabled: true,
          elements: [
            {
              id: 'timeline-cards',
              selector: '.timeline-card',
              name: 'Timeline-Karten',
              animationType: 'pulse',
              intensity: 25,
              duration: null,
              syncType: 'beat',
              colors: [],
              enabled: true
            }
          ],
          customElements: []
        }
      }
    }
  }

  /**
   * Load configuration from LocalStorage
   */
  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        this.config = this.mergeWithDefaults(parsed)
        console.log('✅ Beat sync config loaded from storage')
      } else {
        console.log('ℹ️ No stored config, using defaults')
      }
    } catch (error) {
      console.error('❌ Failed to load beat sync config:', error)
      this.config = this.getDefaultConfig()
    }
    return this.config
  }

  /**
   * Merge stored config with defaults (add missing fields)
   */
  mergeWithDefaults(stored) {
    const defaults = this.getDefaultConfig()

    return {
      enabled: stored.enabled !== undefined ? stored.enabled : defaults.enabled,
      elements: this.mergeElements(stored.elements || [], defaults.elements),
      customElements: stored.customElements || []
    }
  }

  /**
   * Merge stored elements with defaults
   */
  mergeElements(storedElements, defaultElements) {
    const merged = []

    // Add default elements
    defaultElements.forEach(defaultEl => {
      const storedEl = storedElements.find(el => el.id === defaultEl.id)
      merged.push(storedEl ? { ...defaultEl, ...storedEl } : defaultEl)
    })

    // Add any stored elements not in defaults
    storedElements.forEach(storedEl => {
      if (!defaultElements.find(el => el.id === storedEl.id)) {
        merged.push(storedEl)
      }
    })

    return merged
  }

  /**
   * Save configuration to LocalStorage
   */
  save(config = this.config) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
      this.config = config
      console.log('✅ Beat sync config saved')
      return true
    } catch (error) {
      console.error('❌ Failed to save beat sync config:', error)
      return false
    }
  }

  /**
   * Load a preset
   */
  loadPreset(presetName) {
    const preset = this.presets[presetName]
    if (!preset) {
      console.error('❌ Preset not found:', presetName)
      return false
    }

    this.config = preset.config
    this.save()
    console.log('✅ Loaded preset:', preset.name)
    return true
  }

  /**
   * Get all presets
   */
  getPresets() {
    return this.presets
  }

  /**
   * Add custom element
   */
  addCustomElement(selector, name, animationType = 'pulse') {
    // Validate selector
    if (!this.validateSelector(selector)) {
      console.error('❌ Invalid CSS selector:', selector)
      return false
    }

    const customElement = {
      id: `custom-${Date.now()}`,
      selector,
      name: name || selector,
      animationType,
      intensity: 50,
      duration: null,
      syncType: 'beat',
      colors: [],
      enabled: true
    }

    this.config.customElements.push(customElement)
    this.save()
    console.log('✅ Added custom element:', selector)
    return true
  }

  /**
   * Remove custom element
   */
  removeCustomElement(id) {
    this.config.customElements = this.config.customElements.filter(el => el.id !== id)
    this.save()
  }

  /**
   * Update element configuration
   */
  updateElement(id, updates) {
    const element = this.config.elements.find(el => el.id === id)
    if (element) {
      Object.assign(element, updates)
      this.save()
      return true
    }

    const customElement = this.config.customElements.find(el => el.id === id)
    if (customElement) {
      Object.assign(customElement, updates)
      this.save()
      return true
    }

    return false
  }

  /**
   * Get all enabled elements
   */
  getEnabledElements() {
    const allElements = [...this.config.elements, ...this.config.customElements]
    return allElements.filter(el => el.enabled)
  }

  /**
   * Validate CSS selector
   */
  validateSelector(selector) {
    try {
      document.querySelector(selector)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Reset to defaults
   */
  reset() {
    this.config = this.getDefaultConfig()
    this.save()
    console.log('✅ Beat sync config reset to defaults')
  }

  /**
   * Export configuration as JSON
   */
  exportConfig() {
    return JSON.stringify(this.config, null, 2)
  }

  /**
   * Import configuration from JSON
   */
  importConfig(jsonString) {
    try {
      const imported = JSON.parse(jsonString)
      this.config = this.mergeWithDefaults(imported)
      this.save()
      console.log('✅ Configuration imported')
      return true
    } catch (error) {
      console.error('❌ Failed to import configuration:', error)
      return false
    }
  }
}

export default new BeatSyncConfig()
