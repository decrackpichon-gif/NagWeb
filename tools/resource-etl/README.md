# NagWeb Resource ETL v0.1

Importador aislado para construir el catálogo universal de recursos de NagWeb.

Esta carpeta no toca el editor principal, MotionLab, Director de Scroll ni la cámara 3D.
No hace deploy de Vercel. Todo se ejecuta localmente.

## Windows: forma recomendada

Si no querés usar consola, abrí con doble clic:

`INICIAR_IMPORTADOR_WINDOWS.bat`

El archivo muestra un menú en español y ejecuta por vos las pruebas, la creación del catálogo o las descargas. No hace falta usar Linux.

> Durante el desarrollo no hace falta que ejecutes nada hasta que se indique explícitamente que hay una prueba para hacer.

## Requisitos

- Node.js 20 o superior.
- Conexión a Internet.
- Ejecutar desde esta carpeta para que `output/` quede aquí.

```bash
cd tools/resource-etl
```

No hay dependencias npm externas en este piloto.

## 1. Prueba sin escribir ni descargar

Poly Haven:

```bash
npm run ingest -- --source=polyhaven --limit=5 --dry-run
```

Shadcn:

```bash
npm run ingest -- --source=shadcn --limit=5 --dry-run
```

ambientCG:

```bash
npm run ingest -- --source=ambientcg --limit=5 --dry-run
```

PMNDRS:

```bash
npm run ingest -- --source=pmndrs --limit=6 --dry-run
```

Kenney:

```bash
npm run ingest -- --source=kenney --limit=5 --dry-run
```

Si no se especifica `--write` ni `--download`, el CLI también entra en dry-run por seguridad.

## 2. Crear el catálogo local sin binarios

```bash
npm run ingest -- --source=polyhaven --limit=25 --write
npm run ingest -- --source=ambientcg --limit=25 --write
npm run ingest -- --source=pmndrs --limit=25 --write
npm run ingest -- --source=kenney --limit=25 --write
npm run ingest -- --source=shadcn --limit=25 --write
```

Esto escribe manifests `UniversalResource` en `output/`.

## 3. Descargar realmente los recursos

Poly Haven, formato web-friendly y resolución piloto:

```bash
npm run ingest -- --source=polyhaven --limit=5 --download --format=gltf --resolution=1k
```

El importador descarga el glTF y también los archivos declarados en el mapa `include` de Poly Haven, de forma que texturas/binarios acompañantes se conserven juntos.

Shadcn:

```bash
npm run ingest -- --source=shadcn --limit=10 --download
```

Esto guarda el código fuente de cada componente además de su manifest universal.

ambientCG:

```bash
npm run ingest -- --source=ambientcg --limit=5 --download --resolution=1K --file-type=JPG
```

Por defecto ambientCG indexa modelos 3D y materiales. Se puede limitar con `--type=model` o `--type=material`. El piloto descarga el paquete elegido por la API y conserva todas las alternativas en el manifest universal.

PMNDRS:

```bash
npm run ingest -- --source=pmndrs --limit=6 --download
```

PMNDRS se obtiene desde el repositorio oficial `pmndrs/market-assets`: modelos, materiales e HDRI. Para cada recurso conserva `info.json` como metadata y descarga todos los archivos necesarios de su carpeta cuando se usa `--download`.

Kenney:

```bash
npm run ingest -- --source=kenney --limit=5 --download
```

Kenney se consulta desde el catálogo oficial. El extractor sólo marca un pack como validado cuando la página confirma CC0 y encuentra el ZIP oficial. En esta etapa el ZIP se conserva como pack; el desempaquetado e indexación de modelos/UI individuales queda separado para no mezclar un pack entero con un único recurso editable.

## Salida

Ejemplo:

```text
output/
├─ polyhaven/
│  ├─ catalog.json
│  └─ armchair-01/
│     ├─ resource.json
│     └─ files/
│        ├─ ArmChair_01_1k.gltf
│        └─ ...
└─ shadcn/
   ├─ catalog.json
   └─ button/
      ├─ resource.json
      └─ files/
         └─ registry/new-york-v4/ui/button.tsx
```

## Seguridad del piloto

- Límite explícito con `--limit`.
- Dry-run como comportamiento predeterminado.
- Reintentos y backoff para HTTP 429/5xx.
- Límite de 512 MiB por archivo descargado.
- Rechazo de rutas con `../`.
- Poly Haven: solamente assets publicados.
- Los binarios no se agregan al repositorio porque `output/` está ignorado.

## Siguiente etapa

Después de validar Poly Haven + Shadcn:

