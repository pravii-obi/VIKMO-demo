import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Dealers from './pages/Dealers'
import Orders from './pages/Orders'
import Inventory from './pages/Inventory'

const navStyle = ({ isActive }) => ({
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: isActive ? '500' : '400',
  color: isActive ? '#185FA5' : '#5F5E5A',
  background: isActive ? '#E6F1FB' : 'transparent',
})

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: '#fff', borderBottom: '1px solid #e8e6e0', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: 1100, margin: '0 auto', height: 56 }}>
            <span style={{ fontWeight: '600', fontSize: '16px', marginRight: '16px' }}>Vikmo</span>
            <NavLink to="/dashboard" style={navStyle}>Dashboard</NavLink>
            <NavLink to="/products" style={navStyle}>Products</NavLink>
            <NavLink to="/dealers" style={navStyle}>Dealers</NavLink>
            <NavLink to="/orders" style={navStyle}>Orders</NavLink>
            <NavLink to="/inventory" style={navStyle}>Inventory</NavLink>
          </div>
        </header>
        <main style={{ flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '2rem' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/dealers" element={<Dealers />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/inventory" element={<Inventory />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
