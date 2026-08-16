import { Toaster as Sonner } from "sonner";
import { InfoCircle, TickCircle, Warning2, CloseCircle } from "iconsax-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      closeButton
      icons={{
        info: <InfoCircle size={24} variant="Outline" />,
        success: <TickCircle size={24} variant="Outline" />,
        warning: <Warning2 size={24} variant="Outline" />,
        error: <CloseCircle size={24} variant="Outline" />,
      }}
      style={{ ["--width" as string]: "440px" }}
      toastOptions={{
        classNames: {
          toast: "ds-toast",
          description: "",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
