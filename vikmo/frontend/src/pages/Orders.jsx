import { useEffect, useState } from 'react'
import api from '../api'
import StatusBadge from '../components/StatusBadge'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [dealers, setDealers] = useState([])
  const [products, setProducts] = useState([])
  const [selected, setSelected] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newOrder, setNewOrder] = useState({ dealer: '', notes: '', items: [{ product: '', quantity: 1 }] })
  const [err, setErr] = useState('')

  const load = () => api.get('/orders/').then(r => setOrders(r.data))
  useEffect(() => {
    load()
    api.get('/dealers/').then(r => setDealers(r.data))
    api.get('/products/').then(r => setProducts(r.data))
  }, [])

  const confirm = async id => {
    try { await api.post(`/orders/${id}/confirm/`); load() }
    catch (e) { alert(JSON.stringify(e.response?.data?.error)) }
  }

  const deliver = async id => {
    try { await api.post(`/orders/${id}/deliver/`); load() }
    catch (e) { alert(JSON.stringify(e.response?.data?.error)) }
  }

  const addItem = () => setNewOrder(o => ({ ...o, items: [...o.items, { product: '', quantity: 1 }] }))
  const removeItem = i => setNewOrder(o => ({ ...o, items: o.items.filter((_, idx) => idx !== i) }))
  const updateItem = (i, field, val) => setNewOrder(o => {
    const items = [...o.items]; items[i] = { ...items[i], [field]: val }; return { ...o, items }
  })

  const createOrder = async () => {
    try {
      setErr('')
      await api.post('/orders/', {
        dealer: Number(newOrder.dealer),
        notes: newOrder.notes,
        items: newOrder.items.map(it => ({ product: Number(it.product), quantity: Number(it.quantity) }))
      })
      setShowCreate(false)
      setNewOrder({ dealer: '', notes: '', items: [{ product: '', quantity: 1 }] })
      load()
    } catch (e) { setErr(JSON.stringify(e.response?.data)) }
  }

  const inputStyle = { width: '100%', padding: '7px 10px', border: '0.5px solid #d3d1c7', borderRadius: '8px', fontSize: '14px', marginBottom: '8px' }
  const selStyle = { ...inputStyle, background: '#fff' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '500' }}>Orders</h2>
        <button onClick={() => setShowCreate(true)} style={{ padding: '8px 16px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px' }}>+ New order</button>
      </div>

      <div style={{ background: '#fff', border: '0.5px solid #e8e6e0', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <table>
          <thead><tr style={{ borderBottom: '1px solid #e8e6e0' }}>
            {['Order #', 'Dealer', 'Status', 'Total', 'Actions'].map(h =>
              <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '12px', color: '#5F5E5A', fontWeight: '500' }}>{h}</th>
            )}
          </tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} style={{ borderBottom: '0.5px solid #f1efe8', cursor: 'pointer' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: '13px' }} onClick={() => setSelected(selected?.id === o.id ? null : o)}>{o.order_number}</td>
                <td style={{ padding: '10px 16px', fontSize: '14px' }}>{o.dealer_name}</td>
                <td style={{ padding: '10px 16px' }}><StatusBadge status={o.status} /></td>
                <td style={{ padding: '10px 16px', fontSize: '14px' }}>₹{Number(o.total_amount).toLocaleString()}</td>
                <td style={{ padding: '10px 16px', display: 'flex', gap: '8px' }}>
                  {o.status === 'draft' && (
                    <button onClick={() => confirm(o.id)} style={{ padding: '4px 12px', border: '0.5px solid #9FE1CB', borderRadius: '6px', background: '#e1f5ee', fontSize: '13px', color: '#085041' }}>Confirm</button>
                  )}
                  {o.status === 'confirmed' && (
                    <button onClick={() => deliver(o.id)} style={{ padding: '4px 12px', border: '0.5px solid #C0DD97', borderRadius: '6px', background: '#eaf3de', fontSize: '13px', color: '#27500a' }}>Deliver</button>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: '14px' }}>No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div style={{ background: '#fff', border: '0.5px solid #e8e6e0', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontWeight: '500' }}>{selected.order_number} — items</span>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#888' }}>×</button>
          </div>
          <table>
            <thead><tr style={{ borderBottom: '1px solid #e8e6e0' }}>
              {['SKU', 'Product', 'Qty', 'Unit price', 'Line total'].map(h =>
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: '#5F5E5A', fontWeight: '500' }}>{h}</th>
              )}
            </tr></thead>
            <tbody>
              {selected.items?.map(item => (
                <tr key={item.id} style={{ borderBottom: '0.5px solid #f1efe8' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '13px' }}>{item.product_sku}</td>
                  <td style={{ padding: '8px 12px', fontSize: '14px' }}>{item.product_name}</td>
                  <td style={{ padding: '8px 12px', fontSize: '14px' }}>{item.quantity}</td>
                  <td style={{ padding: '8px 12px', fontSize: '14px' }}>₹{Number(item.unit_price).toLocaleString()}</td>
                  <td style={{ padding: '8px 12px', fontSize: '14px', fontWeight: '500' }}>₹{Number(item.line_total).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowCreate(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '500' }}>New order</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#888' }}>×</button>
            </div>
            {err && <div style={{ color: '#A32D2D', fontSize: '13px', marginBottom: '10px' }}>{err}</div>}
            <select style={selStyle} value={newOrder.dealer} onChange={e => setNewOrder({ ...newOrder, dealer: e.target.value })}>
              <option value="">Select dealer...</option>
              {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <input style={inputStyle} placeholder="Notes (optional)" value={newOrder.notes} onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })} />
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#5F5E5A', margin: '8px 0 6px' }}>Items</div>
            {newOrder.items.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 32px', gap: '8px', marginBottom: '6px' }}>
                <select style={{ ...selStyle, marginBottom: 0 }} value={item.product} onChange={e => updateItem(i, 'product', e.target.value)}>
                  <option value="">Product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
                </select>
                <input type="number" min="1" style={{ ...inputStyle, marginBottom: 0 }} value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                <button onClick={() => removeItem(i)} style={{ background: 'none', border: '0.5px solid #f0cece', borderRadius: '6px', color: '#A32D2D', fontSize: '16px' }}>×</button>
              </div>
            ))}
            <button onClick={addItem} style={{ width: '100%', padding: '7px', border: '0.5px dashed #d3d1c7', borderRadius: '8px', background: 'none', fontSize: '13px', color: '#5F5E5A', marginBottom: '12px' }}>+ Add item</button>
            <button onClick={createOrder} style={{ width: '100%', padding: '10px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px' }}>Create order</button>
          </div>
        </div>
      )}
    </div>
  )
}
