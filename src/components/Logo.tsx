import logoAsset from "@/assets/eixo-real-logo.png.asset.json";

export function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return <img src={logoAsset.url} alt="Eixo Real Transportes" className={className} />;
}
