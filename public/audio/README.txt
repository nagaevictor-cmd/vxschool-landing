Поместите аудиофайлы треков учеников сюда:

- track1.mp3 - Dark Pulse (Алексей М.)
- track2.mp3 - Midnight Rave (Мария К.) 
- track3.mp3 - Industrial Dreams (Дмитрий С.)
- track4.mp3 - Neon Nights (Елена В.)

Рекомендуемый формат: MP3, 320kbps
Длительность: 3-6 минут
Размер файла: не более 10MB каждый

Для демо-версии используется симуляция воспроизведения.
Чтобы подключить реальные аудиофайлы, замените mock-код в script.js на:

```javascript
// Замените симуляцию на:
currentAudio = new Audio(`/audio/${trackId}.mp3`);
currentAudio.play();
```