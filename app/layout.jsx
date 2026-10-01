import './globals.css';
export const metadata = { title: 'Leaf Quest: The Photosynthesis Trail', description: '3D educational adventure game' };
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };
export default function RootLayout({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
