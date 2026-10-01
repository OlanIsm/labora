import Link from "next/link";

export default function ChemistryLabList() {
  return <>
    <div className="page-heading">
      <h1>Lab Kimia Interaktif</h1>
      <p>Campur bahan, uji sifat larutan, dan amati perubahan di meja percobaan bebas.</p>
    </div>
    <div className="chemistry-lab-list">
      <Link href="/sandbox/chemistry" className="chemistry-lab-card">
        <span className="chemistry-curriculum">SMA/MA Kelas X–XII</span>
        <h2>Meja Percobaan Kimia</h2>
        <p>Ambil alat dan bahan, tuang ke wadah, lalu ukur pH atau coba pemisahan campuran. Tanpa urutan wajib.</p>
        <span className="card-link">Buka lab →</span>
      </Link>
    </div>
  </>;
}