1. persistencia en Supabase;
2. deduplicación por `source.provider + source.externalId + sourceHash`;
3. sincronización incremental;
4. ambientCG; ✅ extractor v0.1
5. PMNDRS; ✅ extractor v0.1
6. Kenney; ✅ extractor de packs v0.1
7. Aceternity;
8. Magic UI;
9. Uiverse;
10. HyperUI;
11. Lucide;
12. Lottie;
13. inferencia más rica de `editableProps` desde AST/CSS/schema;
14. panel de catálogo dentro de NagWeb.


## ambientCG v0.1

La API se consulta con `downloadData`, `previewData` y metadatos técnicos. El transformador normaliza tanto `3DModel` como `Material` y mantiene todos los paquetes disponibles como artifacts. Para una descarga piloto elige 1K-JPG cuando existe.

No se descomprime el ZIP automáticamente todavía: primero preservamos el paquete original y su metadata; la extracción/optimización web queda para una etapa posterior.


## PMNDRS v0.1

No depende del HTML del Market. Lee el árbol Git oficial de `pmndrs/market-assets` y reconstruye los paquetes por carpeta.

- `models`: prioriza GLB/GLTF como entrypoint y conserva texturas/binarios.
- `materials`: conserva imágenes/materiales asociados.
- `hdris`: prioriza HDR/EXR.
- licencia 1 se normaliza a CC0; cualquier licencia distinta queda pendiente de revisión en vez de publicarse silenciosamente.


## Kenney v0.1

El extractor recorre el catálogo oficial de Kenney, abre cada página de asset y valida dos condiciones antes de permitir descarga:

1. la página declara `Creative Commons CC0`;
2. existe un enlace ZIP oficial bajo `kenney.nl/media/pages/assets/`.

Los packs se guardan inicialmente como `asset-pack`. Esto es deliberado: un ZIP de Kenney puede contener decenas o cientos de modelos, sprites o elementos UI. La etapa siguiente desempaquetará esos ZIP e indexará sus recursos internos de forma individual.


# NagWeb Code Vault

La biblioteca liviana autosuficiente vive en `vault/` y está separada de los assets pesados.

Conserva localmente, cuando la licencia lo permite:

- SVG;
- JSON;
- Lottie JSON que tengamos derecho a conservar;
- TypeScript / TSX / JavaScript;
- CSS y keyframes;
- presets de movimiento;
- shaders GLSL;
- escenas de código;
- metadata necesaria para reconstruir cada recurso.

## Primera implementación real

### Lucide

El extractor lee el snapshot actual de `lucide-icons/lucide` y guarda por cada icono:

- `icon.svg`;
- `metadata.json`;
- `resource.json`;
- tags/categorías;
- controles editables de tamaño, color y grosor.

### Magic UI

El extractor usa el `registry.json` oficial de `magicuidesign/magicui` y conserva:

- TSX completo;
- dependencias;
- registry dependencies;
- CSS variables;
- keyframes;
- metadata;
- `editableProps` inferidos automáticamente desde las interfaces TypeScript.

## Bundle portable

Cada ejecución genera:

`vault/nagweb-code-library.json`

Ese archivo contiene una copia portable de todos los recursos livianos ya presentes en el Vault.

También se genera:

`vault/THIRD_PARTY_NOTICES.txt`

para conservar las obligaciones de licencia.

## Construcción piloto

```bash
npm run vault -- --sources=lucide,magicui --limit=25
```

## Construcción completa

```bash
npm run vault:all
```

## Lottie local

NagWeb ya puede reconocer archivos Lottie JSON que tengamos derecho a conservar y convertirlos a recursos nativos del Vault. No se hace scraping masivo de la biblioteca comunitaria de LottieFiles.

## Política legal automatizada

`src/vault/source-policies.mjs` define por proveedor:

- `full`: mirror completo;
- `code-only`: sólo código;
- `metadata-only`: indexar sin copiar archivos;
- `blocked-pending-review`: no automatizar hasta revisar licencia.

El objetivo es que el sistema falle de forma segura antes de copiar una fuente con derechos poco claros.


## Code Vault v0.2 · fuentes autosuficientes

El modo completo actual incluye:

- **Lucide**: SVG + metadata por icono, espejo completo permitido por ISC.
- **Magic UI**: TSX + dependencias + CSS/keyframes, espejo completo MIT.
- **Motion Primitives**: componentes animados React desde sus registry JSON, espejo completo MIT.
- **AnimXYZ**: fuente SCSS completa + 25 presets nativos NagWeb derivados de sus utilidades, MIT.
- **Three.js**: sólo ejemplos que pasan un filtro `code-only`; cualquier ejemplo con modelos, texturas, HDR, audio, video o datos externos queda excluido automáticamente.
- **Lottie local**: importación de JSON que ya tengamos derecho a conservar. La colección comunitaria de LottieFiles no se scrapea ni se redistribuye.

Comando de biblioteca completa:

```bash
npm run vault:all
```

Salida conceptual:

