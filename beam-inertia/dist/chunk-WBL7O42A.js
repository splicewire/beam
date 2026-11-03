import {
  cn
} from "./chunk-GBIJGQ7E.js";

// src/components/ui/input-otp.tsx
import { OTPInput, OTPInputContext } from "input-otp";
import { Minus } from "lucide-react";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var InputOTP = React.forwardRef(({ className, containerClassName, ...props }, ref) => /* @__PURE__ */ jsx(
  OTPInput,
  {
    ref,
    containerClassName: cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    ),
    className: cn("disabled:cursor-not-allowed", className),
    ...props
  }
));
InputOTP.displayName = "InputOTP";
var InputOTPGroup = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("flex items-center", className), ...props }));
InputOTPGroup.displayName = "InputOTPGroup";
var InputOTPSlot = React.forwardRef(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref,
      className: cn(
        "relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-1 ring-ring",
        className
      ),
      ...props,
      children: [
        char,
        hasFakeCaret && /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "h-4 w-px animate-caret-blink bg-foreground duration-1000" }) })
      ]
    }
  );
});
InputOTPSlot.displayName = "InputOTPSlot";
var InputOTPSeparator = React.forwardRef(({ ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, role: "separator", ...props, children: /* @__PURE__ */ jsx(Minus, {}) }));
InputOTPSeparator.displayName = "InputOTPSeparator";

// src/hooks/use-two-factor-auth.ts
import { useHttp } from "@inertiajs/react";
import { useCallback, useState } from "react";
var OTP_MAX_LENGTH = 6;
var useTwoFactorAuth = () => {
  const { submit } = useHttp();
  const [qrCodeSvg, setQrCodeSvg] = useState(null);
  const [manualSetupKey, setManualSetupKey] = useState(null);
  const [recoveryCodesList, setRecoveryCodesList] = useState([]);
  const [errors, setErrors] = useState([]);
  const hasSetupData = qrCodeSvg !== null && manualSetupKey !== null;
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);
  const clearSetupData = useCallback(() => {
    setManualSetupKey(null);
    setQrCodeSvg(null);
    setErrors([]);
  }, []);
  const clearTwoFactorAuthData = useCallback(() => {
    setManualSetupKey(null);
    setQrCodeSvg(null);
    setErrors([]);
    setRecoveryCodesList([]);
  }, []);
  const fetchQrCode = useCallback(async () => {
    try {
      const { svg } = await submit({
        method: "get",
        url: "/user/two-factor-qr-code"
      });
      setQrCodeSvg(svg);
    } catch {
      setErrors((prev) => [...prev, "Failed to fetch QR code"]);
      setQrCodeSvg(null);
    }
  }, [submit]);
  const fetchSetupKey = useCallback(async () => {
    try {
      const { secretKey: key } = await submit({
        method: "get",
        url: "/user/two-factor-secret-key"
      });
      setManualSetupKey(key);
    } catch {
      setErrors((prev) => [...prev, "Failed to fetch a setup key"]);
      setManualSetupKey(null);
    }
  }, [submit]);
  const fetchRecoveryCodes = useCallback(async () => {
    try {
      setErrors([]);
      const codes = await submit({
        method: "get",
        url: "/user/two-factor-recovery-codes"
      });
      setRecoveryCodesList(codes);
    } catch {
      setErrors((prev) => [...prev, "Failed to fetch recovery codes"]);
      setRecoveryCodesList([]);
    }
  }, [submit]);
  const fetchSetupData = useCallback(async () => {
    try {
      setErrors([]);
      await Promise.all([fetchQrCode(), fetchSetupKey()]);
    } catch {
      setQrCodeSvg(null);
      setManualSetupKey(null);
    }
  }, [fetchQrCode, fetchSetupKey]);
  return {
    qrCodeSvg,
    manualSetupKey,
    recoveryCodesList,
    hasSetupData,
    errors,
    clearErrors,
    clearSetupData,
    clearTwoFactorAuthData,
    fetchQrCode,
    fetchSetupKey,
    fetchSetupData,
    fetchRecoveryCodes
  };
};

export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  OTP_MAX_LENGTH,
  useTwoFactorAuth
};
//# sourceMappingURL=chunk-WBL7O42A.js.map