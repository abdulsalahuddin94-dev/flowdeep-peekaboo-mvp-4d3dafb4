import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/** DS02 toasts render their own card (see @/lib/toast) — keep sonner unstyled. */
const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    className="toaster group"
    position="top-right"
    style={{ ["--width" as string]: "440px" }}
    toastOptions={{ unstyled: true, classNames: { toast: "w-full" } }}
    {...props}
  />
);

export { Toaster };