```text
vault/
├─ catalog.json
├─ nagweb-code-library.json
├─ THIRD_PARTY_NOTICES.txt
└─ providers/
   ├─ lucide/
   ├─ magicui/
   ├─ motion-primitives/
   ├─ animxyz/
   └─ threejs/
```

`nagweb-code-library.json` es el equivalente técnico al gran archivo portable que permitiría reconstruir la biblioteca liviana sin consultar los hosts originales.

### Presets nativos

AnimXYZ ya inaugura el segundo nivel de la estrategia: no sólo conservar código externo, sino traducir conceptos compatibles a un formato propio:

`nagweb-motion-preset/0.1`

Actualmente se generan presets como `fade`, `up`, `down`, `front`, `back`, `flip-left`, `flip-right`, `rotate-left`, `big`, `small`, `skew-up`, etc. El adaptador final a MotionLab se hará sin convertir a AnimXYZ en dueño del runtime.

## CI con red

La rama `feat/resource-etl-v1` incluye un workflow de GitHub Actions que ejecuta `npm test`, construye un Code Vault pequeño y hace smoke tests reales contra las fuentes externas. Esto permite validar el ETL con acceso a Internet sin usar Vercel.


## Preview + Insert adapters

El Vault ya no sólo guarda recursos. También genera una capa de consumo común:

- `src/runtime/instance.mjs`: crea instancias con los valores editables por defecto y overrides del usuario.
- `src/runtime/insert-adapters.mjs`: convierte un `UniversalResource` en un descriptor de inserción para SVG, HTML/Tailwind, Motion nativo, Lottie, React o Three.js.
- `src/preview/build-preview.mjs`: genera previews HTML estáticas cuando el recurso puede ejecutarse sin compilación.

Cada construcción del Vault crea:

```text
vault/
└─ previews/
   ├─ lucide__accessibility.html
   ├─ hyperui__application__loaders__1.html
   └─ animxyz__preset__flip-left.html
```

SVG, HyperUI y los presets de movimiento pueden previsualizarse offline inmediatamente.

Los componentes React como Magic UI y Motion Primitives quedan marcados como `react-compile-sandbox-required`. El código está completamente conservado, pero la preview viva necesita una etapa de compilación/sandbox que se implementará por separado.


## GLSL + validación Windows

El Code Vault también incorpora `hughsk/glsl-noise` (MIT):

- Classic noise 2D/3D/4D;
- Periodic noise 2D/3D/4D;
- Simplex noise 2D/3D/4D.

Cada archivo GLSL queda como recurso `shader` independiente y autosuficiente. Se conserva el símbolo exportado para poder integrarlo posteriormente en materiales, Shader Lab o escenas Three.js de NagWeb.

La CI ahora tiene además un job `windows-latest`. Ejecuta el self-test y construye un Vault pequeño usando rutas reales de Windows, de modo que la compatibilidad básica con tu entorno no dependa de que ejecutes pruebas manuales en tu PC.


## React Preview Sandbox v0.1

Las previews React no se ejecutan directamente desde código remoto.

Antes de compilar un recurso se verifica:

1. imports estáticos y aliases;
2. imports relativos resolubles dentro del propio recurso;
3. ausencia de imports remotos y módulos Node;
4. scanner de llamadas de red, storage, `eval`, iframes e inyección de scripts;
5. props obligatorias que impidan fabricar una demo segura;
6. dependencias de registry aún no resueltas;
7. licencia npm de cada paquete utilizado.

El runtime inicial admite sólo:

- React;
- React DOM;
- Motion / Framer Motion;
- react-use-measure.

`@/lib/utils` se reemplaza por un helper `cn()` local para no depender del proyecto fuente.

Las previews resultantes:

- se compilan con esbuild;
- incluyen React/Motion dentro del bundle de preview;
- usan una copia local de `@tailwindcss/browser`;
- no necesitan CDN;
- llevan Content Security Policy con `connect-src 'none'`, sin frames ni media remota;
- generan `react-preview-audit.json` con el motivo de cada aprobación o rechazo.

Para activarlas:

```bash
npm install
npm run vault -- --sources=magicui,motion-primitives --limit=10 --react-previews
```

En Windows también existe la opción 14 del lanzador, que instala las dependencias del compilador y construye el Vault con previews React.


## Shadcn en el Code Vault

El extractor Shadcn existente ahora también alimenta el Code Vault. Los archivos TSX del registry oficial se conservan localmente bajo el mismo esquema universal que Magic UI y Motion Primitives.

Las dependencias internas de registry se mantienen explícitas. Un componente puede estar completamente guardado aunque su preview React quede diferida hasta que el resolver de registry tenga todas sus piezas.


### Ajustes del sandbox React

El detector reconoce tanto `export function Component` como el patrón habitual de Shadcn/Motion Primitives `export { Component, SubComponent }`.

Los props obligatorios de subcomponentes se registran como información pero ya no bloquean automáticamente el bundle principal.

