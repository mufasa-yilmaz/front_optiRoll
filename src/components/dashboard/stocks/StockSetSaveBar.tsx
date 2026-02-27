interface StockSetSaveBarProps {
  setName: string;
  onSetNameChange: (value: string) => void;
}

/**
 * Stok seti adı için giriş alanı sunan form.
 */
export function StockSetSaveBar({
  setName,
  onSetNameChange,
}: StockSetSaveBarProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3">
        <input
          value={setName}
          onChange={(event) => onSetNameChange(event.target.value)}
          placeholder="Set adi (Orn: Depo-A Hazir Rulolar)"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-primary/20 transition focus:ring-2"
        />
      </div>
    </div>
  );
}
