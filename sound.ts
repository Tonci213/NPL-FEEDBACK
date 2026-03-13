export const playSound = (type: 'click' | 'success' | 'error') => {
  const sounds = {
    click: 'https://actions.google.com/sounds/v1/ui/click.ogg',
    success: 'https://actions.google.com/sounds/v1/ui/check_mark_success.ogg',
    error: 'https://actions.google.com/sounds/v1/ui/error.ogg',
  };
  const audio = new Audio(sounds[type]);
  audio.play().catch(e => console.error('Audio playback failed', e));
};
