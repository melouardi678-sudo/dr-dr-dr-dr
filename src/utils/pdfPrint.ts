/**
 * Trigger print dialog with styled A4 document layout
 */
export function triggerPrintDocument(documentTitle: string = 'Document Médical'): void {
  const originalTitle = document.title;
  document.title = documentTitle;
  window.print();
  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}

export function openWhatsAppLink(phone: string, text: string): void {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  window.open(url, '_blank');
}

export function openEmailClient(email: string, subject: string, body: string): void {
  const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(url, '_blank');
}
