import { useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Download, FileSpreadsheet, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { downloadExcel } from "@/lib/data-store";

export interface ImportColumn {
  /** Field key passed to onImportRow */
  key: string;
  /** Column header shown in the template / preview */
  label: string;
  required?: boolean;
  /** Alternate header spellings this column should also match (case-insensitive) */
  aliases?: string[];
}

type ImportRowResult = { ok: boolean; error?: string };

interface ParsedRow {
  mapped: Record<string, string>;
  errors: string[];
}

/** Splits raw pasted/uploaded text into rows of cells — supports comma or tab delimiting and quoted fields. */
function parseDelimitedText(text: string): string[][] {
  const trimmed = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!trimmed) return [];
  const firstLine = trimmed.split("\n")[0];
  const delimiter = firstLine.includes("\t") ? "\t" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inQuotes) {
      if (ch === '"') {
        if (trimmed[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  row.push(field);
  rows.push(row);
  return rows;
}

export function ImportCsvDialog({
  entityLabel,
  columns,
  trigger,
  onImportRow,
  onComplete,
}: {
  /** Plural display name, e.g. "Customers" */
  entityLabel: string;
  columns: ImportColumn[];
  trigger: React.ReactNode;
  onImportRow: (row: Record<string, string>) => ImportRowResult | Promise<ImportRowResult>;
  onComplete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"input" | "preview" | "done">("input");
  const [pasteText, setPasteText] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("input");
    setPasteText("");
    setRows([]);
    setResult(null);
  };

  const findColumnForHeader = (header: string): ImportColumn | undefined => {
    const h = header.trim().toLowerCase();
    return columns.find(
      (c) => c.label.toLowerCase() === h || c.key.toLowerCase() === h || (c.aliases || []).some((a) => a.toLowerCase() === h)
    );
  };

  const parseText = (text: string) => {
    const table = parseDelimitedText(text);
    if (table.length < 1) {
      toast.error("No data found. Paste rows including a header row, or upload a CSV file.");
      return;
    }
    const [headerRow, ...dataRows] = table;
    const headerMap = headerRow.map(findColumnForHeader);

    const missingRequired = columns.filter((c) => c.required && !headerMap.some((m) => m?.key === c.key));
    if (missingRequired.length > 0) {
      toast.error(`Missing required column${missingRequired.length > 1 ? "s" : ""}: ${missingRequired.map((c) => c.label).join(", ")}`);
      return;
    }

    const parsedRows: ParsedRow[] = dataRows
      .filter((r) => r.some((cell) => cell.trim() !== ""))
      .map((r) => {
        const mapped: Record<string, string> = {};
        r.forEach((cell, i) => {
          const col = headerMap[i];
          if (col) mapped[col.key] = cell.trim();
        });
        const errors: string[] = [];
        columns.forEach((c) => {
          if (c.required && !mapped[c.key]) errors.push(`Missing ${c.label}`);
        });
        return { mapped, errors };
      });

    if (parsedRows.length === 0) {
      toast.error("No data rows found below the header.");
      return;
    }

    setRows(parsedRows);
    setStep("preview");
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setPasteText(text);
      parseText(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setIsImporting(true);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    for (const row of rows) {
      if (row.errors.length > 0) {
        failed++;
        errors.push(row.errors.join(", "));
        continue;
      }
      try {
        const res = await onImportRow(row.mapped);
        if (res.ok) success++;
        else {
          failed++;
          if (res.error) errors.push(res.error);
        }
      } catch (e) {
        failed++;
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
    setResult({ success, failed, errors });
    setStep("done");
    setIsImporting(false);
    if (success > 0) onComplete?.();
  };

  const downloadTemplate = () => {
    downloadExcel(
      `${entityLabel.toLowerCase().replace(/\s+/g, "_")}_import_template`,
      columns.map((c) => c.label + (c.required ? " *" : "")),
      []
    );
  };

  const readyCount = rows.filter((r) => r.errors.length === 0).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" /> Import {entityLabel}
          </DialogTitle>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-[12.5px] text-muted-foreground">
                Upload a CSV file, or copy rows from Excel / Google Sheets and paste them below.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-1.5 h-3.5 w-3.5" /> Choose CSV File
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Or Paste Data</Label>
              <Textarea
                placeholder={columns.map((c) => c.label).join(", ")}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="min-h-[120px] font-mono text-[12px]"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={downloadTemplate} className="text-[12px] self-start">
                <Download className="mr-1.5 h-3.5 w-3.5" /> Download Template
              </Button>
              <Button size="sm" onClick={() => parseText(pasteText)} disabled={!pasteText.trim()}>
                Preview Import
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-3 py-2">
            <p className="text-[12.5px] text-muted-foreground">
              Found <strong className="text-foreground">{rows.length}</strong> row{rows.length !== 1 ? "s" : ""}.{" "}
              {rows.length > readyCount && (
                <span className="text-destructive">{rows.length - readyCount} will be skipped due to missing required fields.</span>
              )}
            </p>
            <div className="hidden md:block border border-border rounded-lg overflow-auto max-h-[320px]">
              <table className="w-full text-[11.5px]">
                <thead className="bg-muted/40 sticky top-0">
                  <tr>
                    {columns.map((c) => (
                      <th key={c.key} className="text-left px-2.5 py-1.5 font-semibold whitespace-nowrap">{c.label}</th>
                    ))}
                    <th className="text-left px-2.5 py-1.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r, i) => (
                    <tr key={i} className={`border-t border-border/50 ${r.errors.length > 0 ? "bg-destructive/5" : ""}`}>
                      {columns.map((c) => (
                        <td key={c.key} className="px-2.5 py-1.5 whitespace-nowrap">{r.mapped[c.key] || "—"}</td>
                      ))}
                      <td className="px-2.5 py-1.5 whitespace-nowrap">
                        {r.errors.length > 0
                          ? <span className="text-destructive font-medium">{r.errors.join(", ")}</span>
                          : <span className="text-success font-medium">Ready</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list — visible only below md */}
            <div className="md:hidden space-y-2 max-h-[320px] overflow-y-auto pr-0.5">
              {rows.slice(0, 50).map((r, i) => (
                <div
                  key={i}
                  className={`mobile-card-item ${r.errors.length > 0 ? "border-destructive/40 bg-destructive/5" : ""}`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[11px] font-bold text-foreground">Row {i + 1}</span>
                      {r.errors.length > 0
                        ? <span className="text-destructive font-semibold text-[11px] text-right">{r.errors.join(", ")}</span>
                        : <span className="text-success font-semibold text-[11px]">Ready</span>}
                    </div>
                    {columns.map((c) => (
                      <div key={c.key} className="info-row justify-between gap-2">
                        <span className="shrink-0">{c.label}</span>
                        <span className="text-foreground font-medium text-right truncate">{r.mapped[c.key] || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {rows.length > 50 && (
              <p className="text-[11px] text-muted-foreground">Showing first 50 of {rows.length} rows.</p>
            )}
          </div>
        )}

        {step === "done" && result && (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 mx-auto text-success" />
            <p className="text-[14px] font-semibold text-foreground">
              Imported {result.success} of {rows.length} {entityLabel.toLowerCase()}.
            </p>
            {result.failed > 0 && (
              <div className="text-left text-[11.5px] text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3 max-h-[150px] overflow-auto space-y-1">
                {result.errors.slice(0, 20).map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "input" && (
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("input")}>Back</Button>
              <Button onClick={handleImport} disabled={isImporting || readyCount === 0}>
                {isImporting ? (
                  <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Importing...</>
                ) : (
                  `Import ${readyCount} Row${readyCount !== 1 ? "s" : ""}`
                )}
              </Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={() => setOpen(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
