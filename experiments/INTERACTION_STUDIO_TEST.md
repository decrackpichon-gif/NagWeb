# Interaction Studio — kit de prueba

Este paquete corresponde al laboratorio aislado de Interaction Engine. No modifica ni integra nada en el editor principal de NagWeb.

## Cómo abrirlo

1. Descomprimir el ZIP completo conservando las carpetas.
2. Abrir `experiments/interaction-studio-v1.html` con Chrome o Edge.
3. La demo arranca con un asset incluido.
4. Para probar un recurso propio usar **Subir PNG / JPG / WebP**.

## Qué probar

### Seguidor

- Cambiar Modo a **Seguidor**.
- Probar los presets Suave, Flotante, Ágil, Pesado, Magnético y Personaje.
- Cambiar Tamaño y Distancia del cursor.
- Cambiar **Frente del asset** si el personaje apunta hacia arriba, izquierda o abajo.
- Mover el cursor por todo el lienzo.

### Orgánico

- Usar una imagen transparente y preferentemente alargada.
- Elegir **Orgánico** o dejar **Automático** si NagWeb lo recomienda.
- Revisar los puntos **COLA** y **CABEZA**.
- Arrastrarlos si el eje fue interpretado mal.
- Usar **Invertir** si el eje es correcto pero la dirección está al revés.
- Tocar **Aplicar eje orgánico**.
- Probar Flexibilidad y Ondas.

### Influencia

- Activar/desactivar **Empujar elementos cercanos**.
- Probar Radio y Fuerza.
- Pasar el recurso por encima de las letras MOVE / WITH / ME y observar su recuperación elástica.

### Preparación

- Probar PNG/WebP transparente.
- Probar JPG con fondo.
- La opción de IA está desactivada por defecto. Si se activa, el navegador intentará cargar el modelo externo cuando sea necesario.
- Cancelar una preparación y verificar que el original siga intacto.

### Configuración portable

- Tocar **Generar JSON**.
- El JSON debe contener `nagweb-interaction-session`, perfil del asset, opciones de movimiento y reporte de preparación.

## Qué feedback sirve

Anotar especialmente:

- qué imagen usaste;
- qué modo eligió NagWeb automáticamente;
- si CABEZA/COLA quedaron bien;
- si tuviste que invertir/corregir el eje;
- si el movimiento se siente natural;
- deformaciones extrañas;
- controles confusos;
- errores visibles;
- si la influencia sobre el texto se siente demasiado fuerte o débil.

No hacer merge del PR #2. Este kit es sólo QA.
