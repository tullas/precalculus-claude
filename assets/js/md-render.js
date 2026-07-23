/**
 * Trajectory.MD — a deliberately small Markdown-to-HTML renderer covering
 * only what mission-brief.md files actually use: #/##/### headers, tables,
 * bold/italic/code inline spans, blockquotes, ordered/unordered lists, and
 * paragraphs. Not a general CommonMark implementation — swap for a real
 * parser if mission briefs grow more complex than this.
 */
const TrajectoryMD = (() => {
  function inline(text) {
    return text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  }

  function render(md) {
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let i = 0;
    let listOpen = null; // 'ul' | 'ol' | null

    function closeList() {
      if (listOpen) { html += `</${listOpen}>`; listOpen = null; }
    }

    while (i < lines.length) {
      const line = lines[i];

      if (/^\s*$/.test(line)) { closeList(); i++; continue; }

      if (/^###\s+/.test(line)) { closeList(); html += `<h3>${inline(line.replace(/^###\s+/, ""))}</h3>`; i++; continue; }
      if (/^##\s+/.test(line))  { closeList(); html += `<h2>${inline(line.replace(/^##\s+/, ""))}</h2>`; i++; continue; }
      if (/^#\s+/.test(line))   { closeList(); html += `<h1>${inline(line.replace(/^#\s+/, ""))}</h1>`; i++; continue; }

      if (/^>\s?/.test(line)) {
        closeList();
        const quoteLines = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { quoteLines.push(lines[i].replace(/^>\s?/, "")); i++; }
        html += `<blockquote>${inline(quoteLines.join(" "))}</blockquote>`;
        continue;
      }

      if (/^\|/.test(line)) {
        closeList();
        const rows = [];
        while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
        const cells = rows.map(r => r.split("|").slice(1, -1).map(c => c.trim()));
        const header = cells[0];
        const body = cells.slice(2); // skip header separator row
        html += "<table><thead><tr>" + header.map(h => `<th>${inline(h)}</th>`).join("") + "</tr></thead><tbody>";
        body.forEach(row => { html += "<tr>" + row.map(c => `<td>${inline(c)}</td>`).join("") + "</tr>"; });
        html += "</tbody></table>";
        continue;
      }

      if (/^\d+\.\s+/.test(line)) {
        if (listOpen !== "ol") { closeList(); html += "<ol>"; listOpen = "ol"; }
        html += `<li>${inline(line.replace(/^\d+\.\s+/, ""))}</li>`;
        i++; continue;
      }
      if (/^[-*]\s+/.test(line)) {
        if (listOpen !== "ul") { closeList(); html += "<ul>"; listOpen = "ul"; }
        html += `<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`;
        i++; continue;
      }

      closeList();
      html += `<p>${inline(line)}</p>`;
      i++;
    }
    closeList();
    return html;
  }

  async function renderInto(url, targetEl) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      targetEl.innerHTML = render(text);
    } catch (e) {
      targetEl.innerHTML = `<p>Mission brief could not be loaded. If you opened this file directly
        (file://), serve the course with <code>python3 -m http.server</code> instead —
        see the project README.</p>`;
    }
  }

  return { render, renderInto };
})();
