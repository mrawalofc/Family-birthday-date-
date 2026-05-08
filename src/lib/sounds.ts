const SOUND_URLS = {
  click: 'https://www.soundjay.com/buttons/sounds/button-16.mp3',
  notification: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
  error: 'https://www.soundjay.com/buttons/sounds/button-10.mp3',
  success: 'https://www.soundjay.com/buttons/sounds/button-3.mp3',
  transition: 'https://www.soundjay.com/buttons/sounds/button-09.mp3',
};

class SoundManager {
  private enabled: boolean = localStorage.getItem('love_world_sound_enabled') !== 'false';
  private audios: Record<string, HTMLAudioElement> = {};

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('love_world_sound_enabled', String(enabled));
  }

  isEnabled() {
    return this.enabled;
  }

  play(type: keyof typeof SOUND_URLS) {
    if (!this.enabled) return;

    try {
      if (!this.audios[type]) {
        this.audios[type] = new Audio(SOUND_URLS[type]);
      }
      
      const audio = this.audios[type];
      audio.currentTime = 0;
      audio.play().catch(e => console.warn(`Sound ${type} play blocked:`, e));
    } catch (e) {
      console.error('Sound play error:', e);
    }
  }
}

export const sounds = new SoundManager();
