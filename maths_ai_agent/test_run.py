import os
import sys
import io
from dotenv import load_dotenv
from graph import build_graph

# Fix console encoding for Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

def main():
    if len(sys.argv) < 3:
        print("Usage: python test_run.py <problem_text> <email>")
        return
        
    problem_text = sys.argv[1]
    email = sys.argv[2]
    
    app = build_graph()
    
    initial_state = {
        "input_type": "text",
        "input_content": problem_text,
        "user_email": email
    }
    
    print(f"Running agent for problem: {problem_text}")
    print(f"Sending to: {email}")
    final_state = app.invoke(initial_state)
    
    print("\n--- RESULTS ---")
    if final_state.get("error"):
        print(f"Error: {final_state['error']}")
    else:
        print(f"Title: {final_state.get('solution_data', {}).get('title')}")
        print(f"Final Answer: {final_state.get('solution_data', {}).get('final_answer')}")
        
    print(f"Verification: {final_state.get('verification_status')}")
    print(f"PDF Path: {final_state.get('pdf_path')}")
    print(f"Email Status: {final_state.get('email_status')}")
    print(f"Sheet Status: {final_state.get('google_sheet_status')}")

if __name__ == "__main__":
    main()
