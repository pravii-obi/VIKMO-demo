const styles = {
  draft:     { background: '#faeeda', color: '#633806' },
  confirmed: { background: '#e1f5ee', color: '#085041' },
  delivered: { background: '#eaf3de', color: '#27500a' },
}

export default function StatusBadge({ status }) {
  const s = styles[status] || { background: '#f1efe8', color: '#444441' }
  return (
    <span style={{
      ...s, padding: '2px 10px', borderRadius: '20px',
      fontSize: '12px', fontWeight: '500', textTransform: 'capitalize'
    }}>
      {status}
    </span>
  )
}
