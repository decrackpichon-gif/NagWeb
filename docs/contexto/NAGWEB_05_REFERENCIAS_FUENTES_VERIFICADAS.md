# NAGWEB 05 | Referencias de fuentes y URLs comprobadas

> **Auditoría de continuidad del 14/10/2026.** Complementa a `NAGWEB_05_Biblioteca_de_Recursos_CONTEXTO.md` y al [README técnico](../../tools/resource-etl/README.md). **Fuente de verdad**: rama `feat/resource-etl-v1`, sus importadores y manifiestos vigentes. No desplegar Vercel.

## Hallazgo principal: la diferencia entre tres clases de evidencia

1. **Enlace original escrito por el usuario:** una URL recuperada literalmente de un mensaje o de un archivo original. Los textos históricos `Texto pegado(4).txt`, `Texto pegado(7).txt` y `Texto pegado(8).txt` **no conservan las URL individuales** de los proveedores enumerados. No afirmar que el usuario compartió las direcciones de la tabla que sigue.
2. **URL de origen comprobada en el código de NagWeb:** la URL fue extraída del importador real o de su política de licencias en la rama de trabajo. **Son referencias técnicas auténticas y utilizables**, pero su procedencia es el repositorio, no necesariamente un chat del usuario.
3. **URL o recurso pendiente de recuperación:** adjunto/mensaje histórico no localizado o ya inaccesible. No inventarlo ni tratarlo como bloqueo de una tarea para la que el código y los recursos disponibles bastan.

## Fuentes realmente configuradas en el código: 17 proveedores

Para cada entrada se verificó el módulo que contiene su URL, `REPO`, `API_URL` o `BASE_URL`, en `tools/resource-etl/src/extractors/`. **Esto no significa que todas las familias puedan insertarse y editarse nativamente**: comprobar `editorUse`, transformadores y restricciones de licencias en HEAD antes de prometer funcionalidad.

