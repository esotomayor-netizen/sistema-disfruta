import { CosechaProvider } from '@/context/CosechaContext'

export default function CosechaLayout({ children }: { children: React.ReactNode }) {
  return <CosechaProvider>{children}</CosechaProvider>
}
