import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import GiffyMascot from "./GiffyMascot";
import PeaPlant from "./PeaPlant";
import { microscopeSlides } from "./microscope";
import { GARDEN_MISSIONS } from "./garden";

export const biologyActivities = [
  { id: "microscope", title: "Dunia di bawah mikroskop", description: "Masukkan preparat, geser bidang pandang, dan temukan struktur sel bersama Giffy.", href: "/sandbox/biology" },
  { id: "garden", title: "Misi Kebun", description: "Pilih pasangan induk, pecahkan misteri genotipe, dan bangun kebun dari keturunanmu.", href: "/biologi/kebun" },
];

export default function BiologyLabList() {
  return <>
    <Link href="/laboratories" className="back-link"><ArrowLeft size={18} /> Semua lab</Link>
    <div className="page-heading"><h1>Lab Biologi</h1><p>Amati kehidupan dari dekat, lalu cari tahu bagaimana sifat diwariskan.</p></div>
    <GiffyMascot line="Hai, aku Giffy! Mau mengenali sel lewat mikroskop, atau mencari pasangan induk untuk mencapai tujuan kebun? Pilih pertanyaanmu, lalu kita selidiki bersama." />
    <div className="biology-activity-grid">{biologyActivities.map(activity => <Link key={activity.id} href={activity.href} className="biology-activity">
      <div className={`biology-activity-art ${activity.id}`} aria-hidden="true">{activity.id === "garden" ? <><PeaPlant genes="PPRR" /><PeaPlant genes="ppRR" /><PeaPlant genes="PpRr" showSeed /></> : <svg viewBox="0 0 260 170">
        <circle cx="130" cy="85" r="72" fill="#fff1f4" stroke="#1f2430" strokeWidth="10" />
        {[[93, 50], [149, 44], [179, 82], [85, 103], [156, 132], [116, 130]].map(([x, y]) => <g key={x}><circle cx={x} cy={y} r="15" fill="#dfadbf" stroke="#af758e" strokeWidth="2" /><circle cx={x} cy={y} r="6" fill="#f7d8e3" /></g>)}
        <circle cx="128" cy="82" r="21" fill="#e1d7ec" stroke="#9a82ac" strokeWidth="2" /><path d="M115 75q10-16 15 2 14-8 12 9-14 16-14 0-16 8-13-11Z" fill="#806092" />
      </svg>}</div>
      <div className="biology-activity-body"><h2>{activity.title}</h2><p>{activity.description}</p><small>{activity.id === "microscope" ? `${microscopeSlides.length} preparat untuk diamati` : `${GARDEN_MISSIONS.length} misi dan papan Punnett interaktif`}</small><span>Buka aktivitas <ArrowRight size={18} /></span></div>
    </Link>)}</div>
  </>;
}
