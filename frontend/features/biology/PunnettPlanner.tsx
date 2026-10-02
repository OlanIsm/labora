"use client";
import { useState } from "react";
import { FlowerGenes, GardenPlant, Genes, phenotypeLabel, punnettSquare } from "./garden";
import PeaPlant from "./PeaPlant";

export default function PunnettPlanner({ first, second, traits, onInspect }: { first?: GardenPlant; second?: GardenPlant; traits: 1 | 2; onInspect: (line: string) => void }) {
  const [hypothesis, setHypothesis] = useState<FlowerGenes>("Pp");
  const [showPhenotype, setShowPhenotype] = useState(false);
  const [selected, setSelected] = useState(-1);
  const unknown = first && second && (!first.revealed || !second.revealed);
  const genes = (plant: GardenPlant) => plant.revealed ? plant.genes : `${hypothesis}RR` as Genes;
  const square = first && second ? punnettSquare(genes(first), genes(second), traits) : null;
  return <details className="punnett-planner">
    <summary>Rencanakan persilangan dengan papan Punnett</summary>
    <div className="punnett-planner-content">
      {!square && <p>Pilih kedua induk terlebih dahulu. Papan ini membantu memeriksa rencanamu sebelum menanam.</p>}
      {square && <>
        {unknown && <label className="garden-field">Hipotesis untuk tanaman misteri
          <select value={hypothesis} onChange={event => { setHypothesis(event.target.value as FlowerGenes); setSelected(-1); }}><option value="PP">Jika genotipenya PP</option><option value="Pp">Jika genotipenya Pp</option></select>
          <small>Ini hasil berdasarkan hipotesis, bukan bocoran genotipe misteri.</small>
        </label>}
        <label className="garden-check"><input type="checkbox" checked={showPhenotype} onChange={event => setShowPhenotype(event.target.checked)} />Tampilkan bentuk keturunan</label>
        <p className="garden-small">Setiap kotak memiliki peluang yang sama. Klik kotak untuk mengikuti alel dari kedua induk.</p>
        <div className="punnett-table-scroll"><table className="punnett-table">
          <caption>Gamet induk 1 di atas, gamet induk 2 di samping</caption>
          <thead><tr><th scope="col">×</th>{square.a.map((gamete, index) => <th scope="col" key={index} className={selected >= 0 && selected % square.a.length === index ? "highlighted" : ""}>{gamete}</th>)}</tr></thead>
          <tbody>{square.b.map((gamete, row) => <tr key={row}><th scope="row" className={selected >= 0 && Math.floor(selected / square.a.length) === row ? "highlighted" : ""}>{gamete}</th>
            {square.a.map((_, col) => {
              const index = row * square.a.length + col, cell = square.cells[index];
              return <td key={col}><button type="button" aria-pressed={selected === index} aria-label={`${cell.genes}, ${phenotypeLabel(cell.genes, traits)}`} onClick={() => {
                setSelected(index);
                onInspect(`${unknown ? "Dalam hipotesis ini, " : ""}anak ${cell.genes} menerima gamet ${cell.fromA} dari induk 1 dan ${cell.fromB} dari induk 2. ${phenotypeLabel(cell.genes, traits)}. Peluang satu kotak adalah 1 dari ${square.cells.length}; genotipe yang muncul berulang memiliki peluang lebih besar.`);
              }}>{showPhenotype && <PeaPlant genes={cell.genes} compact showSeed={traits === 2} />}<strong>{cell.genes}</strong></button></td>;
            })}
          </tr>)}</tbody>
        </table></div>
        <div className="punnett-probabilities"><section><h3>Peluang genotipe</h3>{Object.entries(square.genotypes).map(([genotype, count]) => <p key={genotype}><span>{genotype}</span><strong>{new Intl.NumberFormat("id-ID").format(count / square.cells.length * 100)}%</strong></p>)}</section>
          <section><h3>Peluang fenotipe</h3>{Object.entries(square.phenotypes).map(([phenotype, count]) => <p key={phenotype}><span>{phenotype}</span><strong>{new Intl.NumberFormat("id-ID").format(count / square.cells.length * 100)}%</strong></p>)}</section></div>
      </>}
    </div>
  </details>;
}
