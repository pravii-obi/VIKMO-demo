import { useEffect, useState } from 'react'
import api from '../api'

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e8e6e0', borderRadius: '12px', padding: '1.25rem' }}>
      <div style={{ fontSize: '13px', color: '#5F5E5A', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '500', color: color || '#1a1a1a' }}>{value}</div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState({ products: 0, dealers: 0, orders: [], inventory: [] })

  useEffect(() => {
    Promise.all([
      api.get('/products/'), api.get('/dealers/'),
      api.get('/orders/'), api.get('/inventory/')
    ]).then(([p, d, o, i]) => setData({
      products: p.data.length, dealers: d.data.length,
      orders: o.data, inventory: i.data
    }))
  }, [])

  const draft = data.orders.filter(o => o.status === 'draft').length
  const confirmed = data.orders.filter(o => o.status === 'confirmed').length
  const delivered = data.orders.filter(o => o.status === 'delivered').length
  const lowStock = data.inventory.filter(i => i.quantity < 5).length

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '500', marginBottom: '1.5rem' }}>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '2rem' }}>
        <StatCard label="Total products" value={data.products} />
        <StatCard label="Total dealers" value={data.dealers} />
        <StatCard label="Draft orders" value={draft} color="#633806" />
        <StatCard label="Confirmed" value={confirmed} color="#085041" />
        <StatCard label="Delivered" value={delivered} color="#27500a" />
        <StatCard label="Low stock items" value={lowStock} color={lowStock > 0 ? '#A32D2D' : '#1a1a1a'} />
      </div>
      <h3 style={{ fontSize: '15px', fontWeight: '500', marginBottom: '1rem' }}>Recent orders</h3>
      <div style={{ background: '#fff', border: '0.5px solid #e8e6e0', borderRadius: '12px', overflow: 'hidden' }}>
        <table>
          <thead><tr style={{ borderBottom: '1px solid #e8e6e0' }}>
            {['Order #', 'Dealer', 'Status', 'Total'].map(h =>
              <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '12px', color: '#5F5E5A', fontWeight: '500' }}>{h}</th>
            )}
          </tr></thead>
          <tbody>
            {data.orders.slice(0, 8).map(o => (
              <tr key={o.id} style={{ borderBottom: '0.5px solid #f1efe8' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: '13px' }}>{o.order_number}</td>
                <td style={{ padding: '10px 16px', fontSize: '14px' }}>{o.dealer_name}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
                    background: o.status==='draft'?'#faeeda':o.status==='confirmed'?'#e1f5ee':'#eaf3de',
                    color: o.status==='draft'?'#633806':o.status==='confirmed'?'#085041':'#27500a' }}>
                    {o.status}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', fontSize: '14px' }}>₹{Number(o.total_amount).toLocaleString()}</td>
              </tr>
            ))}
            {data.orders.length === 0 && (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: '14px' }}>No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
