// CSS-only playback control shared by script-free animation previews.
// The checkbox is a sibling of <main> so :checked pauses animations safely.
export const CSS_PREVIEW_PLAYBACK_STYLES = `
.preview-pause{position:absolute;left:14px;top:14px;width:19px;height:19px;accent-color:#5178b6;cursor:pointer;z-index:2}
.preview-pause-label{position:absolute;left:41px;top:12px;font-size:12px;font-weight:650;line-height:23px;color:#294872;cursor:pointer;user-select:none;z-index:2}
.preview-pause-label .paused{display:none}
.preview-pause:checked + .preview-pause-label .playing{display:none}
.preview-pause:checked + .preview-pause-label .paused{display:inline}
.preview-pause:checked ~ main .demo{animation-play-state:paused!important}
`;

export const CSS_PREVIEW_PLAYBACK_MARKUP = `
<input class="preview-pause" id="pause-preview" type="checkbox" aria-label="Pausar o reanudar la vista previa">
<label class="preview-pause-label" for="pause-preview">
  <span class="playing">Pausar</span><span class="paused">Reanudar</span>
</label>`;
