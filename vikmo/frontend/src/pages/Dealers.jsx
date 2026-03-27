import { useEffect, useState } from 'react'
import api from '../api'
import Modal from '../components/Modal'

const empty = { dealer_code: '', name: '', email: '', phone: '', address: '' }

export default function Dealers() {
  const [dealers, setDealers] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [err, setErr] = useState('')

  const load = () => api.get('/dealers/').then(r => setDealers(r.data))
  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(empty); setErr(''); setModal('create') }
  const openEdit = d => { setForm({ dealer_code: d.dealer_code, name: d.name, email: d.email, phone: d.phone, address: d.address }); setErr(''); setModal({ type: 'edit', id: d.id }) }

  const save = async () => {
    try {
      if (modal === 'create') await api.post('/dealers/', form)
      else await api.put(`/dealers/${modal.id}/`, form)
      setModal(null); load()
    } catch (e) { setErr(JSON.stringify(e.response?.data)) }
  }

  const del = async id => {
    if (!confirm('Delete this dealer?')) return
    await api.delete(`/dealers/${id}/`); load()
  }

  const inputStyle = { width: '100%', padding: '8px 10px', border: '0.5px solid #d3d1c7', borderRadius: '8px', fontSize: '14px', marginBottom: '10px' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '500' }}>Dealers</h2>
        <button onClick={openCreate} style={{ padding: '8px 16px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px' }}>+ Add dealer</button>
      </div>
      <div style={{ background: '#fff', border: '0.5px solid #e8e6e0', borderRadius: '12px', overflow: 'hidden' }}>
        <table>
          <thead><tr style={{ borderBottom: '1px solid #e8e6e0' }}>
            {['Code', 'Name', 'Email', 'Phone', 'Actions'].map(h =>
              <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '12px', color: '#5F5E5A', fontWeight: '500' }}>{h}</th>
            )}
          </tr></thead>
          <tbody>
            {dealers.map(d => (
              <tr key={d.id} style={{ borderBottom: '0.5px solid #f1efe8' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: '13px' }}>{d.dealer_code}</td>
                <td style={{ padding: '10px 16px', fontSize: '14px' }}>{d.name}</td>
                <td style={{ padding: '10px 16px', fontSize: '14px', color: '#185FA5' }}>{d.email}</td>
                <td style={{ padding: '10px 16px', fontSize: '14px' }}>{d.phone}</td>
                <td style={{ padding: '10px 16px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(d)} style={{ padding: '4px 12px', border: '0.5px solid #d3d1c7', borderRadius: '6px', background: 'none', fontSize: '13px' }}>Edit</button>
                  <button onClick={() => del(d.id)} style={{ padding: '4px 12px', border: '0.5px solid #f0cece', borderRadius: '6px', background: 'none', fontSize: '13px', color: '#A32D2D' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal === 'create' ? 'Add dealer' : 'Edit dealer'} onClose={() => setModal(null)}>
          {err && <div style={{ color: '#A32D2D', fontSize: '13px', marginBottom: '10px' }}>{err}</div>}
          <input style={inputStyle} placeholder="Dealer code" value={form.dealer_code} onChange={e => setForm({ ...form, dealer_code: e.target.value })} />
          <input style={inputStyle} placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input style={inputStyle} placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input style={inputStyle} placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <input style={inputStyle} placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          <button onClick={save} style={{ width: '100%', padding: '10px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px' }}>Save</button>
        </Modal>
      )}
    </div>
  )
}
