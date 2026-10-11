# Instrucciones permanentes para asistentes de código en NagWeb

Este repositorio contiene cinco frentes **independientes** del mismo producto. Los nombres son fijos: NAGWEB 01 | Editor principal, NAGWEB 02 | Motion Lab, NAGWEB 03 | Cámara 3D, NAGWEB 04 | Interaction Studio, NAGWEB 05 | Biblioteca de recursos.

## Identificar el frente antes de editar

Determinar la rama de trabajo ACTUAL y leer exclusivamente su ficha en `docs/contexto/`, además de sus documentos técnicos:

| Rama | Frente | Ficha de continuidad |
|---|---|---|
| `feat/storytelling-engine-v2` | 01 Editor principal | `docs/contexto/NAGWEB_01_Editor_Principal_CONTEXTO.md` |
| `internal-motion-lab` | 02 Motion Lab | `docs/contexto/NAGWEB_02_Motion_Lab_CONTEXTO.md` |
| `feat/scroll-camera-v1` | 03 Cámara 3D | `docs/contexto/NAGWEB_03_Camara_3D_CONTEXTO.md` |
| `feat/interaction-engine-v1` | 04 Interaction Studio estable | `docs/contexto/NAGWEB_04_Interaction_Studio_CONTEXTO.md` |
| `feat/interaction-engine-experimental-v1` | 04 Interaction Studio experimental | `docs/contexto/NAGWEB_04_Interaction_Studio_CONTEXTO.md` y `docs/interaction-engine-experimental-v1.md`; no fusionar ramas |
| `feat/resource-etl-v1` | 05 Biblioteca de recursos | `docs/contexto/NAGWEB_05_Biblioteca_de_Recursos_CONTEXTO.md` |

Si la rama no coincide con el proyecto solicitado, **detener la edición y aclarar la discrepancia**. No tratar `main` como el estado de desarrollo de los cinco frentes.

## Protocolo práctico

1. Leer ficha, últimos commits, archivos técnicos actuales y pruebas existentes **una vez al empezar**; no reconstruir trabajo ya terminado.
2. Los documentos de contexto son una fotografía; código y HEAD de la rama determinan el estado actual. No inventar avances ni resultados de CI.
3. Implementar mejoras significativas y coherentes por lote, con verificación apropiada al riesgo. Evitar microetapas artificiales, auditorías repetidas y cadenas interminables de pruebas.
4. Trabajar solo en la rama del frente; no merges ni cambios de otros desarrollos, ni despliegues manuales a Vercel sin indicación expresa.
5. Registrar en su ficha solo decisiones, objetivos, nuevos enlaces de referencia, limitaciones, bloqueos o hitos sustanciales; no copiar un changelog por cada ajuste menor.
6. Antes del commit comprobar que la rama no cambió por trabajo concurrente. Informar commit SHA, pruebas efectivas, resultado y pendiente.
7. No subir videos, HAR, tokens ni adjuntos privados al repositorio público; registrar la referencia, ubicación o nombre del material original.

Para chats de ChatGPT: `AGENTS.md` ayuda a asistentes de código compatibles, pero un chat nuevo **no lee automáticamente GitHub**. El usuario debe indicar el proyecto y pedir explícitamente que se consulten esta guía y la ficha específica.
