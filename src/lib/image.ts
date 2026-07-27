/**
 * Utilitários de foto para o armazenamento local: aceita somente imagens,
 * limita o tamanho do arquivo e comprime/redimensiona antes de salvar.
 */

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB de entrada
const MAX_DIMENSION = 1280;
const QUALITY = 0.7;

export class ImageError extends Error {}

export async function processImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new ImageError("Selecione um arquivo de imagem válido.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageError("Imagem muito grande. Envie um arquivo de até 8 MB.");
  }

  const dataUrl = await readAsDataUrl(file);
  try {
    return await compress(dataUrl);
  } catch {
    // Se a compressão falhar, mantém o original (nunca falhar silenciosamente).
    return dataUrl;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new ImageError("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function compress(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new ImageError("Canvas indisponível."));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", QUALITY));
    };
    img.onerror = () => reject(new ImageError("Imagem inválida."));
    img.src = dataUrl;
  });
}
