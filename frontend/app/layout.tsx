import "../features/laboratory/subjects/chemistry/chemistry.css";
import "../features/laboratory/subjects/physics/physics.css";
import "./physics-sims.css";
import "./sandbox.css";
import "./specimens.css";
import "./styles.css";
import "./app-shell.css";
export const metadata = {
  title: "Labora | Laboratorium Sains Virtual",
  icons: {
    icon: "/logo/logo.png",
    apple: "/logo/logo.png",
  },
  description:
    "Coba eksperimen kimia, fisika, dan biologi. Amati hasilnya dan pahami sains di baliknya.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
