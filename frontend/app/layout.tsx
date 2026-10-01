import "./styles.css";
import "./sandbox.css";
import './specimens.css';
export const metadata = {
  title: "Labora | Laboratorium Sains Virtual",
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