`next-themes` se virtualiza en preview con un tema local fijo. Esto permite previsualizar componentes como Magic Card sin añadir una dependencia de runtime ni leer preferencias del sistema.


### Shadcn v4 en previews React

El sandbox reconoce el formato actual de Shadcn v4:

- `cn` se reemplaza por el helper local del sandbox;
- `radix-ui@1.4.3` forma parte del runtime permitido;
- `lucide-react@0.474.0` forma parte del runtime permitido;
- `class-variance-authority@0.7.1` forma parte del runtime permitido.

Esto amplía el coverage de preview sin instalar todo el ecosistema Shadcn.


## Registry dependencies locales

El compilador React puede resolver dependencias entre recursos ya guardados en el Vault.

Ejemplos:

```text
shadcn:alert-dialog
└─ necesita button
   └─ resuelve shadcn:button desde el Vault

shadcn:button-group
├─ button
└─ separator
```

Se reconocen aliases de origen como:

- `@/components/ui/button`;
- `@/registry/new-york-v4/ui/button`;
- `@/components/magicui/...`.

La resolución es recursiva y sólo acepta dependencias con licencia verificada. Si una pieza no está presente en el Vault, la preview queda diferida en lugar de descargarla silenciosamente desde Internet.

CI prueba explícitamente que `shadcn:alert-dialog` compila utilizando `shadcn:button` local.


## Galería offline

Cada construcción del Vault genera también:

```text
vault/index.html
```

Es una estantería visual completamente local con:

- búsqueda por texto;
- filtro por proveedor;
- filtro por familia;
- filtro por estado de preview;
- previews embebidas cuando están listas;
- acceso al `resource.json`;
- copia rápida del ID universal del recurso.

La galería no usa CDN, APIs ni backend. Lee un snapshot embebido del catálogo generado en esa misma corrida, por lo que también funciona abierta como archivo local.


## Recetas de preview React

El sandbox ya distingue entre "el componente compila" y "la preview explica qué hace".

Se generan mini escenas locales para componentes compuestos como:

- Magic Card;
- Android;
- Motion Primitives Accordion;
- Motion Primitives Animated Background;
- Shadcn Accordion;
- Shadcn Alert;
- Shadcn Alert Dialog;
- Shadcn Aspect Ratio;
- Shadcn Button.

Las recetas usan sólo exports del recurso y dependencias ya resueltas en el Vault. Un árbol declarativo describe componentes, elementos HTML, props y children, y el sandbox lo renderiza sin ejecutar código de configuración remoto.

Los recursos sin receta específica siguen teniendo una preview genérica automática.


## Variantes CVA → controles NagWeb

El analizador TSX reconoce configuraciones de `class-variance-authority` (`cva`).

Por ejemplo:

```ts
variants: {
  variant: { default: "...", outline: "...", ghost: "..." },
  size: { default: "...", sm: "...", lg: "..." }
}
```

se convierte en:

- selector visual `variant`;
- selector visual `size`;
- opciones reales tomadas del código;
- `defaultVariants` como valores iniciales.

Las variantes booleanas `true/false` se convierten en toggle.

Shadcn usa ahora el mismo analizador que Magic UI/Motion Primitives, manteniendo además controles base de NagWeb como opacidad y el texto de Button.


## Uiverse · importación escalable

Uiverse Galaxy se integra como fuente MIT de componentes HTML/CSS autónomos.

El importador conserva el archivo original completo y extrae:

- autor;
- categoría;
- tags;
- ruta y commit de origen;
- checksum;
- preview offline.

Los recursos con scripts, iframes o URLs externas se omiten del Vault autónomo.

### Inventario liviano

Para conocer todos los candidatos sin descargar el contenido de miles de componentes:

```bash
npm run uiverse:inventory -- --out=vault
```

Esto crea `vault/uiverse-inventory.json` con la ruta, categoría, autor inferido, slug y SHA de cada candidato.

### Lotes reanudables

```bash
npm run vault -- --sources=uiverse --limit=100 --uiverse-offset=0
```

Al terminar, el CLI informa:

```text
[uiverse] offset 0 -> 112
```

El siguiente lote puede continuar con:

```bash
npm run vault -- --sources=uiverse --limit=100 --uiverse-offset=112
```

El offset representa la posición escaneada dentro del inventario, por lo que los elementos descartados por depender de recursos externos no provocan duplicados al reanudar.

También se puede limitar por categoría:

```bash
npm run vault -- --sources=uiverse --limit=100 --uiverse-category=Buttons
```

En Windows, el lanzador incluye opciones para crear el inventario y ejecutar lotes de 100 sin escribir comandos.


### Checkpoint automático de Uiverse

Para importar lotes sin recordar offsets:

```bash
npm run uiverse:batch -- --limit=100 --resume --out=vault
```

