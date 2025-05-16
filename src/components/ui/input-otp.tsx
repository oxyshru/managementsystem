import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Minus } from "lucide-react";

import { cn } from "@/lib/utils";

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>>(
  ({ className, containerClassName, ...props }, ref) =>
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props} />

);
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) =>
  <div ref={ref} className={cn("flex items-center", className)} {...props} data-id="ly2gwa01v" data-path="src/components/ui/input-otp.tsx" />
);
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & {index: number;}>(
  ({ index, className, ...props }, ref) => {
    const inputOTPContext = React.useContext(OTPInputContext);
    const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
          isActive && "z-10 ring-1 ring-ring",
          className
        )}
        {...props} data-id="byz50ecys" data-path="src/components/ui/input-otp.tsx">

      {char}
      {hasFakeCaret &&
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" data-id="sn6kwsu36" data-path="src/components/ui/input-otp.tsx">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" data-id="9m0ijsmqq" data-path="src/components/ui/input-otp.tsx" />
        </div>
        }
    </div>);

  });
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">>(
  ({ ...props }, ref) =>
  <div ref={ref} role="separator" {...props} data-id="g6xmw0cl7" data-path="src/components/ui/input-otp.tsx">
    <Minus />
  </div>
);
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };