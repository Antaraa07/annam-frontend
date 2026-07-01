export default function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800 px-8">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Dashboard
        </h2>

        <p className="text-sm text-zinc-400">
          Welcome to ANNAM Storage Platform
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-emerald-500" />
      </div>
    </header>
  );
}