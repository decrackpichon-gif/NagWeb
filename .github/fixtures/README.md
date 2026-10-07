`story-probe.webm` es un video sintético de dos segundos, sin recursos externos, para probar búsquedas reales de tiempo en Chromium. Se generó con:

```sh
ffmpeg -f lavfi -i 'testsrc2=size=64x64:rate=10:duration=2' -c:v libvpx-vp9 -g 1 -an story-probe.webm
```
