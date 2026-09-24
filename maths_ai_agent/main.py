import os
import sys
import io
from dotenv import load_dotenv
from graph import build_graph

# Fix console encoding for Windows
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load environment variables
load_dotenv()

def main():
    print("========================================")
    print("           Maths AI Agent               ")
    print("========================================")
    
    # 1. Ask for input type
    print("Choose input type:")
    print("1. Text")
    print("2. Image")
    print("3. Audio")
    choice = input("Enter choice (1/2/3): ").strip()
    
    input_type = "text"
    if choice == "2":
        input_type = "image"
    elif choice == "3":
        input_type = "audio"
        
    # 2. Enter text or file path
    if input_type == "text":
        content = input("Enter the math problem text: ").strip()
    else:
        content = input(f"Enter the file path for the {input_type}: ").strip()
        if not os.path.exists(content):
            print("Error: File does not exist.")
            return
            
    # 3. Enter recipient email
    email = input("Enter recipient email (or leave blank to skip email): ").strip()
    
    print("\nProcessing... Please wait.\n")
    
    # 4. Trigger workflow
    app = build_graph()
    
    initial_state = {
        "input_type": input_type,
        "input_content": content,
        "user_email": email
    }
    
    # Run the graph
    final_state = app.invoke(initial_state)
    
    # 5. Print success summary
    print("========================================")
    print("           Execution Summary            ")
    print("========================================")
    
    if final_state.get("error"):
        print(f"[!] Error: {final_state['error']}")
    else:
        print(f"[*] Problem Title: {final_state.get('solution_data', {}).get('title')}")
        print(f"[*] Field: {final_state.get('solution_data', {}).get('mathematical_field')}")
        print(f"[*] Difficulty: {final_state.get('solution_data', {}).get('difficulty_label')}")
        print(f"[*] Final Answer: {final_state.get('solution_data', {}).get('final_answer')}")
        
    print(f"[*] PDF Path: {final_state.get('pdf_path', 'Not generated')}")
    print(f"[*] Email Status: {final_state.get('email_status', 'Skipped')}")
    print(f"[*] Google Sheet: {final_state.get('google_sheet_status', 'Unknown')}")
    print("========================================")

if __name__ == "__main__":
    main()
