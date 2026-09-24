import type { Metadata } from 'next';
import './globals.css';
import { SiteFooter, SiteHeader } from '../components/site-chrome';
export const metadata: Metadata = { title:'Finding Hope Africa | Rescue. Rebuild. Reintegrate.', description:'Finding Hope Africa walks with Zimbabwe’s orphaned, poor and vulnerable children and families until each one finds hope and a purpose.', icons:{icon:'/favicon.svg'} };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><SiteHeader/>{children}<SiteFooter/></body></html>}
