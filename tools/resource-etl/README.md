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
