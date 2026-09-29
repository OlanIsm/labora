import './styles.css';
export const metadata = { title: 'Labora — Virtual Science Laboratory', description: 'Learn science by doing.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
