import { ArrowLeft, LayoutDashboard } from 'lucide-react'
import { Link } from 'react-router-dom'
import Camide from '../../components/Camide/Camide'
import useAuth from '../../hooks/useAuth'
import './CamidePage.css'

export default function CamidePage() {
  const { profile } = useAuth()
  return <main className="camide-page"><header className="camide-page__nav"><Link to="/"><ArrowLeft /> Situs utama</Link>{['staff', 'admin'].includes(profile?.role) && <Link to="/dashboard"><LayoutDashboard /> Dashboard</Link>}</header><Camide /></main>
}
