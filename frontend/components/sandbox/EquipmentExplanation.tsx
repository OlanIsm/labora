import { Entity } from "@/lib/sandbox/types";
import { equipmentGuides } from "@/lib/sandbox/equipmentGuides";
import { litmusExplanation } from "@/lib/sandbox/litmus";

export default function EquipmentExplanation({ entity, compact = false }: { entity?: Entity; compact?: boolean }) {
  const guide = entity && equipmentGuides[entity.material];
  if (!entity || !guide) return null;
  const result = litmusExplanation(entity);
  return (
    <section className="sandbox-equipment-explanation" aria-label={`Tentang ${entity.label}`}>
      {!compact && <h2>{entity.label}</h2>}
      {result ? <>
        <p><strong>{result.summary}</strong></p>
        <p>{result.reason}</p>
        <p>{result.hint}</p>
      </> : <>
        <p>{guide.purpose}</p>
        <p><strong>Cara pakai di sini:</strong> {guide.usage}</p>
      </>}
      {guide.limitation && (compact ? <details className="sandbox-equipment-limit">
        <summary>Batas simulasi</summary>
        <p>{guide.limitation}</p>
      </details> : <p className="sandbox-equipment-limit"><strong>Batas simulasi:</strong> {guide.limitation}</p>)}
    </section>
  );
}
