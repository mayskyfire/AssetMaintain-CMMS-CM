# 🔊 Notification Sound Files

## Required Files

Place notification sound files in this directory:

```
public/sounds/
├── notification.mp3      # Default notification sound
├── notification.ogg      # Alternative format for better browser support
└── notification.wav      # Fallback format
```

## Recommended Sound Characteristics

- **Duration**: 0.5 - 2 seconds
- **Volume**: Moderate (not too loud)
- **Format**: MP3 (primary), OGG (fallback)
- **File Size**: < 50KB
- **Sample Rate**: 44.1kHz or 48kHz
- **Bit Rate**: 128kbps

## Free Sound Resources

You can download free notification sounds from:

1. **Freesound.org**
   - https://freesound.org/search/?q=notification
   - License: Creative Commons

2. **Zapsplat.com**
   - https://www.zapsplat.com/sound-effect-category/notifications/
   - Free for commercial use

3. **Mixkit.co**
   - https://mixkit.co/free-sound-effects/notification/
   - Free license

4. **Notification Sounds**
   - https://notificationsounds.com/
   - Various free sounds

## Custom Sound Creation

If you want to create custom sounds:

1. Use **Audacity** (free audio editor)
2. Keep it short and pleasant
3. Export in multiple formats (MP3, OGG, WAV)
4. Test on different devices

## Implementation

The sound is played in `app/composables/useSSE.ts`:

```typescript
const playNotificationSound = () => {
  try {
    const audio = new Audio('/sounds/notification.mp3')
    audio.volume = 0.5
    audio.play().catch(console.error)
  } catch (error) {
    console.error('Failed to play notification sound:', error)
  }
}
```

## Browser Compatibility

| Browser | MP3 | OGG | WAV |
|---------|-----|-----|-----|
| Chrome  | ✅  | ✅  | ✅  |
| Firefox | ✅  | ✅  | ✅  |
| Safari  | ✅  | ❌  | ✅  |
| Edge    | ✅  | ✅  | ✅  |

## User Preferences

Users can control notification sounds through:

1. Browser settings
2. System sound settings
3. Future: In-app notification preferences

## Testing

Test the sound with:

```javascript
// In browser console
const audio = new Audio('/sounds/notification.mp3')
audio.play()
```

## Notes

- Sounds require user interaction before first play (browser policy)
- Volume is set to 0.5 (50%) by default
- Failed sound playback won't break the notification system
