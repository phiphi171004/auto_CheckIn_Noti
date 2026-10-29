/* The mark is the product's own signature: seven streak marks, four of them filled. */
export default function PiggiMark({ size = 34 }) {
  const bars = [0, 1, 2, 3, 4, 5, 6]

  return (
    <svg
      viewBox="0 0 39 24"
      width={size}
      height={Math.round((size * 24) / 39)}
      className="brand-mark"
      aria-hidden="true"
      focusable="false"
    >
      {bars.map((index) => (
        <rect
          key={index}
          x={index * 6}
          y="3"
          width="3"
          height="18"
          rx="1.5"
          fill="currentColor"
          opacity={index < 4 ? 1 : 0.22}
        />
      ))}
    </svg>
  )
}