Después de que todo el lote se guarda correctamente, NagWeb escribe:

```text
vault/uiverse-checkpoint.json
```

El checkpoint registra:

- commit de Uiverse utilizado;
- offset inicial;
- próximo offset;
- cuántos archivos se escanearon;
- cuántos recursos autónomos se importaron;
- cuántos fueron descartados;
- cuántos recursos Uiverse existen ya en el Vault;
- si el recorrido terminó.

La próxima ejecución con `--resume` lee ese archivo y continúa sola. El checkpoint se actualiza al final, después de escribir recursos, catálogo, previews, galería, bundle portable y avisos de licencia.

En Windows, la opción **16 · CONTINUAR Uiverse** hace exactamente esto sin pedir ningún número.


### Protección contra cambios del upstream

Un offset sólo es válido para el inventario exacto del que salió.

Cuando se usa `--resume`, NagWeb compara el `sourceCommit` guardado en `uiverse-checkpoint.json` con el commit actual de Uiverse. Si son distintos, el lote se cancela antes de escribir recursos, no modifica el catálogo y no mueve el checkpoint.

Esto evita huecos o duplicados si Uiverse agrega, elimina o reordena archivos entre dos sesiones de importación.


## Magic.css · 65 efectos autónomos

El Code Vault incorpora `miniMAC/magic` bajo licencia MIT.

Se importan los 65 archivos de efectos SCSS como recursos independientes. Cada recurso conserva su CSS completo, incluyendo keyframes y la clase base `magictime`, por lo que no depende de CDN ni del repositorio original durante el uso.

Familias disponibles:

- bling;
- boing;
- bomb;
- magic effects;
- math;
- on the space;
- perspective;
- rotate;
- slide;
- static effects;
- static effects out;
- tin.

Los efectos exponen controles NagWeb de duración, demora, easing y cantidad de repeticiones. La galería offline reproduce automáticamente cada animación para que pueda evaluarse visualmente.


## Restaurar desde la copia persistente de NagWeb

La rama generada `resource-vault-data` es una fuente propia de reconstrucción. No hace falta volver a consultar los sitios originales para recuperar el código conservado.

Restauración desde nuestra rama de datos:

```bash
npm run vault:restore -- --out=vault-restored
```

El restaurador:

1. lee `vault-manifest.json` desde la rama persistente de NagWeb;
2. descarga únicamente nuestros snapshots comprimidos;
3. verifica SHA-256 de cada snapshot;
4. descomprime los `UniversalResource`;
5. reconstruye carpetas, `resource.json`, catálogo, galería, bundle portable y avisos de licencia.

Para regenerar también previews React:

```bash
npm run vault:restore -- --out=vault-restored --react-previews
```

Para una restauración totalmente offline, primero se puede tener una copia local de `resource-vault-data` y usar:

```bash
npm run vault:restore -- --source-dir=RUTA_A_RESOURCE_VAULT_DATA --out=vault-restored
```

También se puede restaurar sólo una parte:

```bash
npm run vault:restore -- --snapshots=uiverse,lucide --out=vault-restored
```

En Windows, la opción **17 · RECONSTRUIR Vault desde NUESTRA copia persistente** hace la restauración completa con previews React y no consulta a los proveedores originales.


## Bundle único del Vault

La rama persistente publica además:

```text
all/library.json.gz
all/browse-index.json.gz
all/manifest.json
```

`library.json.gz` contiene todos los recursos livianos persistidos en un único archivo comprimido y verificado por SHA-256.

`browse-index.json.gz` contiene únicamente metadata liviana de navegación y búsqueda: ID, título, tipo, proveedor, categorías, tags, capacidades y texto de búsqueda. Está pensado para que la interfaz de NagWeb pueda mostrar la biblioteca completa sin cargar primero todo el código fuente.

La restauración completa usa automáticamente el bundle consolidado cuando existe. Las restauraciones parciales con `--snapshots=...` siguen usando los snapshots individuales.


### IDs de Uiverse sin colisiones

Los IDs de Uiverse incluyen categoría, autor y slug, por ejemplo `uiverse:cards:praashoo7:thin-sloth-31`. El snapshot de Uiverse y el bundle consolidado rechazan IDs duplicados en vez de sobrescribirlos silenciosamente.


## SpinKit · loaders CSS autónomos

SpinKit se incorpora bajo licencia MIT con sus 12 loaders oficiales.

Cada recurso conserva el HTML y CSS necesarios para funcionar sin CDN ni runtime externo. Los controles universales exponen:

- tamaño mediante `--sk-size`;
- color mediante `--sk-color`.

El renderer HTML de NagWeb ahora aplica bindings `css-variable` de forma genérica. Esto permite que futuros recursos HTML/CSS usen variables editables sin crear un adaptador específico por biblioteca.

