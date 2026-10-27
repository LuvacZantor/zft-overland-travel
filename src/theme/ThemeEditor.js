/** Modeless, independent theme window. Preview changes remain reversible until saved. */
import { ThemeManager, THEME_FIELDS, THEME_PRESETS, themeColors, cleanTheme, validHex } from "./ThemeManager.js";

const escapeHTML = str => String(str).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

export class ThemeEditor {
  constructor(dashboard, onLayout = () => {}) {
    this.dashboard = dashboard;
    this.onLayout = onLayout;
    this.window = null;
    this.editor = null;
    this.draft = null;
    this.onClick = this.click.bind(this);
    this.onInput = this.input.bind(this);
    this.onWindowKeydown = this.keydown.bind(this);
    // One launch button in the dashboard header, for GM and player alike.
    dashboard.addEventListener("click", event => {
      if (!event.target.closest('[data-ir-action="theme"]')) return;
      event.preventDefault();
      this.openEditor();
    });
  }
  get open() { return !!this.window?.isConnected && !this.window.hidden; }
  createWindow() {
    if (this.window?.isConnected) return;
    const root = document.createElement('section');
    root.id = 'zft-overland-theme-window';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'false');
    root.setAttribute('aria-labelledby', 'zft-overland-theme-title');
    root.setAttribute('aria-describedby', 'zft-overland-theme-hint');
    root.hidden = true;
    root.innerHTML = `<header class="zft-ir-theme-window-head" data-ir-theme-drag>
      <i class="fa-solid fa-palette" aria-hidden="true"></i>
      <span id="zft-overland-theme-title">ZFT Overland Travel · Interface Color Themes</span>
      <button type="button" data-ir-theme-command="cancel" class="zft-ir-theme-window-close" aria-label="Close theme editor and discard unsaved changes" title="Close without saving"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
    </header><div class="zft-ir-theme-window-content"><section class="zft-ir-theme-editor" data-ir-theme-editor></section></div>`;
    document.body.appendChild(root);
    this.window = root;
    this.editor = root.querySelector('[data-ir-theme-editor]');
    root.addEventListener('click', this.onClick);
    root.addEventListener('input', this.onInput);
    root.addEventListener('change', this.onInput);
    root.addEventListener('keydown', this.onWindowKeydown);
    root.querySelector('[data-ir-theme-drag]').addEventListener('pointerdown', event => this.startDrag(event));
    window.addEventListener('resize', () => this.clampToViewport());
  }
  clampToViewport() {
    if (!this.open) return;
    const rect = this.window.getBoundingClientRect();
    this.window.style.left = `${Math.max(0, Math.min(rect.left, window.innerWidth - Math.min(80, rect.width)))}px`;
    this.window.style.top = `${Math.max(0, Math.min(rect.top, window.innerHeight - Math.min(45, rect.height)))}px`;
  }
  startDrag(event) {
    if (event.button !== 0 || event.target.closest('button') || !this.open) return;
    const node = this.window;
    const start = { x:event.clientX, y:event.clientY, left:node.getBoundingClientRect().left, top:node.getBoundingClientRect().top };
    const move = ev => {
      node.style.left = `${Math.max(0, Math.min(start.left + ev.clientX - start.x, window.innerWidth - 80))}px`;
      node.style.top = `${Math.max(0, Math.min(start.top + ev.clientY - start.y, window.innerHeight - 45))}px`;
    };
    const stop = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', stop);
      document.removeEventListener('pointercancel', stop);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', stop);
    document.addEventListener('pointercancel', stop);
  }
  openEditor() {
    this.createWindow();
    if (this.open) {
      this.window.querySelector('.zft-ir-theme-window-close')?.focus({ preventScroll:true });
      return;
    }
    this.draft = ThemeManager.saved();
    this.window.hidden = false;
    // This is a separate, movable tool window; opening it does not expand the Dashboard.
    this.window.style.left = `${Math.max(8, Math.round((window.innerWidth - Math.min(900, window.innerWidth - 24)) / 2))}px`;
    this.window.style.top = `${Math.max(8, Math.round((window.innerHeight - Math.min(710, window.innerHeight - 28)) / 2))}px`;
    this.render();
    this.onLayout();
    this.window.querySelector('.zft-ir-theme-window-close')?.focus({ preventScroll:true });
  }
  cancel() {
    if (!this.open) return;
    this.draft = null;
    this.window.hidden = true;
    this.editor.replaceChildren();
    ThemeManager.apply();
    this.dashboard.querySelector('[data-ir-action="theme"]')?.focus({ preventScroll:true });
  }
  keydown(event) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    this.cancel();
  }
  render() {
    if (!this.open || !this.draft) return;
    const palette = themeColors(this.draft);
    const current = this.draft.preset;
    const overridden = this.draft.overrides;
    const presets = Object.entries(THEME_PRESETS).map(([key,item]) => {
      const c = item.colors;
      const selected = key === current ? ' aria-pressed="true"' : ' aria-pressed="false"';
      return `<button type="button" class="zft-ir-theme-preset" data-ir-theme-preset="${key}"${selected}>
        <span class="zft-ir-theme-swatches"><span style="background:${c.window}"></span><span style="background:${c.panel}"></span><span style="background:${c.accent}"></span><span style="background:${c.navigation}"></span></span>
        <span>${escapeHTML(item.label)}</span></button>`;
    }).join('');
    const groups = [...new Set(THEME_FIELDS.map(f => f.group))].map(group => {
      const fields = THEME_FIELDS.filter(f => f.group === group).map(field => {
        const value = palette[field.key];
        return `<div class="zft-ir-theme-field" data-ir-theme-field="${field.key}">
          <label for="zft-ir-color-${field.key}">${escapeHTML(field.label)}</label>
          <div class="zft-ir-theme-edit-row"><input aria-label="${escapeHTML(field.label)} color picker" type="color" data-ir-theme-color="${field.key}" value="${value}" />
          <input id="zft-ir-color-${field.key}" aria-label="${escapeHTML(field.label)} hexadecimal color" type="text" data-ir-theme-hex="${field.key}" value="${value}" maxlength="7" spellcheck="false" autocomplete="off" />
          <button type="button" data-ir-theme-reset="${field.key}" title="Restore preset color for ${escapeHTML(field.label)}" aria-label="Restore ${escapeHTML(field.label)} preset color" ${!Object.hasOwn(overridden,field.key)?'disabled':''}><i class="fa-solid fa-rotate-left" aria-hidden="true"></i></button></div>
        </div>`;
      }).join('');
      return `<details class="zft-ir-theme-group" open><summary>${escapeHTML(group)}</summary><div class="zft-ir-theme-fields">${fields}</div></details>`;
    }).join('');
    this.editor.innerHTML = `<p id="zft-overland-theme-hint">Choose a preset or customize individual colors. Previews apply to your ZFT Overland Travel windows only; Save to keep them.</p>
      <div class="zft-ir-theme-layout">
        <aside class="zft-ir-theme-preset-column"><div class="zft-ir-theme-subtitle">Theme presets</div>
          <div class="zft-ir-theme-presets" role="group" aria-label="Choose a theme preset">${presets}</div>
        </aside>
        <div class="zft-ir-theme-colors-column"><div class="zft-ir-theme-subtitle">Customize individual colors <small>(${Object.keys(overridden).length} overrides)</small></div>
          <div class="zft-ir-theme-groups">${groups}</div>
        </div>
      </div>
      <div class="zft-ir-theme-footer"><button type="button" data-ir-theme-command="reset-all">Restore Preset</button>
        <button type="button" data-ir-theme-command="cancel">Cancel</button>
        <button type="button" data-ir-theme-command="save" class="zft-ir-theme-save"><i class="fa-solid fa-check" aria-hidden="true"></i> Save Theme</button></div>`;
  }
  updateColor(key,value) {
    if (!this.draft || !validHex(value)) return;
    const hex = value.toUpperCase();
    const base = THEME_PRESETS[this.draft.preset].colors[key];
    if (hex === base) delete this.draft.overrides[key];
    else this.draft.overrides[key] = hex;
    ThemeManager.apply(this.draft);
    const field = this.editor?.querySelector(`[data-ir-theme-field="${key}"]`);
    if (field) {
      const picker = field.querySelector('[data-ir-theme-color]');
      if (picker && picker.value.toUpperCase() !== hex) picker.value = hex;
      const reset = field.querySelector('[data-ir-theme-reset]');
      if (reset) reset.disabled = !Object.hasOwn(this.draft.overrides,key);
    }
    const count = this.editor?.querySelector('.zft-ir-theme-colors-column .zft-ir-theme-subtitle small');
    if (count) count.textContent = `(${Object.keys(this.draft.overrides).length} overrides)`;
  }
  input(event) {
    if (!this.open) return;
    const picker = event.target.closest('[data-ir-theme-color]');
    const hexInput = event.target.closest('[data-ir-theme-hex]');
    if (picker) {
      this.updateColor(picker.dataset.irThemeColor,picker.value);
      const hex = picker.closest('[data-ir-theme-field]')?.querySelector('[data-ir-theme-hex]');
      if (hex) { hex.value = picker.value.toUpperCase(); hex.setCustomValidity(''); hex.setAttribute('aria-invalid','false'); }
    } else if (hexInput) {
      let value = hexInput.value.trim();
      if (/^[0-9a-fA-F]{6}$/.test(value)) value = `#${value}`;
      const valid = validHex(value);
      hexInput.setCustomValidity(valid ? '' : 'Use a six-digit hex color, such as #2B363D.');
      hexInput.setAttribute('aria-invalid',String(!valid));
      if (valid) this.updateColor(hexInput.dataset.irThemeHex,value);
    }
  }
  async click(event) {
    if (!this.open || !this.window.contains(event.target)) return;
    const preset = event.target.closest('[data-ir-theme-preset]');
    if (preset) {
      this.draft = { preset:preset.dataset.irThemePreset, overrides:{} };
      ThemeManager.apply(this.draft);
      this.render();
      this.editor.querySelector(`[data-ir-theme-preset="${this.draft.preset}"]`)?.focus({ preventScroll:true });
      return;
    }
    const reset = event.target.closest('[data-ir-theme-reset]');
    if (reset) {
      const key = reset.dataset.irThemeReset;
      delete this.draft.overrides[key];
      ThemeManager.apply(this.draft);
      this.render();
      this.editor.querySelector(`[data-ir-theme-hex="${key}"]`)?.focus({ preventScroll:true });
      return;
    }
    const command = event.target.closest('[data-ir-theme-command]')?.dataset.irThemeCommand;
    if (command === 'cancel') return this.cancel();
    if (command === 'reset-all') {
      this.draft.overrides = {};
      ThemeManager.apply(this.draft);
      this.render();
      this.editor.querySelector('[data-ir-theme-command="reset-all"]')?.focus({ preventScroll:true });
      return;
    }
    if (command === 'save') {
      if (this.editor.querySelector('[data-ir-theme-hex][aria-invalid="true"]')) {
        ui.notifications?.warn?.('Correct the invalid hex color before saving.');
        return;
      }
      try {
        await ThemeManager.save(cleanTheme(this.draft));
        this.draft = null;
        this.window.hidden = true;
        this.editor.replaceChildren();
        ThemeManager.apply();
        this.dashboard.querySelector('[data-ir-action="theme"]')?.focus({ preventScroll:true });
        ui.notifications?.info?.('Your ZFT Overland Travel color theme was saved.');
      } catch (error) {
        console.error('[ZFT][Overland] Could not save personal theme:',error);
        ui.notifications?.error?.(`Theme save failed: ${error.message}`);
      }
    }
  }
}
