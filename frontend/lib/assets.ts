const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function assetUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_URL}${path}`;
}

export async function downloadReport(analysisId: string): Promise<void> {
  const token = localStorage.getItem("oncovision_token");
  const response = await fetch(`${API_URL}/api/report/${analysisId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) throw new Error("Unable to download report");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `oncovision-report-${analysisId}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}
