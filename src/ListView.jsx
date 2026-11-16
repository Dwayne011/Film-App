import { useState } from "react";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import { FILMS } from "./films";
import { Status } from "./Stars";

const has = (seen, n) => Object.prototype.hasOwnProperty.call(seen, n);
const FILTERS = [["all", "All 100"], ["todo", "To watch"], ["seen", "Watched"]];

export default function ListView({ visible, s, onOpenFilm }) {
  const [filter, setFilter] = useState("all");
  const rows = FILMS.filter((f) => filter === "all" || (filter === "seen") === has(s.seen, f.n));
  return (
    <section className="view" hidden={!visible}>
      <Paper className="listwrap">
        <div className="filters" role="group" aria-label="Filter films">
          {FILTERS.map(([k, label]) => (
            <Chip key={k} label={label} clickable onClick={() => setFilter(k)} aria-pressed={filter === k}
              variant={filter === k ? "filled" : "outlined"}
              sx={filter === k ? { bgcolor: "#f4f5ff", color: "#0a0e2c", "&:hover": { bgcolor: "#f4f5ff" } } : { color: "text.secondary", borderColor: "rgba(255,255,255,.22)" }} />
          ))}
        </div>
        <ul className="rows">
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
