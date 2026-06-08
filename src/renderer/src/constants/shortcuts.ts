export const SHORTCUT_CHANNELS = {
  CAPTURE_WEBVIEW: 'shortcut:captureWebview',
  CAPTURE_VIDEO: 'shortcut:captureVideo'
} as const

export const CAPTURE_SHORTCUTS = {
  WEB_CAPTURE: 'CommandOrControl+Shift+S',
  VIDEO_CAPTURE: 'CommandOrControl+Shift+S' 
} as const


export const ANNOTATION_SHORTCUTS = {
  DELETE: 'delete',
  COPY: 'c',
  PASTE: 'v',
  ARROW_LEFT: 'arrowleft',
  ARROW_RIGHT: 'arrowright',
  ARROW_UP: 'arrowup',
  ARROW_DOWN: 'arrowdown'
} as const

export const VIDEO_PLAYER_SHORTCUTS = {
  PLAY_TOGGLE: ' ',
  PREV_FRAME: 'arrowleft',
  NEXT_FRAME: 'arrowright'
} as const
