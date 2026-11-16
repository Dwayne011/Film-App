import { useState } from "react";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import { FILMS } from "./films";
import { Status } from "./Stars";

const has = (seen, n) => Object.prototype.hasOwnProperty.call(seen, n);
const FILTERS = [["all", "All 100"], ["todo", "To watch"], ["seen", "Watched"]];
// Filters on the rating you gave. Each test takes the stars (0.5 to 5) or null for "seen, not rated".
const RATINGS = [
  ["any", "Any rating", () => true],
  ["5", "5★", (r) => r === 5],
  ["4", "4★ and up", (r) => r >= 4],
  ["3", "3 to 3.5★", (r) => r >= 3 && r < 4],
  ["low", "Under 3★", (r) => r > 0 && r < 3],
  ["none", "Not rated yet", (r) => !r],
];
const SORTS = [["list", "List order"], ["high", "Highest rated first"], ["low", "Lowest rated first"]];
const on = { bgcolor: "#f4f5ff", color: "#0a0e2c", "&:hover": { bgcolor: "#f4f5ff" } };
const off = { color: "text.secondary", borderColor: "rgba(255,255,255,.22)" };

function Chips({ label, options, value, onPick }) {
  return (
    <div className="filters" role="group" aria-label={label}>
      {options.map(([k, text]) => (
        <Chip key={k} label={text} clickable onClick={() => onPick(k)} aria-pressed={value === k} variant={value === k ? "filled" : "outlined"} sx={value === k ? on : off} />
      ))}
    </div>
  );
}

export default function ListView({ visible, s, onOpenFilm }) {
  const [filter, setFilter] = useState("all");
  const [rating, setRating] = useState("any");
  const [sort, setSort] = useState("list");
  const test = RATINGS.find((r) => r[0] === rating)[2];
  // A rating filter or a rating sort only makes sense for films you've watched, so "To watch" clears them.
  const pickFilter = (k) => { setFilter(k); if (k === "todo") { setRating("any"); setSort("list"); } };
  const pickRating = (k) => { setRating(k); if (k !== "any" && filter === "todo") setFilter("seen"); };
  const pickSort = (k) => { setSort(k); if (k !== "list" && filter === "todo") setFilter("seen"); };

  let rows = FILMS.filter((f) => {
    const seen = has(s.seen, f.n);
    if (filter !== "all" && (filter === "seen") !== seen) return false;
    if (rating !== "any") return seen && test(s.seen[f.n]);
    return true;
  });
  if (sort !== "list") {
    const dir = sort === "high" ? -1 : 1;
    // Rated films in star order (ties keep list order); unrated and unwatched films go to the end.
    const key = (f) => s.seen[f.n] || null;
    rows = [...rows].sort((a, b) => {
      const x = key(a), y = key(b);
      if (x == null || y == null) return (x == null) - (y == null) || a.n - b.n;
      return (x - y) * dir || a.n - b.n;
    });
  }
  return (
    <section className="view" hidden={!visible}>
      <Paper className="listwrap">
        <Chips label="Show" options={FILTERS} value={filter} onPick={pickFilter} />
        <Chips label="Filter by our rating" options={RATINGS} value={rating} onPick={pickRating} />
        <Chips label="Sort" options={SORTS} value={sort} onPick={pickSort} />
        <div className="count">{rows.length} {rows.length === 1 ? "film" : "films"}</div>
        <ul className="rows">
          {rows.length === 0 && <li className="empty">No films match. Try a different rating.</li>}
          {rows.map((f) => (
            <li key={f.n}>
              <button className={"row" + (has(s.seen, f.n) ? " seen" : "") + (s.current === f.n ? " now" : "")} onClick={() => onOpenFilm(f.n)}>
                <span className="n">{f.n}</span>
                <span><span className="ti">{f.title}</span> <span className="yr">{f.year}</span></span>
                {Status({ n: f.n, seen: s.seen, current: s.current }) || <span />}
              </button>
            </li>
          ))}
        </ul>
      </Paper>
    </section>
  );
}
