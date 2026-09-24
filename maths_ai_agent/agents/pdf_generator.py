import os
import uuid
from datetime import datetime
from models.state import AgentState
from services.pdf_service import generate_pdf

def pdf_generator_node(state: AgentState) -> AgentState:
    """Generates the PDF from the solution data."""
    if state.get("error"):
        return state
        
    solution_data = state.get("solution_data")
    if not solution_data:
        return state
        
    # Generate unique filename
    filename = f"math_solution_{datetime.now().strftime('%Y%md_%H%M%S')}_{uuid.uuid4().hex[:6]}.pdf"
    output_path = os.path.join(os.getcwd(), "outputs", "pdfs", filename)
    
    pdf_style = state.get("pdf_style") or "Clean Academic"
    
    try:
        generate_pdf(solution_data, output_path, pdf_style=pdf_style)
        solution_data["pdf_file_name"] = filename
        return {**state, "solution_data": solution_data, "pdf_path": output_path}
    except Exception as e:
        # Fallback to markdown if PDF generation fails
        md_filename = filename.replace(".pdf", ".md")
        md_path = os.path.join(os.getcwd(), "outputs", "backups", md_filename)
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(f"# {solution_data.get('title')}\n\n{solution_data.get('primary_solution')}")
            
        return {**state, "error": f"PDF generation failed: {str(e)}. Saved as Markdown backup at {md_path}."}
