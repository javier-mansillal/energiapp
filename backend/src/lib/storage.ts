// Helpers para operar Supabase Storage usando el session token del usuario.
// Al autenticar con el token del usuario, las políticas RLS del bucket
// (basadas en auth.uid()) se aplican normalmente.

const BUCKET = "boletas";

function storageHeaders(token: string) {
  return {
    apikey: process.env.SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${token}`,
  };
}

function storageUrl(path: string) {
  return `${process.env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`;
}

// Sube un PDF a boletas/{userId}/{hogarId}/{uuid}.pdf y devuelve la ruta del objeto.
export async function uploadPdf(
  token: string,
  userId: string,
  hogarId: string,
  buffer: Buffer
): Promise<string> {
  const path = `${userId}/${hogarId}/${crypto.randomUUID()}.pdf`;
  const resp = await fetch(storageUrl(path), {
    method: "POST",
    headers: {
      ...storageHeaders(token),
      "Content-Type": "application/pdf",
    },
    body: new Uint8Array(buffer),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Storage upload failed: ${resp.status} ${body}`);
  }

  return path;
}

// Elimina un objeto del bucket. Un 404 se considera éxito (ya no existe).
export async function deleteObject(token: string, path: string): Promise<void> {
  const resp = await fetch(storageUrl(path), {
    method: "DELETE",
    headers: storageHeaders(token),
  });

  if (!resp.ok && resp.status !== 404) {
    const body = await resp.text();
    throw new Error(`Storage delete failed: ${resp.status} ${body}`);
  }
}

// Genera una URL firmada temporal para descargar/ver un PDF.
export async function createSignedUrl(
  token: string,
  path: string,
  expiresIn = 3600
): Promise<string> {
  const url = `${process.env.SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${path}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      ...storageHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Storage sign failed: ${resp.status} ${body}`);
  }

  const data = await resp.json();
  const signed = data.signedURL as string;
  // Supabase devuelve la URL firmada como ruta relativa a la API de storage
  // ("/object/sign/..."), que vive bajo /storage/v1. Se antepone el host + el
  // prefijo para que el front pueda abrirla directo en una pestaña. Si algún
  // día viniera absoluta, se deja igual.
  return signed.startsWith("http")
    ? signed
    : `${process.env.SUPABASE_URL}/storage/v1${signed}`;
}