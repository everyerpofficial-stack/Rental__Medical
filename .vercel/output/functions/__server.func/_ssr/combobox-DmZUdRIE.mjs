import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { Tt as ChevronsUpDown, kt as Check } from "../_libs/lucide-react.mjs";
import { d as cn, t as Button } from "./dialog-BHa0LWsH.mjs";
import { i as Trigger, n as Portal, r as Root2, t as Content2 } from "../_libs/@radix-ui/react-popover+[...].mjs";
import { c as Command$1, d as CommandInput, f as CommandItem, l as CommandEmpty, p as CommandList, u as CommandGroup } from "./AppShell-ABaTd-bJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/combobox-DmZUdRIE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Popover = Root2;
var PopoverTrigger = Trigger;
var PopoverContent = import_react.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	align,
	sideOffset,
	className: cn("z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)", className),
	...props
}) }));
PopoverContent.displayName = Content2.displayName;
function Combobox({ options, value, onValueChange, placeholder = "Select option...", searchPlaceholder = "Search...", emptyText = "No option found.", className }) {
	const [open, setOpen] = import_react.useState(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				variant: "outline",
				role: "combobox",
				"aria-expanded": open,
				className: cn("w-full justify-between font-normal bg-background h-10 text-[13px] px-3 border-border/60 hover:bg-muted/10", className),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate",
					children: value ? options.find((option) => option.value === value)?.label : placeholder
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronsUpDown, { className: "ml-2 h-4 w-4 shrink-0 opacity-50" })]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverContent, {
			className: "p-0 border border-border-strong bg-popover shadow-elevated rounded-lg overflow-hidden",
			align: "start",
			side: "bottom",
			sideOffset: 4,
			style: { width: "var(--radix-popover-trigger-width)" },
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Command$1, {
				className: "w-full",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandInput, {
					placeholder: searchPlaceholder,
					className: "text-[13px] h-9 border-none focus:ring-0"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandList, {
					className: "max-h-[250px] overflow-y-auto w-full p-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandEmpty, {
						className: "py-3.5 text-center text-[12.5px] text-muted-foreground",
						children: emptyText
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandGroup, {
						className: "p-0",
						children: options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
							value: option.label + " " + option.value + " " + (option.searchTerms || ""),
							onSelect: () => {
								onValueChange(option.value === value ? "" : option.value);
								setOpen(false);
							},
							className: "flex items-center justify-between text-[12.5px] px-2.5 py-2 cursor-pointer rounded-md hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate flex-1 pr-2",
								children: option.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: cn("h-4 w-4 shrink-0 opacity-70", value === option.value ? "opacity-100" : "opacity-0") })]
						}, option.value))
					})]
				})]
			})
		})]
	});
}
//#endregion
export { Combobox as t };
