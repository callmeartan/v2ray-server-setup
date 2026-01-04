// Simple toast hook - can be enhanced with a proper toast library later
export function useToast() {
  return {
    toast: ({ title, description, variant = 'default' }: {
      title: string;
      description?: string;
      variant?: 'default' | 'destructive';
    }) => {
      // For now, just use console.log and alert
      console.log(`${title}: ${description || ''}`);

      if (typeof window !== 'undefined') {
        if (variant === 'destructive') {
          alert(`${title}\n${description || ''}`);
        } else {
          // Could implement a proper toast notification here
          console.log(`Toast: ${title} - ${description}`);
        }
      }
    }
  };
}
