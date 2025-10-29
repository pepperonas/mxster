import { BACKGROUND_ANIMATIONS, getAnimationName, getAnimationDescription } from '../utils/backgroundAnimations.js'
import { getIconHTML } from '../utils/icons.js'

/**
 * Simplified Beat Sync Settings Component
 * Toggle on/off for 3D particle wave animation
 */
export default function renderSimpleBeatSettings(currentAnimation, currentIntensity, onSave) {
  const isEnabled = currentAnimation === BACKGROUND_ANIMATIONS.WAVE_3D

  return `
    <div class="beat-settings">
      <h3 style="margin-bottom: 24px;">🎵 Beat Sync Einstellungen</h3>

      <p style="color: var(--text-secondary); margin-bottom: 24px;">
        3D Partikelwelle synchronisiert mit dem Beat der Musik
      </p>

      <!-- Animation Enable/Disable Toggle -->
      <div style="margin-bottom: 24px;">
        <label style="
          display: flex;
          align-items: center;
          padding: 16px;
          background: var(--bg-secondary);
          border: 2px solid ${isEnabled ? 'var(--accent)' : 'var(--border)'};
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        "
        onmouseover="this.style.borderColor='var(--accent)'"
        onmouseout="this.style.borderColor='${isEnabled ? 'var(--accent)' : 'var(--border)'}'">
          <input
            type="checkbox"
            id="animation-enabled"
            ${isEnabled ? 'checked' : ''}
            style="margin-right: 12px; width: 20px; height: 20px; cursor: pointer;"
          >
          <div>
            <div style="font-weight: bold; margin-bottom: 4px;">
              3D Partikelwelle aktivieren
            </div>
            <div style="font-size: 12px; color: var(--text-secondary);">
              ${getAnimationDescription(BACKGROUND_ANIMATIONS.WAVE_3D)}
            </div>
          </div>
        </label>
      </div>

      <!-- Intensity Slider -->
      <div style="margin-bottom: 24px;">
        <label style="display: block; margin-bottom: 12px; font-weight: bold;">
          Intensität: <span id="intensity-value">${currentIntensity}%</span>
        </label>
        <input
          type="range"
          id="intensity-slider"
          min="0"
          max="100"
          value="${currentIntensity}"
          style="width: 100%;"
          oninput="document.getElementById('intensity-value').textContent = this.value + '%'"
        >
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
          <span>Subtil</span>
          <span>Intensiv</span>
        </div>
      </div>

      <!-- Info Box -->
      <div style="
        background: var(--bg-secondary);
        padding: 16px;
        border-radius: 8px;
        border-left: 4px solid var(--accent);
        margin-bottom: 24px;
      ">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          ${getIconHTML('info')}
          <strong>Hinweis</strong>
        </div>
        <p style="font-size: 14px; color: var(--text-secondary); margin: 0;">
          Beat Sync funktioniert nur mit Spotify Premium und wenn ein Song über Spotify abgespielt wird.
        </p>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 12px;">
        <button
          class="btn btn-accent"
          onclick="game.saveBeatSettings()"
          style="flex: 1;">
          ${getIconHTML('check')} Speichern
        </button>
        <button
          class="btn btn-outline"
          onclick="game.closeModal()"
          style="flex: 1;">
          ${getIconHTML('close')} Abbrechen
        </button>
      </div>
    </div>
  `
}
