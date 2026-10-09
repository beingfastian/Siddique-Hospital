import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";

// In-app replacement for window.confirm / window.prompt / window.alert.
// (design-system/qlinic/MASTER.md: ConfirmDialog)
//
//   const { confirm, prompt, alert } = useDialog();
//   if (await confirm({ title, message, confirmLabel: "Cancel appointment", tone: "danger" })) ...
//   const note = await prompt({ title, label, placeholder });   // string, or null if dismissed
//   await alert({ title, message });
//
// Destructive dialogs (tone "danger") focus the safe button first, so a stray Enter
// never cancels a patient's appointment.

const DialogContext = createContext(null);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog must be used inside <DialogProvider>");
  return context;
};

const DialogView = ({ dialog, onClose }) => {
  const { kind, title, message, confirmLabel, cancelLabel = "Go back", tone = "default", label, placeholder, defaultValue = "", inputType = "text", validate } = dialog;
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState("");
  const panel = useRef(null);
  const safeButton = useRef(null);
  const mainButton = useRef(null);
  const input = useRef(null);
  const titleId = useId();
  const messageId = useId();
  const danger = tone === "danger";

  useEffect(() => {
    const target = kind === "prompt" ? input.current : danger ? safeButton.current : mainButton.current;
    target?.focus();
  }, [kind, danger]);

  const dismiss = () => onClose(kind === "confirm" ? false : kind === "prompt" ? null : undefined);
  const accept = () => {
    if (kind === "prompt") {
      const problem = validate?.(value);
      if (problem) {
        setError(problem);
        input.current?.focus();
        return;
      }
      onClose(value);
    } else onClose(kind === "confirm" ? true : undefined);
  };

  // Escape closes; Tab stays inside the dialog
  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      dismiss();
    } else if (e.key === "Tab") {
      const items = [...panel.current.querySelectorAll("button, input, textarea, [tabindex]:not([tabindex='-1'])")].filter((el) => !el.disabled);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const Icon = danger ? FaExclamationTriangle : FaInfoCircle;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50" onMouseDown={(e) => e.target === e.currentTarget && dismiss()}>
      <div
        ref={panel}
        role={danger ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? messageId : undefined}
        onKeyDown={onKeyDown}
        className="w-full max-w-md rounded-xl bg-white shadow-lg border border-slate-200"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            accept();
          }}
        >
          <div className="p-5 flex gap-4">
            <span
              aria-hidden="true"
              className={`mt-0.5 h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${danger ? "bg-red-50 text-red-700" : "bg-primary-50 text-primary-700"}`}
            >
              <Icon />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-lg font-semibold text-slate-900">
                {title}
              </h2>
              {message && (
                <p id={messageId} className="mt-1 text-sm text-slate-600">
                  {message}
                </p>
              )}
              {kind === "prompt" && (
                <div className="mt-3">
                  {label && (
                    <label htmlFor={`${titleId}-input`} className="block text-sm font-medium text-slate-700 mb-1">
                      {label}
                    </label>
                  )}
                  <input
                    id={`${titleId}-input`}
                    ref={input}
                    type={inputType}
                    value={value}
                    placeholder={placeholder}
                    autoComplete={inputType === "password" ? "new-password" : "off"}
                    onChange={(e) => {
                      setValue(e.target.value);
                      setError("");
                    }}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${titleId}-error` : undefined}
                    className={`w-full rounded-lg border px-3 py-2 text-base text-slate-900 ${error ? "border-red-500" : "border-slate-300"}`}
                  />
                  {error && (
                    <p id={`${titleId}-error`} className="mt-1 text-sm text-red-700">
                      {error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="px-5 pb-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            {kind !== "alert" && (
              <button
                ref={safeButton}
                type="button"
                onClick={dismiss}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {cancelLabel}
              </button>
            )}
            <button
              ref={mainButton}
              type="submit"
              className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${danger ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary-800"}`}
            >
              {confirmLabel || (kind === "alert" ? "OK" : "Confirm")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const DialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);
  const returnFocus = useRef(null);

  const open = useCallback(
    (kind, options) =>
      new Promise((resolve) => {
        returnFocus.current = document.activeElement;
        resolver.current = resolve;
        setDialog({ kind, ...options });
      }),
    []
  );

  const close = (result) => {
    setDialog(null);
    resolver.current?.(result);
    resolver.current = null;
    // Back to the button that opened the dialog
    setTimeout(() => returnFocus.current?.focus?.(), 0);
  };

  const api = useRef({
    confirm: (options) => open("confirm", options),
    prompt: (options) => open("prompt", options),
    alert: (options) => open("alert", options),
  }).current;

  return (
    <DialogContext.Provider value={api}>
      {children}
      {dialog && <DialogView key={dialog.title} dialog={dialog} onClose={close} />}
    </DialogContext.Provider>
  );
};