React Bits fue revisado pero no se espeja: su licencia MIT + Commons Clause permite usar los componentes dentro de productos, pero prohíbe redistribuir los componentes mismos, incluso agrupados en un bundle.


## Cliente de lectura del Vault persistente

`src/runtime/persistent-vault-client.mjs` es el puente entre la biblioteca persistente y la interfaz de NagWeb.

Su flujo está pensado para que el editor no cargue 36 MB de JSON al abrir la biblioteca:

1. descarga `vault-manifest.json`;
2. descarga y verifica `all/browse-index.json.gz`, actualmente de unos cientos de KB;
3. permite buscar, filtrar y paginar todos los recursos;
4. recién al pedir el código de un recurso descarga y verifica `all/library.json.gz`;
5. mantiene la biblioteca completa en memoria para los siguientes usos.

El cliente verifica SHA-256 antes de aceptar el índice o la biblioteca completa.

Ejemplo:

```js
import {
  createNagWebPersistentVaultClient
} from "./runtime/persistent-vault-client.mjs";

const vault = createNagWebPersistentVaultClient();

const results = await vault.search({
  query: "loader",
  providers: ["spinkit"],
  limit: 24
});

const resource = await vault.getResource(results.items[0].id);
```

También expone `facets()` para construir filtros por proveedor, familia y tipo sin conocer de antemano qué fuentes forman parte del Vault.


## Biblioteca Visual standalone

Antes de conectarla al editor principal, el Vault tiene una interfaz aislada en:

```text
resource-browser/index.html
```

La interfaz usa el cliente persistente y ofrece:

- búsqueda sobre todos los recursos;
- filtros por proveedor, familia y tipo;
- paginación;
- detalle de licencia, autor, controles y artifacts;
- preview segura para SVG, HTML/CSS autónomo y efectos CSS;
- copia del ID universal;
- copia del código principal;
- carga perezosa: el bundle completo sólo se descarga al abrir un recurso.

Para abrirla localmente:

```bash
npm run vault:browser
```

En Windows, la opción **18 · ABRIR Biblioteca Visual del Vault** abre el navegador y levanta el pequeño servidor local automáticamente.

Este navegador sigue separado del editor principal. Sirve para validar la experiencia de exploración antes de conectar el botón “Aplicar” a NagWeb.


## Protocolo “Aplicar en NagWeb”

`src/runtime/resource-apply-bridge.mjs` convierte un recurso seleccionado en un paquete de inserción independiente del transporte:

```text
nagweb-resource-apply/1.0
```

El paquete incluye:

- ID universal y procedencia;
- licencia verificada;
- capacidades y controles editables;
- valores elegidos para la instancia;
- descriptor de inserción ya normalizado;
- código/HTML/SVG necesario dentro del descriptor cuando corresponde.

La Biblioteca Visual sólo habilita **Aplicar en NagWeb** cuando fue abierta desde un editor que declaró explícitamente su origen mediante `?hostOrigin=https://...`. El envío usa `postMessage` con ese origen exacto: nunca usa `*`.

El editor principal todavía no escucha este protocolo. Esa conexión se hará en una rama de integración separada para no poner en riesgo MotionLab ni el resto de NagWeb.

Además, `runtime/instance.mjs` dejó de depender de `node:crypto`, por lo que los insert adapters ya pueden ejecutarse tanto en Node como en navegador.

## Vista pública independiente (preparación para GitHub Pages)

Para generar una copia estática de la Biblioteca Visual con el código y reproductor
necesarios, sin Vercel, sin Node en el navegador y sin modificar `main`:

```bash
npm run preview:public
```

Se genera `pages-preview/` con `index.html`, `resource-browser/`, un
subconjunto mínimo de `src/` (solo los 10 módulos usados por el navegador)
y `.nojekyll`. No se publican los extractores, las herramientas internas
de importación ni los tests. Esta copia lee el catálogo real desde la rama pública
`resource-vault-data`, así que el código del catálogo no se duplica en el
repositorio de la aplicación.

**Importante:** generar esta carpeta NO publica nada en Internet ni habilita
GitHub Pages. Para publicar manualmente, copiar el contenido generado a una
rama de publicación independiente (`gh-pages`) y configurar **Settings → Pages
→ Build and deployment → Deploy from a branch → gh-pages / (root)**.
Hacer esa actualización solamente cuando se quiera publicar una nueva
versión. No se activa ningún despliegue automático de Vercel y se conserva
la rama de trabajo `feat/resource-etl-v1`.

URL prevista cuando Pages esté habilitado:
`https://decrackpichon-gif.github.io/NagWeb/resource-browser/`.
**No compartirla como funcional hasta comprobar que está publicada.**

Limitaciones actuales: las vistas previas cubren sólo las familias compatibles.
El botón de inserción requiere abrir la biblioteca desde un editor conectado;
la edición posterior en el lienzo principal todavía está pendiente.

