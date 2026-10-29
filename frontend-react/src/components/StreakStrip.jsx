export default function StreakStrip({ value = 0, today = false, label }) {
  const filled = Math.max(0, Math.min(7, Number(value) || 0))
  const marks = [0, 1, 2, 3, 4, 5, 6]

  return (
    <span
      className="streak"
      role="img"
      aria-label={label || `Chuỗi ${filled} trên 7 ngày`}
    >
      {marks.map((index) => {
        const on = index < filled
        const isToday = today && on && index === filled - 1

        return (
          <i
            key={index}
            data-on={on ? 'true' : undefined}
            data-today={isToday ? 'true' : undefined}
          />
        )
      })}
    </span>
  )
}
