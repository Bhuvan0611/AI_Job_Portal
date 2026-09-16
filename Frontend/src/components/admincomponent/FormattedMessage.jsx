import React from "react";

// Helper to format inline elements: **bold**, `code`, *italic*
const formatInlineText = (text) => {
  if (!text) return text;

  // Split by inline code first: `code`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, pIdx) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      const codeContent = part.slice(1, -1);
      return (
        <code
          key={pIdx}
          className="px-1.5 py-0.5 mx-0.5 bg-purple-100/70 text-purple-800 rounded font-mono text-xs border border-purple-200"
        >
          {codeContent}
        </code>
      );
    }

    // Split by bold: **bold**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bPart, bIdx) => {
      if (bPart.startsWith("**") && bPart.endsWith("**")) {
        const boldContent = bPart.slice(2, -2);
        return (
          <strong key={`${pIdx}-${bIdx}`} className="font-semibold text-gray-900">
            {boldContent}
          </strong>
        );
      }

      // Split by italic: *italic*
      const italicParts = bPart.split(/(\*[^*]+\*)/g);
      return italicParts.map((iPart, iIdx) => {
        if (iPart.startsWith("*") && iPart.endsWith("*")) {
          return (
            <em key={`${pIdx}-${bIdx}-${iIdx}`} className="italic text-gray-600">
              {iPart.slice(1, -1)}
            </em>
          );
        }
        return iPart;
      });
    });
  });
};

const FormattedMessage = ({ content }) => {
  if (!content) return null;

  const lines = content.split("\n");
  const elements = [];
  let tableRows = [];
  let inTable = false;

  const flushTable = (key) => {
    if (tableRows.length > 0) {
      // First row is header, second is separator (---), rest are body
      const headerRow = tableRows[0];
      const bodyRows = tableRows.slice(2);

      elements.push(
        <div key={key} className="overflow-x-auto my-2.5 rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
            <thead className="bg-purple-50 text-purple-900 font-semibold">
              <tr>
                {headerRow.map((cell, cIdx) => (
                  <th key={cIdx} className="px-3 py-2">
                    {formatInlineText(cell.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-gray-50/70">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 text-gray-700">
                      {formatInlineText(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check if table row: | col1 | col2 |
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable(`table-${i}`);
    }

    // Empty line
    if (!trimmed) {
      elements.push(<div key={`blank-${i}`} className="h-1.5" />);
      continue;
    }

    // Heading: ### or ##
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4
          key={`h4-${i}`}
          className="text-sm font-bold text-purple-950 mt-2 mb-1.5 flex items-center gap-1.5 pb-1 border-b border-purple-100"
        >
          {formatInlineText(trimmed.replace("### ", ""))}
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-base font-bold text-gray-900 mt-2.5 mb-1.5 pb-1 border-b border-gray-200"
        >
          {formatInlineText(trimmed.replace("## ", ""))}
        </h3>
      );
      continue;
    }

    // Blockquote: > text
    if (trimmed.startsWith("> ")) {
      elements.push(
        <div
          key={`quote-${i}`}
          className="border-l-4 border-purple-500 bg-purple-50/80 p-2.5 rounded-r text-xs text-purple-950 my-2 font-medium leading-relaxed"
        >
          {formatInlineText(trimmed.replace("> ", ""))}
        </div>
      );
      continue;
    }

    // Nested bullet points (e.g. "  - ...")
    if (rawLine.startsWith("  - ") || rawLine.startsWith("    - ")) {
      elements.push(
        <div key={`subbullet-${i}`} className="flex items-start gap-1.5 ml-5 my-0.5 text-xs text-gray-600">
          <span className="text-purple-400 select-none">•</span>
          <span className="flex-1 leading-relaxed">
            {formatInlineText(trimmed.replace(/^[-*•]\s*/, ""))}
          </span>
        </div>
      );
      continue;
    }

    // Top-level bullet points: • or - or *
    if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const cleanText = trimmed.replace(/^[•\-*]\s+/, "");
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2 my-1 text-xs text-gray-700">
          <span className="text-purple-600 font-bold select-none text-sm leading-4">•</span>
          <span className="flex-1 leading-relaxed">{formatInlineText(cleanText)}</span>
        </div>
      );
      continue;
    }

    // Numbered list: "1. ", "2. "
    const numberMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numberMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 my-1 text-xs text-gray-700">
          <span className="font-semibold text-purple-700 select-none">{numberMatch[1]}.</span>
          <span className="flex-1 leading-relaxed">{formatInlineText(numberMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="text-xs text-gray-700 my-0.5 leading-relaxed">
        {formatInlineText(trimmed)}
      </p>
    );
  }

  // Flush remaining table if ended on table
  if (inTable) {
    flushTable("table-end");
  }

  return <div className="space-y-0.5 text-xs">{elements}</div>;
};

export default FormattedMessage;
