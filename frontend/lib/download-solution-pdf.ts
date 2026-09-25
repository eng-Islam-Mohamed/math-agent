import katex from "katex";
import type { DemoResult } from "./demo-result";
import { textDirection } from "./text-direction";

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

function mathHtml(text: string): string {
  const normalized = text.replace(/\\\[/g, () => "$$").replace(/\\\]/g, () => "$$").replace(/\\\(/g, () => "$").replace(/\\\)/g, () => "$");
  return normalized.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g).map((token) => {
    if (token.startsWith("$$") && token.endsWith("$$")) {
      return `<div dir="ltr" style="direction:ltr;text-align:center">${katex.renderToString(token.slice(2, -2), { displayMode: true, throwOnError: false })}</div>`;
    }
    if (token.startsWith("$") && token.endsWith("$")) {
      return `<span dir="ltr" style="direction:ltr;display:inline-block">${katex.renderToString(token.slice(1, -1), { throwOnError: false })}</span>`;
    }
    return escapeHtml(token).replace(/\n/g, "<br>");
  }).join("");
}

function section(root: HTMLElement, title: string, body: string, direction: "ltr" | "rtl" = "ltr") {
  const card = document.createElement("section");
  card.dataset.pdfSection = "true";
  card.style.cssText = "box-sizing:border-box;width:100%;padding:16px 18px;margin:0 0 12px;border:1px solid #d4dce8;border-radius:9px;background:#fff;color:#142033;";
  const heading = document.createElement("div");
  heading.textContent = title;
  heading.style.cssText = "font:700 13px Arial,sans-serif;color:#245398;text-transform:uppercase;margin-bottom:9px;";
  const content = document.createElement("div");
  content.dir = direction;
  content.innerHTML = body;
  content.style.cssText = "font:14px/1.65 Tahoma,Arial,sans-serif;color:#142033;overflow-wrap:anywhere;";
  card.append(heading, content);
  root.append(card);
}

export async function downloadSolutionPdf(result: DemoResult): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  await document.fonts.ready;
  const root = document.createElement("div");
  root.style.cssText = "position:fixed;left:0;top:0;z-index:2147483647;box-sizing:border-box;width:794px;max-width:none;padding:24px;background:#fff;color:#142033;font-family:Tahoma,Arial,sans-serif;";
  try {
    section(root, "Math Agent · Solution", `<strong>${mathHtml(result.solution.title)}</strong><br>${escapeHtml(result.selected.solutionMode)} · ${escapeHtml(result.selected.curriculum)} · ${escapeHtml(result.selected.explanationStyle)}`, textDirection(result.solution.title));
    section(root, "Problem", mathHtml(result.cleanedProblem), textDirection(result.cleanedProblem));
    section(root, "Summary", mathHtml(result.solution.summary), textDirection(result.solution.summary));
    result.solution.steps.forEach((step, index) => section(root, `Step ${index + 1}`, mathHtml(step), textDirection(step)));
    section(root, "Final answer", mathHtml(result.solution.answer), textDirection(result.solution.answer));
    section(root, "Independent AI review", mathHtml(result.review.note), textDirection(result.review.note));
    section(root, `Curriculum · ${result.selected.curriculum}`, `${mathHtml(result.learning.curriculumGoal)}<br>${mathHtml(result.learning.methodGuidance)}`, textDirection(result.learning.curriculumGoal));
    result.learning.tutorHints.forEach((hint, index) => section(root, `Tutor hint ${index + 1} · ${result.selected.tutorDepth}`, `${mathHtml(hint.prompt)}<br><em>${mathHtml(hint.rescueHint)}</em>`, textDirection(hint.prompt)));
    if (result.selected.hasStudentAttempt) section(root, "Student attempt diagnosis", `First wrong step: ${mathHtml(result.learning.firstWrongStep)}<br>Why: ${mathHtml(result.learning.misconception)}<br>Correction: ${mathHtml(result.learning.correctedStep)}<br>Prevention: ${mathHtml(result.learning.preventionTip)}`, textDirection(result.learning.firstWrongStep));
    if (result.selected.hasWhiteboardNotes) section(root, "Whiteboard feedback", mathHtml(result.learning.whiteboardFeedback), textDirection(result.learning.whiteboardFeedback));
    if (result.selected.solutionMode === "Teacher Mode") section(root, "Teacher guide", `Grading focus: ${result.learning.teacherGradingFocus.map(mathHtml).join("; ")}<br>Common mistakes: ${result.learning.teacherCommonMistakes.map(mathHtml).join("; ")}<br>Discussion: ${mathHtml(result.learning.teacherDiscussionQuestion)}`, textDirection(result.learning.teacherDiscussionQuestion));
    section(root, "Practice", `${mathHtml(result.learning.practiceProblem)}<br>Answer: ${mathHtml(result.learning.practiceAnswer)}`, textDirection(result.learning.practiceProblem));
    document.body.append(root);

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 12;
    const contentWidth = 210 - margin * 2;
    const contentBottom = 297 - margin;
    let y = margin;
    for (const card of Array.from(root.querySelectorAll<HTMLElement>("[data-pdf-section]"))) {
      const canvas = await html2canvas(card, { scale: 1.5, backgroundColor: "#ffffff", logging: false, useCORS: true });
      const mmPerPixel = contentWidth / canvas.width;
      const imageHeight = canvas.height * mmPerPixel;
      if (y + imageHeight > contentBottom && y > margin) { pdf.addPage(); y = margin; }
      let offset = 0;
      while (offset < canvas.height) {
        const remainingMm = contentBottom - y;
        const sliceHeight = Math.min(canvas.height - offset, Math.max(1, Math.floor(remainingMm / mmPerPixel)));
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceHeight;
        slice.getContext("2d")?.drawImage(canvas, 0, offset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", margin, y, contentWidth, sliceHeight * mmPerPixel);
        y += sliceHeight * mmPerPixel + 4;
        offset += sliceHeight;
        if (offset < canvas.height) { pdf.addPage(); y = margin; }
      }
    }
    const pages = pdf.getNumberOfPages();
    for (let page = 1; page <= pages; page++) {
      pdf.setPage(page);
      pdf.setFontSize(9);
      pdf.setTextColor(100, 110, 130);
      pdf.text(`Math Agent · ${page}/${pages}`, 210 - margin, 292, { align: "right" });
    }
    pdf.save("math-agent-solution.pdf");
  } finally {
    root.remove();
  }
}
