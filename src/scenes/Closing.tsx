// The site's closing, under the topic map: the sources
// the story and the map cite, then the one-line note every page ends with.
// The nav's "Sources" links here. Each chapter lists its own.
import { source, sourceNumber } from "../model/sources";
import { storySources } from "../model/story";

export function Closing() {
  return (
    <section className="scene closing" id="sources" aria-label="Sources">
      <div className="step-marker" data-step="sources" style={{ top: 0, height: "100%" }} aria-hidden="true" />
      <div className="closing-sources">
        <h2>Sources for the story and the chapter list</h2>
        <ol>
          {storySources().map((id) => {
            const s = source(id);
            return (
              <li key={id} value={sourceNumber(id)}>
                {s.title}, {s.where}.{" "}
                <a href={s.url} target="_blank" rel="noreferrer">
                  {new URL(s.url).host}
                </a>
              </li>
            );
          })}
        </ol>
        <p>Each chapter lists its own sources at its end.</p>
      </div>
      <footer className="map-footer">
        <p>
          A personal project based on public specifications. Not affiliated with or endorsed by any employer or vendor.
        </p>
        <p>
          To see the version without motion, open <a href="?static">the static page</a>.
        </p>
      </footer>
    </section>
  );
}
