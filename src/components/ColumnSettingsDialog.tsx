"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "./ui/dialog";
import {
  ColumnConfig,
  columnDef,
  defaultColumnConfig,
} from "@/lib/types/library/Columns";

type Props = {
  section: string;
  /** The section's saved layout, or null when it follows the defaults. */
  config: ColumnConfig | null;
  onClose: () => void;
  /** Called with the layout the section now uses — null means back to defaults. */
  onSaved: (config: ColumnConfig | null) => void;
};

export default function ColumnSettingsDialog({
  section,
  config,
  onClose,
  onSaved,
}: Props) {
  const [draft, setDraft] = useState<ColumnConfig>(
    config ?? defaultColumnConfig()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = `?section=${encodeURIComponent(section)}`;
  const visibleCount = draft.filter((column) => column.visible).length;

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= draft.length) return;
    setDraft((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function toggle(index: number) {
    setDraft((prev) =>
      prev.map((column, i) =>
        i === index ? { ...column, visible: !column.visible } : column
      )
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/library/columns${query}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columns: draft }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Could not save the column layout.");
        return;
      }
      onSaved(json.columns ?? null);
    } catch {
      setError("Could not save the column layout.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReset() {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/library/columns${query}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Could not reset the column layout.");
        return;
      }
      onSaved(null);
    } catch {
      setError("Could not reset the column layout.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[520px] overflow-y-auto max-h-[90vh] p-4 sm:p-6">
        <DialogTitle className="pb-1">Columns</DialogTitle>
        <p className="text-sm text-muted-foreground">
          Choose which columns {section ? `“${section}”` : "this section"} shows,
          and the order they appear in. The XLSX export follows the same order
          but always includes every column, hidden ones as well.
        </p>

        <ul className="flex flex-col divide-y rounded border">
          {draft.map((column, index) => {
            const def = columnDef(column.key);
            if (!def) return null;
            return (
              <li
                key={column.key}
                className="flex items-center gap-3 px-3 py-2"
              >
                <input
                  id={`column-${column.key}`}
                  type="checkbox"
                  checked={column.visible}
                  onChange={() => toggle(index)}
                  className="h-4 w-4"
                />
                <label
                  htmlFor={`column-${column.key}`}
                  className={`flex-1 text-sm ${
                    column.visible ? "" : "text-muted-foreground line-through"
                  }`}
                >
                  {def.label}
                  {!def.field && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (calculated)
                    </span>
                  )}
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Move ${def.label} up`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Move ${def.label} down`}
                  disabled={index === draft.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </Button>
              </li>
            );
          })}
        </ul>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {visibleCount === 0 && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Show at least one column.
          </p>
        )}

        <DialogFooter className="pt-2 border-t flex-col gap-2 sm:gap-0">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || visibleCount === 0}
          >
            {isSaving ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSaving || !config}
          >
            Reset to default
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
