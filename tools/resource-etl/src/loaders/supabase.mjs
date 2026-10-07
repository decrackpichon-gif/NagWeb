function getConfig() {
  const url = process.env.NAGWEB_SUPABASE_URL;
  const secretKey = process.env.NAGWEB_SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Supabase no está configurado. Faltan NAGWEB_SUPABASE_URL y/o NAGWEB_SUPABASE_SECRET_KEY."
    );
  }

  return {
    url: url.replace(/\/$/, ""),
    secretKey
  };
}

function toRow(resource) {
  return {
    id: resource.id,
    slug: resource.slug,
    source_provider: resource.source.provider,
    source_external_id: resource.source.externalId,
    family: resource.family,
    kind: resource.kind,
    title: resource.title,
    description: resource.description || null,
    license_id: resource.license.id,
    status: resource.ingestion.status,
    source_hash: resource.ingestion.sourceHash || null,
    data: resource,
    updated_at: new Date().toISOString()
  };
}

export async function upsertResourcesToSupabase(resources) {
  if (!Array.isArray(resources) || resources.length === 0) {
    return { written: 0 };
  }

  const { url, secretKey } = getConfig();

  const response = await fetch(
    `${url}/rest/v1/resources?on_conflict=id`,
    {
      method: "POST",
      headers: {
        apikey: secretKey,
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(resources.map(toRow))
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Supabase upsert failed: HTTP ${response.status} ${response.statusText}\n${body}`
    );
  }

  return { written: resources.length };
}
