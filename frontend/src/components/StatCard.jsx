export default function StatCard({
  label,
  value,
  note,
  icon: Icon,
  accent = "blue",
  detail,
}) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${accent}`}>
          <Icon size={19} />
        </span>
      </div>
      <div className="stat-value">
        {value}
        <span>{detail}</span>
      </div>
      <p>
        <span className={`stat-dot ${accent}`} />
        {note}
      </p>
    </article>
  );
}
