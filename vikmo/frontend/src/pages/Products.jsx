import { useEffect, useState } from 'react'
import api from '../api'
import Modal from '../components/Modal'

const empty = { sku: '', name: '', description: '', price: '' }

export default function Products() {
  const [products, setProducts] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [err, setErr] = useState('')

  const load = () => api.get('/products/').then(r => setProducts(r.data))
  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(empty); setErr(''); setModal('create') }
  const openEdit = p => { setForm({ sku: p.sku, name: p.name, description: p.description, price: p.price }); setErr(''); setModal({ type: 'edit', id: p.id }) }

  const save = async () => {
    try {
      if (modal === 'create') {
        await api.post('/products/', form)
      } else {
        await api.put(`/products/${modal.id}/`, form)
      }
      setModal(null); load()
    } catch (e) {
      setErr(JSON.stringify(e.response?.data))
    }
  }

  const del = async id => {
    if (!confirm('Delete this product?')) return
    await api.delete(`/products/${id}/`); load()
  }

  const inputStyle = { width: '100%', padding: '8px 10px', border: '0.5px solid #d3d1c7', borderRadius: '8px', fontSize: '14px', marginBottom: '10px' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '500' }}>Products</h2>
        <button onClick={openCreate} style={{ padding: '8px 16px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px' }}>+ Add product</button>
      </div>
      <div style={{ background: '#fff', border: '0.5px solid #e8e6e0', borderRadius: '12px', overflow: 'hidden' }}>
        <table>
          <thead><tr style={{ borderBottom: '1px solid #e8e6e0' }}>
            {['SKU', 'Name', 'Price', 'Stock', 'Actions'].map(h =>
              <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '12px', color: '#5F5E5A', fontWeight: '500' }}>{h}</th>
            )}
          </tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderBottom: '0.5px solid #f1efe8' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: '13px' }}>{p.sku}</td>
                <td style={{ padding: '10px 16px', fontSize: '14px' }}>{p.name}</td>
                <td style={{ padding: '10px 16px', fontSize: '14px' }}>₹{Number(p.price).toLocaleString()}</td>
                <td style={{ padding: '10px 16px', fontSize: '14px', color: (p.inventory?.quantity || 0) < 5 ? '#A32D2D' : '#1a1a1a' }}>
                  {p.inventory?.quantity ?? '—'}
                </td>
                <td style={{ padding: '10px 16px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(p)} style={{ padding: '4px 12px', border: '0.5px solid #d3d1c7', borderRadius: '6px', background: 'none', fontSize: '13px' }}>Edit</button>
                  <button onClick={() => del(p.id)} style={{ padding: '4px 12px', border: '0.5px solid #f0cece', borderRadius: '6px', background: 'none', fontSize: '13px', color: '#A32D2D' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal === 'create' ? 'Add product' : 'Edit product'} onClose={() => setModal(null)}>
          {err && <div style={{ color: '#A32D2D', fontSize: '13px', marginBottom: '10px' }}>{err}</div>}
          <input style={inputStyle} placeholder="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
          <input style={inputStyle} placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input style={inputStyle} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <input style={inputStyle} placeholder="Price" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          <button onClick={save} style={{ width: '100%', padding: '10px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px' }}>Save</button>
        </Modal>
      )}
    </div>
  )
}
