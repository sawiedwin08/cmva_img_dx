export default function Alert({ type = 'danger', message, onClose }) {
  if (!message) return null
  const icons = { success: 'circle-check', danger: 'circle-exclamation', warning: 'triangle-exclamation', info: 'circle-info' }
  return (
    <div className={`alert alert-${type} alert-dismissible fade show`} role="alert">
      <i className={`fa-solid fa-${icons[type] ?? 'circle-info'} me-2`} />
      {message}
      {onClose && (
        <button type="button" className="btn-close" onClick={onClose} />
      )}
    </div>
  )
}
