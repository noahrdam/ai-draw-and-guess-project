import { Trash2, Undo2 } from "lucide-react";
import { PALETTE } from "@/lib/constants";

interface Props {
  color: string;
  onColor: (color: string) => void;
  onUndo: () => void;
  onClear: () => void;
}

/** Colour palette plus undo and clear actions for the drawing canvas. */
export function Toolbar({ color, onColor, onUndo, onClear }: Props) {
  return (
    <div className="flex-none flex items-center gap-2.5 flex-wrap">
      <div className="flex items-center gap-2 bg-card border border-border rounded-2xl p-2 shadow-sm">
        {PALETTE.map(c => (
          <button
            key={c}
            onClick={() => onColor(c)}
            aria-label={`Color ${c}`}
            className="rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2"
            style={{
              width:     26,
              height:    26,
              background: c,
              transform: color === c ? "scale(1.25)" : undefined,
              boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined,
            }}
          />
        ))}
      </div>
      <button
        onClick={onUndo}
        className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-card border border-border text-sm font-medium hover:bg-muted transition-colors shadow-sm"
      >
        <Undo2 size={14} /> Undo
      </button>
      <button
        onClick={onClear}
        className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-card border border-border text-sm font-medium hover:bg-muted transition-colors text-muted-foreground shadow-sm"
      >
        <Trash2 size={14} /> Clear
      </button>
    </div>
  );
}
