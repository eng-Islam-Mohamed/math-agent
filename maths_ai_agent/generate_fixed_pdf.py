import os
import json
from services.pdf_service import generate_pdf

def regenerate():
    backup_file = "e:/Math Agent/maths_ai_agent/outputs/backups/backup_202606d_135518.json"
    with open(backup_file, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    solution_data = data["state"]["solution_data"]
    output_path = "e:/Math Agent/maths_ai_agent/outputs/pdfs/math_solution_202606d_135513_1bd3b1_fixed.pdf"
    
    generate_pdf(solution_data, output_path)
    print(f"Fixed PDF generated at: {output_path}")

if __name__ == "__main__":
    regenerate()
