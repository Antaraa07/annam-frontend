// Utility functions for file downloads

// Download a blob as a file
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Download multiple files individually (fallback if bulk download fails)
export async function downloadMultipleFiles(
  urls: string[], 
  filenames: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  for (let i = 0; i < urls.length; i++) {
    try {
      const response = await fetch(urls[i]);
      if (response.ok) {
        const blob = await response.blob();
        downloadBlob(blob, filenames[i] || `file_${i + 1}`);
        
        // Add a small delay between downloads to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 200));
        
        onProgress?.(i + 1, urls.length);
      }
    } catch (error) {
      console.warn(`Failed to download ${filenames[i]}:`, error);
    }
  }
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}