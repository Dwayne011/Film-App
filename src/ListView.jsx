import { useState } from "react";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import ClearRounded from "@mui/icons-material/ClearRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
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
// Search ignores capitals, accents and punctuation, so "amelie" finds Amélie and "walle" finds WALL·E.
const plain = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const squash = (t) => plain(t).replace(/ /g, "");
const INDEX = FILMS.map((f) => ({ words: plain(f.title), tight: squash(f.title) }));
// Matches a title, a list number ("47") or a year ("2007").
function matches(f, q) {
  const p = plain(q); if (!p) return true;
  if (/^\d+$/.test(p) && (String(f.n) === p || String(f.year) === p)) return true;
  const ix = INDEX[f.n - 1];
  return p.split(" ").every((w) => ix.words.includes(w)) || ix.tight.includes(squash(q));
}
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
  const [query, setQuery] = useState("");
  const test = RATINGS.find((r) => r[0] === rating)[2];
  // A rating filter or a rating sort only makes sense for films you've watched, so "To watch" clears them.
  const pickFilter = (k) => { setFilter(k); if (k === "todo") { setRating("any"); setSort("list"); } };
  const pickRating = (k) => { setRating(k); if (k !== "any" && filter === "todo") setFilter("seen"); };
  const pickSort = (k) => { setSort(k); if (k !== "list" && filter === "todo") setFilter("seen"); };

  let rows = FILMS.filter((f) => {
    if (!matches(f, query)) return false;
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
      <Paper className="listwrap chrome">
        <div className="search">
          <TextField id="film-search" type="search" placeholder="Search films by name, number or year" value={query} onChange={(e) => setQuery(e.target.value)}
            fullWidth size="small" autoComplete="off"
            slotProps={{
              htmlInput: { "aria-label": "Search films", enterKeyHint: "search" },
              input: {
                startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment>,
                endAdornment: query ? <InputAdornment position="end"><IconButton aria-label="Clear search" size="small" onClick={() => setQuery("")} sx={{ width: 32, height: 32 }}><ClearRounded fontSize="small" /></IconButton></InputAdornment> : null,
              },
            }} />
        </div>
        <Chips label="Show" options={FILTERS} value={filter} onPick={pickFilter} />
        <Chips label="Filter by our rating" options={RATINGS} value={rating} onPick={pickRating} />
        <Chips label="Sort" options={SORTS} value={sort} onPick={pickSort} />
        <div className="count">{rows.length} {rows.length === 1 ? "film" : "films"}</div>
        <ul className="rows">
          {rows.length === 0 && <li className="empty">{query.trim() ? (filter !== "all" || rating !== "any" ? "No films match that search with these filters. Try \"All 100\" and \"Any rating\"." : "No films match that search.") : "No films match. Try a different rating."}</li>}
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