| Proveedor | URL recuperada de los importadores | Evidencia en código | Uso o límite |
|---|---|---|---|
| Poly Haven | [API de catálogo](https://api.polyhaven.com) | [`src/extractors/polyhaven.mjs`](../../tools/resource-etl/src/extractors/polyhaven.mjs) | Consulta de assets publicados (modelos); validar licencia por asset. |
| ambientCG | [API de catálogo](https://ambientcg.com/api/v2/full_json) | [`src/extractors/ambientcg.mjs`](../../tools/resource-etl/src/extractors/ambientcg.mjs) | Endpoint exacto definido en código; no confundir con sitio principal. |
| PMNDRS Market | [GitHub, assets](https://github.com/pmndrs/market-assets) | [`src/extractors/pmndrs.mjs`](../../tools/resource-etl/src/extractors/pmndrs.mjs) | Materiales, modelos y HDRIs, verificar procedencia por archivo. |
| Kenney | [Catálogo oficial](https://kenney.nl/assets) | [`src/extractors/kenney.mjs`](../../tools/resource-etl/src/extractors/kenney.mjs) | Licencia CC0 comprobada por paquete, no asumir que todo lo publicado es CC0. |
| shadcn/ui | [Repositorio y registro](https://github.com/shadcn-ui/ui) | [`src/extractors/shadcn.mjs`](../../tools/resource-etl/src/extractors/shadcn.mjs) | Registro exacto de referencia: https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry.json |
| Lucide | [Repositorio fuente](https://github.com/lucide-icons/lucide) | [`src/extractors/lucide.mjs`](../../tools/resource-etl/src/extractors/lucide.mjs) | SVG originales, atribución ISC. |
| Magic UI | [Repositorio fuente](https://github.com/magicuidesign/magicui) | [`src/extractors/magicui.mjs`](../../tools/resource-etl/src/extractors/magicui.mjs) | Consulta el registry del repositorio, no una copia de una web arbitraria. |
| Motion Primitives | [Repositorio fuente](https://github.com/ibelick/motion-primitives) | [`src/extractors/motion-primitives.mjs`](../../tools/resource-etl/src/extractors/motion-primitives.mjs) | Componentes sujetos al manifiesto y licencia verificados. |
| AnimXYZ | [Repositorio fuente](https://github.com/ingram-projects/animxyz) | [`src/extractors/animxyz.mjs`](../../tools/resource-etl/src/extractors/animxyz.mjs) | CSS/SCSS y presets derivables. |
| Three.js | [Repositorio fuente](https://github.com/mrdoob/three.js) | [`src/extractors/threejs.mjs`](../../tools/resource-etl/src/extractors/threejs.mjs) | Código de ejemplos; no incorporar automáticamente texturas/modelos ajenos. |
| HyperUI | [Repositorio fuente](https://github.com/markmead/hyperui) | [`src/extractors/hyperui.mjs`](../../tools/resource-etl/src/extractors/hyperui.mjs) | Bloques HTML/Tailwind sin media externa. |
| CSSShake | [Repositorio fuente](https://github.com/elrumordelaluz/csshake) | [`src/extractors/csshake.mjs`](../../tools/resource-etl/src/extractors/csshake.mjs) | Animaciones CSS/SCSS. |
| glsl-noise | [Repositorio fuente](https://github.com/hughsk/glsl-noise) | [`src/extractors/glsl-noise.mjs`](../../tools/resource-etl/src/extractors/glsl-noise.mjs) | Funciones GLSL portables. |
| Uiverse (Galaxy) | [Archivo de origen oficial utilizado](https://github.com/uiverse-io/galaxy) | [`src/extractors/uiverse.mjs`](../../tools/resource-etl/src/extractors/uiverse.mjs) | Componentes HTML/CSS independientes, con atribución individual. |
| SpinKit | [Repositorio fuente](https://github.com/tobiasahlin/SpinKit) | [`src/extractors/spinkit.mjs`](../../tools/resource-etl/src/extractors/spinkit.mjs) | Loaders HTML/CSS. |
| Magic.css | [Repositorio fuente](https://github.com/miniMAC/magic) | [`src/extractors/magic-css.mjs`](../../tools/resource-etl/src/extractors/magic-css.mjs) | Efectos CSS/SCSS. |
| Heroicons | [Repositorio fuente](https://github.com/tailwindlabs/heroicons) | [`src/extractors/heroicons.mjs`](../../tools/resource-etl/src/extractors/heroicons.mjs) | Solo outline 24px compatible con editor SVG; preservar licencia MIT. |

Las rutas de GitHub de esta tabla son las URL literales construidas con las constantes `REPO` del código. Los endpoints dinámicos resuelven el commit concreto antes de descargar archivos; no depender de la versión móvil de una web, de un link de preview ni de una rama remota que pueda cambiar silenciosamente.

### Registro exacto de shadcn

El adaptador utiliza el JSON: https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry.json , y resuelve los archivos relativos contra `https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/`. Esta referencia es más útil para continuidad de código que recordar solamente `shadcn.com`.

## Restricciones y enlaces legales que YA figuran en NagWeb

**Origen exacto:** [`tools/resource-etl/src/vault/source-policies.mjs`](../../tools/resource-etl/src/vault/source-policies.mjs). Respetar los campos `mirrorMode` del código; no convertir una licencia del runtime en licencia del catálogo.

| Fuente | Política actual de NagWeb | URL de licencia/términos guardada en código | Motivo |
|---|---|---|---|
| Lygia | **bloqueado pendiente de licencia comercial** | [Fuente legal](https://github.com/patriciogonzalezvivo/lygia/blob/main/LICENSE.md) | Prosperity 3.0/Patron |
| Animate.css | **bloqueado pendiente de revisión** | [Fuente legal](https://github.com/animate-css/animate.css/blob/main/LICENSE) | Restricciones identificadas por NagWeb como Hippocratic 2.1 |
| Hover.css | **bloqueado sin licencia OEM apropiada** | [Fuente legal](https://github.com/IanLunn/Hover/blob/master/license.txt) | Licencia específica builders/toolkits |
| Aceternity | **bloqueado para mirror automático** | [Fuente legal](https://ui.aceternity.com/licence) | Términos del proveedor requieren revisión |
| React Bits | **solo metadatos** | [Fuente legal](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md) | MIT + Commons Clause señalado en código |
| LottieFiles Community | **solo metadatos, no scraping masivo** | [Fuente legal](https://lottiefiles.com/page/license) | Licencia de contenido diferente del player |
| dotlottie-web | **solo código del reproductor/runtime** | [Fuente legal](https://github.com/LottieFiles/dotlottie-web/blob/main/LICENSE) | MIT del player no licencia biblioteca de animaciones |

Esas restricciones provienen de una lectura del módulo interno y deben contrastarse con los términos vigentes **antes de cambiar una política legal**. No constituyen un dictamen jurídico. El importador local de Lottie es un caso distinto: permite importar archivos sobre los que el usuario tenga derechos; no habilita copiar indiscriminadamente LottieFiles Community.

## Material histórico realmente recuperado

- `Texto pegado(4).txt`: ficha técnica antigua de Resource Vault/Code Vault con esquema `UniversalResource`, flujos de preview y las bibliotecas trabajadas. URL recuperada allí: **solo** `https://github.com/decrackpichon-gif/NagWeb`.
- `Texto pegado(7).txt` y `Texto pegado(8).txt`: dos copias del resumen histórico de la Biblioteca; enlaces recuperados principalmente al repositorio propio, al [historial de commits](https://github.com/decrackpichon-gif/NagWeb/commits/feat/resource-etl-v1/) y a [una ejecución antigua de CI](https://github.com/decrackpichon-gif/NagWeb/actions/runs/38072364919). Contienen contexto útil, **no** URL individuales a todos los sitios fuente.
- Los archivos históricos existen en la Biblioteca del usuario, **no se subieron al GitHub público**. Para examinar un original, usar la Biblioteca por nombre exacto si la integración está disponible.
- [Contexto permanente de NAGWEB 05](NAGWEB_05_Biblioteca_de_Recursos_CONTEXTO.md) y [README técnico](../../tools/resource-etl/README.md) ya contienen numerosos acuerdos de licencia y estado; no reconstruirlos por memoria.

## Cómo resolver faltantes futuros sin perjudicar el desarrollo

1. Para trabajo de código sobre un proveedor de la tabla, leer **primero el importador exacto**, `source-policies.mjs`, los metadatos persistidos, las pruebas y el HEAD. **No detener avances que ya están respaldados por código** alegando que falta la URL que el usuario habría pegado en otro chat.
2. Si una tarea depende de un video, HAR, página específica o repositorio **que no aparece ni en este informe ni en el código**, indicar la referencia concreta faltante y buscarla en la Biblioteca/archivos originales. Pedir al usuario **solo esa referencia** si sigue inaccesible.
3. Cuando aparezca una URL original nueva, registrar URL completa, qué aporte hizo, procedencia literal (usuario / código / web pública), alcance y fecha. No mezclar evidencia con suposiciones.
4. Para comprobar cambios recientes: [últimos commits de la rama](https://github.com/decrackpichon-gif/NagWeb/commits/feat/resource-etl-v1/) y [GitHub Actions para esta rama](https://github.com/decrackpichon-gif/NagWeb/actions?query=branch%3Afeat%2Fresource-etl-v1). La fuente actual es GitHub, no la cifra de etapa del archivo histórico.
5. Para el catálogo persistente de `resource-vault-data`, mirar su historia separada y los checksums antes de hablar de cantidades o cobertura. No mezclar ni fusionar ramas.
6. **No desplegar automáticamente** en Vercel; el `vercel.json` de esta rama protege contra ello. La creación de este documento no justifica ejecución adicional de pruebas de código.

**Límite de la recuperación:** el presente informe documenta enlaces de origen probados por código y términos guardados en el repositorio. No certifica la recuperación literal de todo enlace de chat antiguo; eso requiere los mensajes originales o la exportación cuando esté disponible.
