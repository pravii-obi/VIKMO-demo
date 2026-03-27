import { useEffect, useState } from 'react'
import api from '../api'

export default function Inventory() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState({})

  const load = () => api.get('/inventory/').then(r => setItems(r.data))
  useEffect(() => { load() }, [])

  const startEdit = (id, qty) => setEditing({ ...editing, [id]: qty })
  const cancelEdit = id => { const e = { ...editing }; delete e[id]; setEditing(e) }

  const save = async (id) => {
    await api.patch(`/inventory/${id}/`, { quantity: Number(editing[id]) })
    cancelEdit(id); load()
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '500', marginBottom: '1.5rem' }}>Inventory</h2>
      <div style={{ background: '#fff', border: '0.5px solid #e8e6e0', borderRadius: '12px', overflow: 'hidden' }}>
        <table>
          <thead><tr style={{ borderBottom: '1px solid #e8e6e0' }}>
            {['Product', 'Current stock', 'Status', 'Actions'].map(h =>
              <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '12px', color: '#5F5E5A', fontWeight: '500' }}>{h}</th>
            )}
          </tr></thead>
          <tbody>
            {items.map(item => {
              const isEditing = editing[item.id] !== undefined
              const qty = item.quantity
              const statusColor = qty === 0 ? '#A32D2D' : qty < 5 ? '#854F0B' : '#085041'
              const statusBg = qty === 0 ? '#FCEBEB' : qty < 5 ? '#FAEEDA' : '#E1F5EE'
              const statusLabel = qty === 0 ? 'Out of stock' : qty < 5 ? 'Low stock' : 'In stock'
              return (
                <tr key={item.id} style={{ borderBottom: '0.5px solid #f1efe8' }}>
                  <td style={{ padding: '10px 16px', fontSize: '14px' }}>
                    {item.product_sku && <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888', marginRight: '8px' }}>{item.product_sku}</span>}
                    {item.product_name || `Product #${item.product}`}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    {isEditing ? (
                      <input type="number" min="0" value={editing[item.id]}
                        onChange={e => setEditing({ ...editing, [item.id]: e.target.value })}
                        style={{ width: '80px', padding: '4px 8px', border: '0.5px solid #d3d1c7', borderRadius: '6px', fontSize: '14px' }} />
                    ) : (
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{qty}</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', background: statusBg, color: statusColor }}>{statusLabel}</span>
                  </td>
                  <td style={{ padding: '10px 16px', display: 'flex', gap: '8px' }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => save(item.id)} style={{ padding: '4px 12px', border: '0.5px solid #9FE1CB', borderRadius: '6px', background: '#e1f5ee', fontSize: '13px', color: '#085041' }}>Save</button>
                        <button onClick={() => cancelEdit(item.id)} style={{ padding: '4px 12px', border: '0.5px solid #d3d1c7', borderRadius: '6px', background: 'none', fontSize: '13px' }}>Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(item.id, qty)} style={{ padding: '4px 12px', border: '0.5px solid #d3d1c7', borderRadius: '6px', background: 'none', fontSize: '13px' }}>Update stock</button>
                    )}
                  </td>
                </tr>
              )
            })}
            {items.length === 0 && (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: '14px' }}>No inventory records. Add products first.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
