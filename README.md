# NagWeb · Índice de los cinco desarrollos

NagWeb es **un único editor visual** con cinco frentes de desarrollo independientes. Este `main` es una versión histórica del producto; **NO** representa el código más nuevo de todos los frentes. No fusionar ramas automáticamente.

## Regla prioritaria: V1.0 primero

**Todos los frentes deben cerrar primero una V1.0 estable, funcional y verificable, con alcance finito.** Las ampliaciones y recursos opcionales pasan a V1.1+. No inventar tareas ni alargar innecesariamente el desarrollo. Consultar la [Política universal de desarrollo](POLITICA_DESARROLLO_V1_PRIMERO.md), que tiene precedencia sobre prioridades históricas de expansión y también se aplica a otros proyectos futuros.

**Criterio de recuperación y aceptación real (16/10/2026):** una CI verde, una etiqueta o un ZIP no prueban que el editor funcione para el usuario. Usar el **[protocolo obligatorio](POLITICA_DESARROLLO_V1_PRIMERO.md#protocolo-obligatorio-de-recuperación-y-aceptación-real-16102026)**: conservar el trabajo anterior, comprobar el mismo acceso/servidor/ZIP y el flujo crear → editar → guardar/recargar → exportar; un fallo real deja el frente **no aceptado** hasta su corrección. «V1.0 aceptada» requiere confirmación de uso real, no solo CI. Esta precisión tiene precedencia sobre declaraciones antiguas de «terminado»; no mezclar las ramas. 

## Identidad fija, ramas y contexto

| Proyecto | Rama de trabajo | Contexto permanente | Documentación técnica |
|---|---|---|---|
| **NAGWEB 01 | Editor principal** | `feat/storytelling-engine-v2` | [Ficha de continuidad](https://github.com/decrackpichon-gif/NagWeb/blob/feat/storytelling-engine-v2/docs/contexto/NAGWEB_01_Editor_Principal_CONTEXTO.md) | [Documentación técnica](https://github.com/decrackpichon-gif/NagWeb/blob/feat/storytelling-engine-v2/docs/storytelling-engine-v2.md) |
| **NAGWEB 02 | Motion Lab** | `internal-motion-lab` | [Ficha de continuidad](https://github.com/decrackpichon-gif/NagWeb/blob/internal-motion-lab/docs/contexto/NAGWEB_02_Motion_Lab_CONTEXTO.md) | [Documentación técnica](https://github.com/decrackpichon-gif/NagWeb/blob/internal-motion-lab/docs/storytelling-engine-v2.md) |
| **NAGWEB 03 | Cámara 3D** | `feat/scroll-camera-v1` | [Ficha de continuidad](https://github.com/decrackpichon-gif/NagWeb/blob/feat/scroll-camera-v1/docs/contexto/NAGWEB_03_Camara_3D_CONTEXTO.md) | [Documentación técnica](https://github.com/decrackpichon-gif/NagWeb/blob/feat/scroll-camera-v1/docs/scroll-camera-v1.md) |
| **NAGWEB 04 | Interaction Studio** | `feat/interaction-engine-v1` | [Ficha de continuidad](https://github.com/decrackpichon-gif/NagWeb/blob/feat/interaction-engine-v1/docs/contexto/NAGWEB_04_Interaction_Studio_CONTEXTO.md) | [Documentación técnica](https://github.com/decrackpichon-gif/NagWeb/blob/feat/interaction-engine-v1/docs/interaction-engine-v1.md) |
| **NAGWEB 05 | Biblioteca de recursos** | `feat/resource-etl-v1` | [Ficha de continuidad](https://github.com/decrackpichon-gif/NagWeb/blob/feat/resource-etl-v1/docs/contexto/NAGWEB_05_Biblioteca_de_Recursos_CONTEXTO.md) | [Documentación técnica](https://github.com/decrackpichon-gif/NagWeb/blob/feat/resource-etl-v1/tools/resource-etl/README.md) |

**Interaction Studio experimental:** rama separada `feat/interaction-engine-experimental-v1`, documentación [experimental](https://github.com/decrackpichon-gif/NagWeb/blob/feat/interaction-engine-experimental-v1/docs/interaction-engine-experimental-v1.md). No integrarla a estable ni a `main` automáticamente.

## Un único mensaje para retomar en un chat nuevo

Copiar este texto, reemplazar `0X` por el número y conservar el nombre exacto:

> Continuá **NAGWEB 0X | [nombre fijo]**, dentro del repositorio https://github.com/decrackpichon-gif/NagWeb. Buscá en este README la rama exclusiva y el enlace de su ficha en `docs/contexto/`. Leé COMPLETA esa ficha, la documentación técnica indicada allí y los commits recientes **del HEAD actual de esa rama** antes de actuar. Respetá los enlaces, referencias, decisiones, limitaciones y pendientes, sin reconstruir avances ni mezclar otros proyectos. Confirmame en menos de diez líneas dónde quedó y cuál es la mejora de mayor impacto que sigue. **Todavía no cambies código**. Cuando diga **«Avanza»**, implementá un bloque coherente de mejoras y validalo con las pruebas relevantes, hacé commit solo en esa rama y devolveme el enlace, la prueba y el siguiente pendiente. Mantené actualizada la ficha de continuidad cuando haya decisiones, enlaces, bloqueos o hitos importantes. **No declares V1.0 aceptada sin probar el mismo acceso/ZIP/servidor y recibir aceptación real; si se reporta un error funcional, recuperá primero lo que funcionaba y corregí ese bloqueante aunque la CI esté verde.** Evitá pasos y pruebas repetidos, despliegues innecesarios y cambiar a Work por tu cuenta.

**Ya no es obligatorio descargar ni adjuntar el contexto `.md` en cada chat** siempre que el chat nuevo tenga acceso al repositorio y pueda leer el enlace. Si el conector de GitHub no está disponible, adjuntar una copia descargada de la ficha del mismo número.

## Protocolo de cierre y transferencia

- **Fuente de verdad técnica:** HEAD de la rama + sus archivos de documentación. La ficha es contexto de producto, no prueba de que un commit todavía sea el último.
- Al implementar, conservar decisiones, enlaces exactos, limitaciones y la próxima prioridad de cada frente en su ficha **solo cuando tengan valor duradero**. No hacer cientos de actualizaciones triviales.
- Al terminar, responder: **implementado / commit / pruebas reales / pendientes / ¿el usuario debe hacer algo?**. Si no hubo commit, decirlo.
- Si un chat llega al límite: usar el mismo mensaje de arranque en un chat nuevo; el sucesor obtiene GitHub y la ficha. No depende de releer conversaciones inaccesibles.
- Nunca usar un prompt antiguo para retroceder una rama o sobrescribir avances que aparecen en commits posteriores.
- Los originales HAR, ZIP, videos, capturas y archivos privados no se publican en este repo público. La ficha cita nombres y procedencia; si realmente hacen falta, pedir **solo el archivo concreto**.
- No borrar historial, forzar push, mezclar ramas, desplegar manualmente ni modificar código ajeno al frente sin permiso.
- **Importante:** chats normales de ChatGPT no reciben ni leen automáticamente archivos del repositorio. El usuario inicia cada chat pegando el mensaje corto anterior. Los asistentes de código compatibles pueden seguir `AGENTS.md` en cada rama.

Este README es un índice de continuidad. Las fichas y el código permanecen en **sus ramas respectivas**.

## Despliegues controlados para ahorrar Deployment Storage

**Política permanente (octubre 2026):** NagWeb **no se publica automáticamente** por commits, cambios de documentación, pruebas ni actualizaciones de datos. El proyecto Vercel `nahue2/nag_web` se despliega **solo cuando el usuario lo pida expresamente**. La configuración compatible con Vercel se encuentra en el `vercel.json` de cada rama activa y también en `main`:

```json
{ "git": { "deploymentEnabled": false } }
```

Esta opción desactiva activaciones por Git, pero permite publicar explícitamente desde Vercel Dashboard/CLI/API cuando sea necesario. **No** confundir `[skip ci]` (GitHub Actions) con el mecanismo de Vercel: no basta para evitar despliegues automáticos. No ejecutar Vercel para probar cambios; usar pruebas locales y CI de GitHub. Si se crea una rama nueva, heredar `vercel.json` con la restricción. No borrar deployments ni desconectar GitHub automáticamente. La protección evita almacenamiento futuro, pero no limpia el almacenamiento histórico por sí sola.
