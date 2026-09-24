/**
 * Utility to parse plain text, markdown, or HTML with bullet points, numbered lists, 
 * Devanagari numbering (क, ख, ग), and roman numbering into clean, styled HTML for official government orders.
 */

export function formatOrderContentToHtml(content: string): string {
  if (!content) return '';

  // If content is already rich HTML containing tags
  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  if (isHtml) {
    // Enhance existing HTML lists with explicit styling to prevent Tailwind resets
    return content
      .replace(/<ul\b[^>]*>/gi, '<ul style="list-style-type: disc !important; padding-left: 28px !important; margin: 10px 0 !important;">')
      .replace(/<ol\b[^>]*>/gi, '<ol style="list-style-type: decimal !important; padding-left: 28px !important; margin: 10px 0 !important;">')
      .replace(/<li\b[^>]*>/gi, '<li style="display: list-item !important; margin-bottom: 6px !important; padding-left: 4px !important; line-height: 1.65 !important; text-align: justify !important;">');
  }

  // If content is plain text, intelligently parse lines into paragraphs, bullet lists, and numbered lists
  const lines = content.split(/\r?\n/);
  const result: string[] = [];
  let inUnorderedList = false;
  let inOrderedList = false;

  const closeOpenLists = () => {
    if (inUnorderedList) {
      result.push('</ul>');
      inUnorderedList = false;
    }
    if (inOrderedList) {
      result.push('</ol>');
      inOrderedList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      closeOpenLists();
      result.push('<p style="margin-bottom: 8px;"><br/></p>');
      continue;
    }

    // Check for bullet list (•, -, *, ‣, ▪, ⁃)
    const bulletMatch = trimmed.match(/^([•\-\*‣▪⁃]|\(?[•\-\*]\)?)\s+(.*)$/);
    if (bulletMatch) {
      if (inOrderedList) closeOpenLists();
      if (!inUnorderedList) {
        result.push('<ul style="list-style-type: disc !important; padding-left: 28px !important; margin: 10px 0 !important;">');
        inUnorderedList = true;
      }
      result.push(`<li style="display: list-item !important; margin-bottom: 6px !important; padding-left: 4px !important; line-height: 1.65 !important; text-align: justify !important;">${bulletMatch[2]}</li>`);
      continue;
    }

    // Check for numbered list (1., 1), (1), (क), क., (i), i.)
    const numberMatch = trimmed.match(/^(\d+[\.\)]|\(\d+\)|\([क-हa-zivx]+\)|[क-हa-zivx]+[\.\)])\s+(.*)$/i);
    if (numberMatch) {
      if (inUnorderedList) closeOpenLists();
      if (!inOrderedList) {
        result.push('<ol style="list-style-type: decimal !important; padding-left: 28px !important; margin: 10px 0 !important;">');
        inOrderedList = true;
      }
      result.push(`<li style="display: list-item !important; margin-bottom: 6px !important; padding-left: 4px !important; line-height: 1.65 !important; text-align: justify !important;"><strong>${numberMatch[1]}</strong> ${numberMatch[2]}</li>`);
      continue;
    }

    // Normal paragraph
    closeOpenLists();
    result.push(`<p style="margin-bottom: 10px; line-height: 1.75; text-align: justify; text-justify: inter-word;">${trimmed}</p>`);
  }

  closeOpenLists();
  return result.join('\n');
}
