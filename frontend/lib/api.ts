import { AdvancedSolveOptions, Job, InputType } from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export async function submitSolveJob(
  type: InputType,
  problemText: string,
  recipientEmail: string,
  file: File | null,
  solutionMode: string = "Full Explanation Mode",
  pdfStyle: string = "Clean Academic",
  advancedOptions: AdvancedSolveOptions = {
    curriculum: "General",
    explanationStyle: "University rigorous",
    studentAttempt: "",
    whiteboardNotes: "",
    tutorDepth: "Guided",
    includePractice: true,
    includeTeacherDashboard: true
  }
): Promise<{ job_id: string; status: string }> {
  if (type === "text") {
    const response = await fetch(`${BACKEND_URL}/api/solve/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        problem_text: problemText,
        recipient_email: recipientEmail,
        solution_mode: solutionMode,
        pdf_style: pdfStyle,
        curriculum: advancedOptions.curriculum,
        explanation_style: advancedOptions.explanationStyle,
        student_attempt: advancedOptions.studentAttempt,
        whiteboard_notes: advancedOptions.whiteboardNotes,
        tutor_depth: advancedOptions.tutorDepth,
        include_practice: advancedOptions.includePractice,
        include_teacher_dashboard: advancedOptions.includeTeacherDashboard
      }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to submit text job");
    }
    return response.json();
  } else {
    // For image or audio, use FormData
    const formData = new FormData();
    if (!file) {
      throw new Error(`File is required for ${type} input.`);
    }
    formData.append("file", file);
    formData.append("recipient_email", recipientEmail);
    formData.append("solution_mode", solutionMode);
    formData.append("pdf_style", pdfStyle);
    formData.append("curriculum", advancedOptions.curriculum);
    formData.append("explanation_style", advancedOptions.explanationStyle);
    formData.append("student_attempt", advancedOptions.studentAttempt);
    formData.append("whiteboard_notes", advancedOptions.whiteboardNotes);
    formData.append("tutor_depth", advancedOptions.tutorDepth);
    formData.append("include_practice", String(advancedOptions.includePractice));
    formData.append("include_teacher_dashboard", String(advancedOptions.includeTeacherDashboard));

    const response = await fetch(`${BACKEND_URL}/api/solve/${type}`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || `Failed to submit ${type} job`);
    }
    return response.json();
  }
}

export async function pollJobStatus(jobId: string): Promise<Job> {
  const response = await fetch(`${BACKEND_URL}/api/job/${jobId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch job status");
  }
  return response.json();
}

export async function approveEmail(
  jobId: string,
  recipientEmail?: string,
  titleOverwrite?: string,
  pdfStyle?: string
): Promise<{ status: string; message: string }> {
  const response = await fetch(`${BACKEND_URL}/api/job/${jobId}/approve-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient_email: recipientEmail,
      title_overwrite: titleOverwrite,
      pdf_style: pdfStyle
    })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Failed to approve email");
  }
  return response.json();
}

export async function cancelEmail(
  jobId: string,
  recipientEmail?: string,
  titleOverwrite?: string,
  pdfStyle?: string
): Promise<{ status: string; message: string }> {
  const response = await fetch(`${BACKEND_URL}/api/job/${jobId}/cancel-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient_email: recipientEmail,
      title_overwrite: titleOverwrite,
      pdf_style: pdfStyle
    })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Failed to cancel email");
  }
  return response.json();
}

export function getPdfDownloadUrl(jobId: string, pdfStyle?: string): string {
  if (pdfStyle) {
    return `${BACKEND_URL}/api/pdf/${jobId}?pdf_style=${encodeURIComponent(pdfStyle)}`;
  }
  return `${BACKEND_URL}/api/pdf/${jobId}`;
}