## Micro-etapa 43: organización de la personalización

La biblioteca agrupa los controles disponibles en secciones plegables de colores,
tamaño, espaciado, texto y apariencia, animación y otros ajustes. Solo muestra
categorías con controles y abre inicialmente la primera. Cada sección informa
cuántos ajustes contiene y cuántos fueron modificados; el panel también muestra
el total. Se pueden abrir varias categorías y operar sus encabezados con teclado.
Plegar no descarta valores ni altera la inserción. Restaurar vuelve a los valores
originales y conserva las secciones abiertas dentro del recurso actual; abrir
otro recurso reinicia la organización. No se agregan propiedades editables.
La prueba offline incluye agrupación y eventos de personalización, conservación
de valores, contadores y restauración, y se ejecuta en CI Linux y Windows.

## Micro-etapa 44: restauración por categoría

Cada categoría incluye un botón para restaurar solo sus valores originales.
Se habilita cuando esa categoría tiene cambios y actualiza los controles,
contadores y vista previa sin reconstruir el panel. Conserva los cambios de
las demás categorías, las secciones abiertas, el foco y el desplazamiento.
La restauración global sigue disponible. Las pruebas offline verifican el
aislamiento entre categorías, tipos de controles, estados y eventos obsoletos.

## Micro-etapa 45: ver solo ajustes modificados

El filtro «Mostrar solo ajustes modificados» oculta los controles que mantienen
su valor original y las categorías sin cambios. Los contadores siguen mostrando
el total del recurso. Si no quedan cambios, el panel indica cómo volver a ver
todos los ajustes. Cambiar la vista no altera valores ni reinicia la vista previa.
Conserva las secciones abiertas y el filtro al restaurar valores; abrir otro
recurso vuelve a la vista completa. Si un control enfocado queda oculto al
restaurarlo, el foco vuelve al filtro. Las pruebas verifican filtrado, restauración
por categoría y global, estados, equivalencia de colores y conservación de valores.

## Micro-etapa 46: búsqueda de ajustes

«Buscar ajustes» filtra por nombre o identificador, sin distinguir mayúsculas ni
acentos. Se combina con «solo modificados», muestra cuántos ajustes quedan
visibles y oculta categorías sin coincidencias. «Limpiar búsqueda» conserva el
filtro de modificados, los valores y las secciones abiertas. La búsqueda no
reconstruye controles ni reinicia la vista previa; se conserva al restaurar y
se limpia al abrir otro recurso. Restaurar una categoría sigue restaurándola
completa, incluidos los ajustes ocultos; el botón lo aclara en su ayuda.
Las pruebas cubren coincidencias, búsquedas sin resultados, ambos filtros,
conservación de estados, restauración, foco y texto tratado como texto literal.

## Micro-etapa 47: prueba en Chromium

`npm run test:browser` abre la biblioteca real en Chromium contra un Vault de
prueba local, con gzip y checksums reales, sin pedir recursos externos. Recorre
búsqueda, filtros, edición con teclado, restauración, foco, vista previa visible
y aplicación confirmada de SVG y CSS, en anchos de 1280 y 390 px. El receptor es
un editor de prueba: verifica el mensaje, muestra su contenido y responde por
el protocolo real; no sustituye una prueba del lienzo principal de NagWeb.

La prueba detectó y corrigió dos problemas: `fetch` recibía un contexto inválido
en el navegador y el aviso de preview seguía visible pese a su atributo `hidden`.
El CI ejecuta la prueba en Linux y Windows, además de las pruebas existentes,
y guarda capturas e informe JSON durante siete días. Para instalar el navegador:
`npx playwright install --with-deps chromium`. Los resultados quedan en
`browser-smoke-results/`, excluido de Git.

## Micro-etapa 48: inserción SVG en el editor real

La barra de NagWeb incluye **Biblioteca de recursos**. Se abre dentro del editor
y conserva la búsqueda y los valores al volver a abrirla. **Aplicar en NagWeb**
convierte un ícono SVG de trazo en un vector nativo editable, lo selecciona y
confirma cuando quedó guardado. Usa el mismo historial y guardado del editor;
el resultado sobrevive a recargas y se incluye en la exportación del sitio.
El ícono se inserta en la raíz de la escena actual, con el tamaño elegido en
píxeles convertido a las medidas del lienzo de escritorio y móvil.

Este primer receptor admite geometría monocroma: path, circle, ellipse, rect,
line, polyline, polygon y grupos sin transformaciones. Rechaza otros recursos,
rellenos, trazos diferentes por figura, transformaciones y atributos activos
antes de tocar el historial. Sólo recibe pedidos del iframe de la biblioteca
abierta, del mismo origen; repetir un pedido devuelve la misma confirmación.
El vector conserva identificación, proveedor, licencia, commit de origen y
valores elegidos. La biblioteca necesita abrirse desde un servidor HTTP(S).

