export default function EmptyState({ title, copy, action }) {
  return (
    <div className="empty">
      <div>
        <p className="empty-title">{title}</p>
        {copy ? <p className="empty-copy">{copy}</p> : null}
        {action}
      </div>
    </div>
  )
}
