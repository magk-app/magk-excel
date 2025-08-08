// Temporary simple toast implementation using browser alerts
// TODO: Replace with proper toast library (sonner, react-hot-toast, etc.)

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = (options: ToastOptions) => {
    const message = options.title + (options.description ? `\n${options.description}` : '');
    
    if (options.variant === 'destructive') {
      console.error('Toast Error:', message);
      alert(`Error: ${message}`);
    } else {
      console.log('Toast:', message);
      alert(message);
    }
  };

  return { toast };
}
