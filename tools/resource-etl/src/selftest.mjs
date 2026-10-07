import assert from "node:assert/strict";
import {
  flattenAmbientCgDownloads,
  selectAmbientCgDownload
} from "./extractors/ambientcg.mjs";
import { transformAmbientCgAsset } from "./transformers.mjs";

const fakeAsset = {
  assetId: "Wood999",
  dataType: "Material",
  displayName: "Wood 999",
  displayCategory: "Wood",
  tags: ["wood", "test"],
  maps: ["color", "normal", "roughness"],
  previewImage: {
    "512-WEBP": "https://example.test/Wood999.webp"
  },
  downloadFolders: {
    default: {
      downloadFiletypeCategories: {
        zip: {
          downloads: [
            {
              attribute: "2K-PNG",
              downloadLink: "https://example.test/Wood999_2K-PNG.zip",
              fileName: "Wood999_2K-PNG.zip",
              fileSize: 200
            },
            {
              attribute: "1K-JPG",
              downloadLink: "https://example.test/Wood999_1K-JPG.zip",
              fileName: "Wood999_1K-JPG.zip",
              fileSize: 100
            }
          ]
        }
      }
    }
  }
};

const downloads = flattenAmbientCgDownloads(fakeAsset);
assert.equal(downloads.length, 2);

const selected = selectAmbientCgDownload(fakeAsset, {
  resolution: "1K",
  fileType: "JPG"
});
assert.equal(selected?.attribute, "1K-JPG");

const resource = transformAmbientCgAsset(fakeAsset);
assert.equal(resource.id, "ambientcg:Wood999");
assert.equal(resource.kind, "pbr-material");
assert.equal(resource.license.id, "CC0");
assert.equal(resource.runtime.entryArtifactId, "download-2");
assert.ok(resource.editableProps.some((prop) => prop.id === "roughness"));

console.log("NagWeb Resource ETL self-test: OK");