`npm run test:browser` también abre el **index.html real de NagWeb**, inserta un
SVG personalizado y verifica selección, tamaño y trazo visibles, guardado,
deshacer/rehacer, recarga y markup exportado. Comprueba rechazo de geometría no
admitida, mensajes de otro emisor, recursos CSS y duplicados. GSAP 3.12.5 y
Three.js r128 se sirven desde las dependencias de prueba; el Vault usa datos
locales y las fuentes decorativas se omiten. El editor ejecuta sus scripts
reales, sin reemplazar su inserción ni su modelo. Captura: `editor-inserted.png`.

## Micro-etapa 49: volver a personalizar un ícono

Al seleccionar un vector insertado desde la biblioteca, se habilita
**Personalizar** (ayuda: «Personalizar ícono seleccionado»). Abre su recurso con tamaño,
color de trazo y grosor actuales. **Guardar cambios en el ícono** modifica ese
mismo elemento: conserva ID, geometría, nombre, posición, jerarquía y animación.
El tamaño y el trazo respetan la vista activa del editor; las medidas de la otra
vista se conservan. Cerrar sin guardar no cambia el proyecto ni su historial.

Cada apertura identifica una sesión y el elemento original. Pedidos de otra
sesión, recurso o escena, y elementos eliminados o modificados mientras el panel
estaba abierto, se rechazan antes de modificar el historial. Si el recurso dejó
de estar disponible en el Vault, el panel informa el problema y no permite
guardar. Los cambios usan el guardado y deshacer/rehacer habituales del editor.
Guardar sin cambios no agrega historial; un fallo de almacenamiento se informa
sin confirmar como guardados los datos anteriores. Los colores vinculados a la
paleta se muestran con su color actual y conservan el vínculo si no se cambian.
La prueba en Chromium verifica cancelación, valores recuperados, actualización
sin duplicado, conservación de propiedades, deshacer/rehacer y recarga; deja
`editor-edited.png` junto con el informe del recorrido completo. También prueba
rechazo de un destino eliminado y detección de un fallo de almacenamiento.

## Micro-etapa 50: inserción según capacidades del editor

NagWeb ahora informa a la Biblioteca Visual que su receptor admite insertar solamente SVG nativos. Para HTML/CSS y otros tipos, el detalle sigue disponible para explorar, previsualizar, personalizar y copiar, pero la acción Aplicar se deshabilita con una explicación clara. No se presenta como error de inserción algo que de antemano no está admitido. Esto es una indicación de interfaz, no un reemplazo de la validación del receptor. Otros editores que usen el protocolo sin hostKinds conservan el comportamiento genérico para recibir recursos HTML/CSS. La prueba real de Chromium cubre ambos casos.

## Micro-etapa 51: sandbox HTML/CSS para la próxima integración

Se incorporó `src/runtime/nagweb-html-sandbox.mjs`, un constructor aislado
para previsualizar componentes HTML/CSS de Uiverse **sin insertar código ajeno
en el DOM del editor**. Valida identidad, renderer, licencia, tamaño y
dependencias; rechaza scripts, iframes anidados, formularios, atributos de
eventos y referencias a recursos remotos. Los componentes compatibles se
montan en un iframe con `sandbox=""` (sin scripts ni acceso al origen del
editor), política de seguridad de contenido (CSP) que bloquea red y scripts y
referencias externas, y `referrerpolicy="no-referrer"`.

El smoke de Chromium ejecuta el constructor en el editor real, comprueba
visualización de CSS, aislamiento de origen, atributos del iframe, restricciones
de CSP y rechazo de marcado activo o de recursos sin licencia. Es una
**preparación de integración**: la inserción persistente de HTML/CSS como
elemento del lienzo principal sigue pendiente y no se anuncia como lista.

## Micro-etapa 52: insertar Uiverse HTML/CSS como elemento nativo aislado

Los componentes Uiverse compatibles sin dependencias ahora pueden insertarse en
el editor como elementos `embed` del proyecto. Se conservan posición, ancho de
escritorio y móvil, proporción, identidad del recurso y valores seleccionados.
El renderizado en el lienzo y en la exportación usa siempre un `iframe`
con `sandbox=""` y política CSP restrictiva, sin inyectar HTML del recurso
en el documento padre. El panel reconoce los componentes inseguros/no
compatibles antes de habilitar Aplicar. El receptor vuelve a validarlos.

Chromium prueba inserción real, persistencia en almacenamiento, aislamiento,
exportación, deshacer/rehacer, recarga y mensajes duplicados o maliciosos.
Por ahora la edición posterior mediante el panel de Biblioteca continúa
reservada a íconos SVG; el componente HTML/CSS sí puede moverse y
redimensionarse desde el editor como cualquier `embed`.
