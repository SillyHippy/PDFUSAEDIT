
import { toast as sonnerToast } from "sonner";

// Define our own interface with the properties we need
export interface CustomToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
}

// Create the base toast function
const toastFn = (props?: CustomToastProps): string | number => {
  if (props) {
    const { title, description, variant } = props;
    if (variant === "destructive") {
      return sonnerToast.error(title, { description });
    } else if (variant === "success") {
      return sonnerToast.success(title, { description });
    } else if (variant === "warning") {
      return sonnerToast.warning(title, { description });
    } else if (variant === "info") {
      return sonnerToast.info(title, { description });
    }
    return sonnerToast(title, { description });
  }
  return sonnerToast("Notification");
};

// Add methods to the function
toastFn.error = (title?: string, options?: any) => sonnerToast.error(title, options);
toastFn.success = (title?: string, options?: any) => sonnerToast.success(title, options);
toastFn.warning = (title?: string, options?: any) => sonnerToast.warning(title, options);
toastFn.info = (title?: string, options?: any) => sonnerToast.info(title, options);

// Export as toast
export const toast = toastFn;

// Create useToast hook for compatibility with existing code
export const useToast = () => {
  return {
    toast: (props?: CustomToastProps) => {
      if (props) {
        const { title, description, variant } = props;
        if (variant === "destructive") {
          return sonnerToast.error(title, { description });
        } else if (variant === "success") {
          return sonnerToast.success(title, { description });
        } else if (variant === "warning") {
          return sonnerToast.warning(title, { description });
        } else if (variant === "info") {
          return sonnerToast.info(title, { description });
        }
        return sonnerToast(title, { description });
      }
      return {};
    },
    dismiss: (toastId?: string) => {
      if (toastId) {
        sonnerToast.dismiss(toastId);
      } else {
        sonnerToast.dismiss();
      }
    },
    toasts: []
  };
};
