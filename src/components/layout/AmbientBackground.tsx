export function AmbientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[150px]"></div>
      <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]"></div>
      <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[150px]"></div>
    </div>
  );
}
