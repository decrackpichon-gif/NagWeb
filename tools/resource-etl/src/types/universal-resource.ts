export type ResourceFamily =
  | "3d"
  | "texture"
  | "material"
  | "hdri"
  | "ui"
  | "icon"
  | "animation"
  | "template"
  | "other";

export type ResourceKind =
  | "model-3d"
  | "pbr-material"
  | "texture-set"
  | "hdri"
  | "react-component"
  | "html-component"
  | "tailwind-block"
  | "css-component"
  | "icon"
  | "lottie"
  | "motion-preset"
  | "asset-pack"
  | "unknown";

export type EditableValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | Record<string, unknown>;

export type EditableBinding =
  | { type: "component-prop"; prop: string }
  | { type: "css-variable"; variable: string }
  | { type: "css-property"; property: string; selector?: string }
  | { type: "text-content"; target?: string }
  | {
      type: "transform";
      property: "position" | "rotation" | "scale";
      axis?: "x" | "y" | "z" | "xyz";
    }
  | {
      type: "material-property";
      material?: string;
      property:
        | "color"
        | "roughness"
        | "metalness"
        | "opacity"
        | "emissive"
        | "intensity";
    }
  | {
      type: "texture-slot";
      slot:
        | "map"
        | "normalMap"
        | "roughnessMap"
        | "metalnessMap"
        | "aoMap"
        | "displacementMap";
    }
  | { type: "asset-slot"; slot: string }
  | { type: "runtime"; path: string };

export interface EditableProp {
  id: string;
  label: string;
  group?: string;
  description?: string;
  valueType:
    | "string"
    | "number"
    | "boolean"
    | "color"
    | "enum"
    | "asset"
    | "vector2"
    | "vector3"
    | "object";
  control:
    | "text"
    | "textarea"
    | "number"
    | "slider"
    | "toggle"
    | "color"
    | "select"
    | "segmented"
    | "image"
    | "texture"
    | "file"
    | "vector2"
    | "vector3"
    | "rotation"
    | "font"
    | "icon"
    | "spacing"
    | "custom";
  defaultValue: EditableValue;
  binding: EditableBinding;
  constraints?: {
    min?: number;
    max?: number;
    step?: number;
    options?: Array<{ label: string; value: EditableValue }>;
    unit?: string;
    required?: boolean;
  };
  responsive?: boolean;
  animatable?: boolean;
  nullable?: boolean;
}

export interface ResourceArtifact {
  id: string;
  role:
    | "source"
    | "model"
    | "texture"
    | "material"
    | "thumbnail"
    | "preview"
    | "component"
    | "stylesheet"
    | "script"
    | "icon-data"
    | "animation-data"
    | "registry"
    | "metadata"
    | "archive";
  format?: string;
  mimeType?: string;
  sourceUrl?: string;
  storageUrl?: string;
  content?: string;
  sourcePath?: string;
  targetPath?: string;
  size?: number;
  checksum?: string;
  variant?: Record<string, unknown>;
}

export interface UniversalResource {
  schemaVersion: "1.0";
  id: string;
  slug: string;
  name: string;
  title: string;
  description?: string;
  family: ResourceFamily;
  kind: ResourceKind;
  source: {
    provider: string;
    externalId: string;
    sourceUrl?: string;
    apiUrl?: string;
    repositoryUrl?: string;
    author?: string;
    fetchedAt: string;
    version?: string;
    commit?: string;
  };
  license: {
    id: string;
    name?: string;
    url?: string;
    commercialUse: boolean;
    modificationAllowed: boolean;
    redistributionAllowed?: boolean;
    attributionRequired: boolean;
    attributionText?: string;
    verified: boolean;
  };
  taxonomy: {
    categories: string[];
    tags: string[];
    sourceCategories?: string[];
    collections?: string[];
    style?: string[];
    useCases?: string[];
  };
  previews: Array<{
    type: "thumbnail" | "image" | "video" | "gif" | "interactive";
    url: string;
    width?: number;
    height?: number;
    mimeType?: string;
  }>;
  artifacts: ResourceArtifact[];
  runtime: {
    type: "three" | "react" | "html" | "css" | "svg" | "lottie" | "asset" | "none";
    renderer?: string;
    entryArtifactId?: string;
    dependencies?: Array<{ name: string; version?: string; optional?: boolean }>;
    registryDependencies?: string[];
    imports?: string[];
    cssVariables?: Record<string, string>;
    setup?: Record<string, unknown>;
  };
  editableProps: EditableProp[];
  compatibility?: Record<string, unknown>;
  capabilities?: string[];
  technical?: Record<string, unknown>;
  search?: {
    text?: string;
    keywords?: string[];
    semanticText?: string;
    popularity?: number;
    qualityScore?: number;
    featured?: boolean;
  };
  ingestion: {
    extractor: string;
    extractorVersion: string;
    fetchedAt: string;
    transformedAt: string;
    sourceHash?: string;
    status: "pending" | "validated" | "published" | "rejected" | "error";
    warnings?: string[];
    errors?: string[];
  };
  sourceData?: Record<string, unknown>;
}
