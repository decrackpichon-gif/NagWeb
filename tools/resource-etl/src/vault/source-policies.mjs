export const SOURCE_POLICIES = {
  "animate-css": {
    mirrorMode: "blocked-pending-review",
    licenseId: "Hippocratic-2.1",
    licenseName: "Hippocratic License 2.1",
    licenseUrl: "https://github.com/animate-css/animate.css/blob/main/LICENSE",
    noticeRequired: true,
    notes: "Not mirrored automatically because the current license adds use restrictions beyond a permissive open-source license."
  },
  "hover-css": {
    mirrorMode: "blocked-pending-review",
    licenseId: "custom",
    licenseName: "Hover.css dual/commercial license",
    licenseUrl: "https://github.com/IanLunn/Hover/blob/master/license.txt",
    noticeRequired: true,
    notes: "Do not mirror for NagWeb without OEM commercial permission; the license explicitly calls out application builders/toolkits."
  },
  csshake: {
    mirrorMode: "full",
    licenseId: "MIT",
    licenseName: "MIT License",
    licenseUrl: "https://github.com/elrumordelaluz/csshake/blob/master/LICENSE",
    noticeRequired: true,
    notes: "CSS/SCSS animation code may be mirrored. Preserve the MIT notice."
  },
  lucide: {
    mirrorMode: "full",
    licenseId: "ISC",
    licenseName: "ISC License",
    licenseUrl: "https://github.com/lucide-icons/lucide/blob/main/LICENSE",
    noticeRequired: true,
    notes: "SVG and icon metadata may be mirrored. Preserve the Lucide copyright and permission notice."
  },
  "glsl-noise": {
    mirrorMode: "full",
    licenseId: "MIT",
    licenseName: "MIT License",
    licenseUrl: "https://github.com/hughsk/glsl-noise/blob/master/LICENSE",
    noticeRequired: true,
    notes: "Textureless GLSL noise functions may be mirrored and reused. Preserve the MIT notice and original author notices."
  },
  hyperui: {
    mirrorMode: "full",
    licenseId: "MIT",
    licenseName: "MIT License",
    licenseUrl: "https://github.com/markmead/hyperui/blob/main/LICENSE",
    noticeRequired: true,
    notes: "Code-only HTML/Tailwind examples may be mirrored. Blocks with external media are excluded from the autonomous vault."
  },
  magicui: {
    mirrorMode: "full",
    licenseId: "MIT",
    licenseName: "MIT License",
    licenseUrl: "https://github.com/magicuidesign/magicui/blob/main/LICENSE.md",
    noticeRequired: true,
    notes: "Registry component source may be mirrored. Preserve the MIT copyright and permission notice."
  },
  animxyz: {
    mirrorMode: "full",
    licenseId: "MIT",
    licenseName: "MIT License",
    licenseUrl: "https://github.com/ingram-projects/animxyz/blob/master/LICENSE",
    noticeRequired: true,
    notes: "Core CSS/SCSS source may be mirrored. NagWeb also derives native motion presets from documented utility semantics."
  },
  "motion-primitives": {
    mirrorMode: "full",
    licenseId: "MIT",
    licenseName: "MIT License",
    licenseUrl: "https://github.com/ibelick/motion-primitives/blob/main/LICENCE.md",
    noticeRequired: true,
    notes: "Registry component source may be mirrored. Preserve the MIT copyright and permission notice."
  },
  shadcn: {
    mirrorMode: "full",
    licenseId: "MIT",
    licenseName: "MIT License",
    licenseUrl: "https://github.com/shadcn-ui/ui/blob/main/LICENSE.md",
    noticeRequired: true,
    notes: "Registry component source may be mirrored. Preserve the MIT notice."
  },
  threejs: {
    mirrorMode: "code-only",
    licenseId: "MIT",
    licenseName: "MIT License",
    licenseUrl: "https://github.com/mrdoob/three.js/blob/dev/LICENSE",
    noticeRequired: true,
    notes: "Mirror source code only by default. Example media/models/textures may have separate provenance and must be checked independently."
  },
  "dotlottie-web": {
    mirrorMode: "code-only",
    licenseId: "MIT",
    licenseName: "MIT License",
    licenseUrl: "https://github.com/LottieFiles/dotlottie-web/blob/main/LICENSE",
    noticeRequired: true,
    notes: "The player/runtime is open source. This does not grant rights to mirror the LottieFiles animation library."
  },
  "lottiefiles-community": {
    mirrorMode: "metadata-only",
    licenseId: "Lottie-Simple-License",
    licenseName: "Lottie Simple License",
    licenseUrl: "https://lottiefiles.com/page/license",
    noticeRequired: false,
    notes: "Do not bulk scrape or redistribute standalone community animation files."
  },
  aceternity: {
    mirrorMode: "blocked-pending-review",
    licenseId: "custom",
    licenseName: "Aceternity License / site terms",
    licenseUrl: "https://ui.aceternity.com/licence",
    noticeRequired: false,
    notes: "Do not bulk mirror until the exact free-component redistribution terms are verified."
  }
};

export function getSourcePolicy(provider) {
  return SOURCE_POLICIES[provider] || {
    mirrorMode: "blocked-pending-review",
    licenseId: "unknown",
    licenseName: "Unknown",
    noticeRequired: false,
    notes: "No explicit mirror policy has been approved for this source."
  };
}

export function assertCodeMirrorAllowed(provider) {
  const policy = getSourcePolicy(provider);
  if (!["full", "code-only"].includes(policy.mirrorMode)) {
    throw new Error(
      `Provider ${provider} is not approved for code mirroring (mode: ${policy.mirrorMode}).`
    );
  }
  return policy;
}

export function assertFullMirrorAllowed(provider) {
  const policy = getSourcePolicy(provider);
  if (policy.mirrorMode !== "full") {
    throw new Error(
      `Provider ${provider} is not approved for full mirroring (mode: ${policy.mirrorMode}).`
    );
  }
  return policy;
}
