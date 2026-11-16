// Five small stars with half-star support, for lists and cards.
export function Stars({ value }) {
  return (
    <span className="stars" aria-label={`${value || 0} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const f = Math.max(0, Math.min(1, (value || 0) - (i - 1)));
        return <span className="s" key={i}>★<i style={{ width: f * 100 + "%" }}>★</i></span>;
      })}
    </span>
  );
}
// Same thing as an HTML string, for the reveal list which is drawn outside React.
export function starsHTML(r) {
  let h = '<span class="stars">';
  for (let i = 1; i <= 5; i++) { const f = Math.max(0, Math.min(1, (r || 0) - (i - 1))); h += '<span class="s">★<i style="width:' + f * 100 + '%">★</i></span>'; }
  return h + "</span>";
}
export function Status({ n, seen, current }) {
  if (Object.prototype.hasOwnProperty.call(seen, n)) return seen[n] ? <Stars value={seen[n]} /> : <span className="meta">Seen · not rated</span>;
  if (current === n) return <span className="meta gold">Tonight</span>;
  return null;
}
