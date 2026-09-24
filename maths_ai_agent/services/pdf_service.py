import os
from datetime import datetime
from playwright.sync_api import sync_playwright

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ title }}</title>
    <!-- Include KaTeX for math rendering -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}, {left: '\\\\(', right: '\\\\)', display: false}, {left: '\\\\[', right: '\\\\]', display: true}]});"></script>
    <style>
        body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #2c3e50; margin-top: 15px; }
        .box { background-color: #f8f9fa; padding: 20px; border-left: 4px solid #3498db; margin-bottom: 20px; border-radius: 4px; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 0.85em; font-weight: bold; color: white; }
        
        .badge-very-high { background-color: #2ecc71; }
        .badge-high { background-color: #27ae60; }
        .badge-medium { background-color: #f39c12; }
        .badge-low { background-color: #e67e22; }
        .badge-very-low { background-color: #e74c3c; }
        
        .badge-risk-low { background-color: #2ecc71; }
        .badge-risk-medium { background-color: #f39c12; }
        .badge-risk-high { background-color: #e74c3c; }

        .chip { display: inline-block; background-color: #e2e8f0; color: #475569; padding: 2px 8px; border-radius: 9999px; font-size: 0.8em; font-weight: bold; margin-right: 5px; margin-bottom: 5px; }
        .mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .mini-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: rgba(255,255,255,0.55); }
        .mini-card h4 { margin: 0 0 6px 0; color: inherit; }

        .final-answer { margin-top: 30px; padding: 15px; border: 2px solid #2ecc71; border-radius: 8px; background-color: #f0fff4; font-weight: bold; }
        .footer { margin-top: 50px; font-size: 0.85em; color: #7f8c8d; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }

        /* Styles */
        body.style-clean-academic { color: #1e293b; background-color: #fcfcfd; }
        body.style-clean-academic h1 { color: #1e3a8a; border-bottom: 2px solid #3b82f6; }
        body.style-clean-academic .box { background-color: #fff; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; }

        body.style-luxury-dark { color: #f8fafc; background-color: #0b0f19; }
        body.style-luxury-dark h1 { color: #38bdf8; border-bottom: 2px solid #0284c7; }
        body.style-luxury-dark h2 { color: #7dd3fc; }
        body.style-luxury-dark h3 { color: #38bdf8; }
        body.style-luxury-dark .box { background-color: #111827; border: 1px solid #1f2937; border-left: 4px solid #38bdf8; border-radius: 8px; padding: 20px; }
        body.style-luxury-dark .final-answer { border-color: #34d399 !important; background-color: #064e3b !important; color: #a7f3d0 !important; }
        body.style-luxury-dark .chip { background-color: #374151 !important; color: #f3f4f6 !important; }
        body.style-luxury-dark .mini-card { background-color: #0f172a; border-color: #1f2937; }
        body.style-luxury-dark .footer { border-top: 1px solid #1f2937; color: #4b5563; }

        body.style-exam-sheet { color: #000; font-family: 'Times New Roman', serif; }
        body.style-exam-sheet h1 { text-align: center; border-bottom: 3px double #000; text-transform: uppercase; }
        body.style-exam-sheet .box { border: 1px solid #000; background: none; border-radius: 0; padding: 15px; border-left: 1px solid #000; }
        body.style-exam-sheet .final-answer { border: 2px solid #000; background: none; border-radius: 0; color: #000; }
        body.style-exam-sheet .chip { border: 1px solid #000; background: none; border-radius: 0; color: #000; }
        body.style-exam-sheet .mini-card { border: 1px solid #000; border-radius: 0; background: none; }

        body.style-professor-notes { color: #2d3748; background-color: #fffaf0; }
        body.style-professor-notes h1 { color: #744210; border-bottom: 2px solid #d69e2e; }
        body.style-professor-notes h2 { color: #975a16; }
        body.style-professor-notes .box { background-color: #fffdf5; border: 1px dashed #d69e2e; border-left: 4px solid #d69e2e; border-radius: 6px; padding: 20px; }
        body.style-professor-notes .chip { background-color: #fef3c7; color: #975a16; }
        body.style-professor-notes .mini-card { background-color: #fffdf5; border-color: #d69e2e; }

        body.style-minimal-latex { color: #000; font-family: 'Latin Modern Roman', 'Georgia', serif; }
        body.style-minimal-latex h1 { font-weight: normal; border-bottom: 1px solid #ccc; text-align: center; }
        body.style-minimal-latex .box { border: none; padding: 0; background: none; border-left: none; margin-bottom: 25px; }
        body.style-minimal-latex .final-answer { border: none; border-top: 1px solid #000; border-bottom: 1px solid #000; background: none; border-radius: 0; }
        body.style-minimal-latex .chip { background: none; border: none; font-style: italic; }
        body.style-minimal-latex .mini-card { border: none; border-top: 1px solid #ccc; border-radius: 0; background: none; }
        @media print { .mini-grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body class="style-{{ style_class }}">
    <h1>{{ title }}</h1>
    
    <div style="font-size: 0.9em; margin-bottom: 20px;">
        <strong>Mode:</strong> {{ mode }} | <strong>Style:</strong> {{ style_label }}
    </div>

    <h2>Mathematical Classification</h2>
    <div class="box">
        <p><strong>Field:</strong> {{ field }}</p>
        <p><strong>Detailed Branch:</strong> {{ branch }}</p>
        <p><strong>Topic:</strong> {{ topic }}</p>
        <p><strong>Academic Level:</strong> {{ academic_level }}</p>
        <p><strong>Typical Course:</strong> {{ typical_course }}</p>
        {% if prerequisites %}
        <p><strong>Prerequisites:</strong> {{ prerequisites }}</p>
        {% endif %}
        {% if tags %}
        <p><strong>Tags:</strong>
            {% for tag in tags %}
            <span class="chip">{{ tag }}</span>
            {% endfor %}
        </p>
        {% endif %}
    </div>

    <h2>Proof Confidence & Verification</h2>
    <div class="box">
        <p><strong>Confidence Score:</strong> {{ confidence_score }}/100 (<span class="badge badge-{{ confidence_class }}">{{ confidence_label }}</span>)</p>
        <p><strong>Risk Level:</strong> <span class="badge badge-risk-{{ risk_class }}">{{ risk_level }}</span></p>
        <p><strong>Verification Method:</strong> {{ verification_method }}</p>
        <p><strong>Explanation:</strong> {{ verification_explanation }}</p>
        {% if counterexample_search %}
        <p><strong>Counterexample Search:</strong> {{ counterexample_search }}</p>
        {% endif %}
        {% if weak_points %}
        <p><strong>Potential Weak Reasoning Points:</strong></p>
        <ul>
            {% for wp in weak_points %}
            <li>{{ wp }}</li>
            {% endfor %}
        </ul>
        {% endif %}
    </div>

    {% if evidence_checks %}
    <h2>Evidence Report</h2>
    <div class="mini-grid">
        {% for check in evidence_checks %}
        <div class="mini-card">
            <h4>{{ check.label }}</h4>
            <p><strong>Status:</strong> {{ check.status }}</p>
            <p>{{ check.evidence }}</p>
        </div>
        {% endfor %}
    </div>
    {% endif %}

    {% if mistake_diagnosis %}
    <h2>Mistake Diagnosis</h2>
    <div class="box">
        <p><strong>Attempt Summary:</strong> {{ mistake_diagnosis.submitted_attempt_summary }}</p>
        <p><strong>First Error:</strong> {{ mistake_diagnosis.first_error_location }}</p>
        <p><strong>Misconception:</strong> {{ mistake_diagnosis.misconception }}</p>
        <p><strong>Corrected Step:</strong> {{ mistake_diagnosis.corrected_step }}</p>
        <p><strong>Prevention Tip:</strong> {{ mistake_diagnosis.prevention_tip }}</p>
    </div>
    {% endif %}

    {% if socratic_tutor %}
    <h2>Socratic Tutor Path</h2>
    <div class="box">
        <ol>
            {% for item in socratic_tutor %}
            <li>
                <strong>{{ item.prompt }}</strong><br>
                Expected move: {{ item.expected_student_move }}<br>
                Rescue hint: {{ item.rescue_hint }}
            </li>
            {% endfor %}
        </ol>
    </div>
    {% endif %}

    <h2>Problem Description</h2>
    <div class="box">
        {{ problem }}
    </div>

    <h2>Primary Solution</h2>
    <div class="box">
        {{ solution }}
    </div>

    <h2>Final Answer</h2>
    <div class="final-answer">
        {{ answer }}
    </div>

    {% if alternative_solutions %}
    <h2>Alternative Solutions</h2>
    {% for alt in alternative_solutions %}
    <div class="box">
        <h3>{{ alt.title }} (Method: {{ alt.method }})</h3>
        <p><strong>When to use:</strong> {{ alt.when_to_use }}</p>
        <p><strong>Elegance Score:</strong> {{ alt.elegance_score }}/5</p>
        <div style="margin-top: 10px;">
            {{ alt.solution_html }}
        </div>
    </div>
    {% endfor %}
    {% endif %}

    {% if solver_debate %}
    <h2>Multi-Agent Review Debate</h2>
    <div class="mini-grid">
        {% for entry in solver_debate %}
        <div class="mini-card">
            <h4>{{ entry.agent }} - {{ entry.confidence }}/100</h4>
            <p>{{ entry.position }}</p>
            <p><strong>Concern:</strong> {{ entry.concern }}</p>
        </div>
        {% endfor %}
    </div>
    <p>{{ consensus_notes }}</p>
    {% endif %}

    {% if solution_quality_rubric %}
    <h2>Solution Quality Rubric</h2>
    <div class="mini-grid">
        {% for item in solution_quality_rubric %}
        <div class="mini-card">
            <h4>{{ item.criterion }} - {{ item.score }}/5</h4>
            <p>{{ item.comment }}</p>
        </div>
        {% endfor %}
    </div>
    {% endif %}

    {% if generated_practice %}
    <h2>Generated Practice Set</h2>
    <div class="mini-grid">
        {% for item in generated_practice %}
        <div class="mini-card">
            <h4>{{ item.level }}</h4>
            <p>{{ item.problem }}</p>
            <p><strong>Target skill:</strong> {{ item.target_skill }}</p>
            <p><strong>Answer check:</strong> {{ item.answer_check }}</p>
        </div>
        {% endfor %}
    </div>
    {% endif %}

    {% if curriculum_alignment %}
    <h2>Curriculum Alignment</h2>
    <div class="box">
        <p><strong>Selected Curriculum:</strong> {{ curriculum_alignment.selected_curriculum }}</p>
        <p><strong>Learning Goal:</strong> {{ curriculum_alignment.standard_like_goal }}</p>
        <p><strong>Allowed Methods:</strong> {{ curriculum_alignment.allowed_methods | join(", ") }}</p>
        <p><strong>Notation Expectations:</strong> {{ curriculum_alignment.notation_expectations }}</p>
    </div>
    {% endif %}

    {% if teacher_dashboard %}
    <h2>Teacher Dashboard Snapshot</h2>
    <div class="box">
        <p><strong>Grading Focus:</strong> {{ teacher_dashboard.grading_focus | join(", ") }}</p>
        <p><strong>Common Misconceptions:</strong> {{ teacher_dashboard.common_misconceptions | join(", ") }}</p>
        <p><strong>Intervention Plan:</strong> {{ teacher_dashboard.intervention_plan | join(" / ") }}</p>
        <p><strong>Class Prompt:</strong> {{ teacher_dashboard.class_discussion_prompt }}</p>
    </div>
    {% endif %}

    <div class="footer">
        Generated by {{ app_name }} on {{ date }}
    </div>
</body>
</html>
"""

def generate_pdf(solution_data: dict, output_path: str, pdf_style: str = "Clean Academic"):
    """Generates a professional PDF from the solution data using Playwright."""
    from jinja2 import Template
    import markdown
    import subprocess
    
    # Auto-install Chromium if not present
    try:
        from playwright._impl._driver import compute_driver_executable
        driver_exec = compute_driver_executable()
    except Exception:
        pass
    try:
        subprocess.run(
            ["python", "-m", "playwright", "install", "chromium"],
            capture_output=True, timeout=120
        )
    except Exception:
        pass
    
    template = Template(HTML_TEMPLATE)
    
    # Map label to css class
    conf_label = solution_data.get("confidence_label", "Medium").lower()
    if "very high" in conf_label:
        conf_class = "very-high"
    elif "high" in conf_label:
        conf_class = "high"
    elif "very low" in conf_label:
        conf_class = "very-low"
    elif "low" in conf_label:
        conf_class = "low"
    else:
        conf_class = "medium"

    risk_label = solution_data.get("risk_level", "Medium").lower()
    if "low" in risk_label:
        risk_class = "low"
    elif "high" in risk_label:
        risk_class = "high"
    else:
        risk_class = "medium"
        
    style_class = pdf_style.lower().replace(" ", "-")

    def md_to_html(text):
        """Convert markdown to HTML while preserving LaTeX math delimiters."""
        if not text:
            return ""
        import re
        math_blocks = []
        def protect_math(match):
            math_blocks.append(match.group(0))
            return f'MATH_PLACEHOLDER_{len(math_blocks) - 1}_END'
        
        protected = re.sub(r'\$\$[\s\S]*?\$\$', protect_math, text)
        protected = re.sub(r'\$[^$]+?\$', protect_math, protected)
        protected = re.sub(r'\\\[[\s\S]*?\\\]', protect_math, protected)
        protected = re.sub(r'\\\([\s\S]*?\\\)', protect_math, protected)
        
        html = markdown.markdown(protected, extensions=['fenced_code', 'tables'])
        
        for i, block in enumerate(math_blocks):
            html = html.replace(f'MATH_PLACEHOLDER_{i}_END', block)
        
        return html

    # Process alternative solutions
    alt_processed = []
    for alt in solution_data.get("alternative_solutions", []):
        alt_processed.append({
            "title": alt.get("title", ""),
            "method": alt.get("method", ""),
            "when_to_use": alt.get("when_to_use", ""),
            "elegance_score": alt.get("elegance_score", 3),
            "solution_html": md_to_html(alt.get("solution", ""))
        })

    html_content = template.render(
        title=solution_data.get("title", "Mathematical Solution"),
        mode=solution_data.get("solution_mode", "Full Explanation Mode"),
        style_label=pdf_style,
        style_class=style_class,
        field=solution_data.get("mathematical_field", "General"),
        branch=solution_data.get("detailed_branch", ""),
        topic=solution_data.get("topic", ""),
        academic_level=solution_data.get("academic_level", ""),
        typical_course=solution_data.get("typical_course", ""),
        prerequisites=", ".join(solution_data.get("prerequisite_knowledge", [])),
        tags=solution_data.get("tags", []),
        
        # Confidence
        confidence_score=solution_data.get("confidence_score", 0),
        confidence_class=conf_class,
        confidence_label=solution_data.get("confidence_label", "Unknown"),
        risk_class=risk_class,
        risk_level=solution_data.get("risk_level", "Unknown"),
        verification_method=solution_data.get("verification_method", "AI review"),
        verification_explanation=solution_data.get("verification_explanation", ""),
        weak_points=solution_data.get("weak_points", []),
        counterexample_search=solution_data.get("counterexample_search", ""),
        evidence_checks=solution_data.get("evidence_checks", []),
        mistake_diagnosis=solution_data.get("mistake_diagnosis", {}),
        socratic_tutor=solution_data.get("socratic_tutor", []),
        solver_debate=solution_data.get("solver_debate", []),
        consensus_notes=solution_data.get("consensus_notes", ""),
        solution_quality_rubric=solution_data.get("solution_quality_rubric", []),
        generated_practice=solution_data.get("generated_practice", []),
        curriculum_alignment=solution_data.get("curriculum_alignment", {}),
        teacher_dashboard=solution_data.get("teacher_dashboard", {}),
        
        # Problem / Solution
        problem=md_to_html(solution_data.get("cleaned_problem", "")),
        solution=md_to_html(solution_data.get("primary_solution", "")),
        answer=md_to_html(solution_data.get("final_answer", "")),
        alternative_solutions=alt_processed,
        
        app_name=os.getenv("APP_NAME", "Maths AI Agent"),
        date=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    
    dir_name = os.path.dirname(output_path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
    
    temp_html = output_path + ".html"
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    import threading
    
    def render_worker():
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            try:
                page.goto(f"file:///{os.path.abspath(temp_html).replace(chr(92), '/')}", timeout=15000)
            except Exception as e:
                print(f"[Warning] page.goto timed out or failed: {e}")
                
            try:
                page.wait_for_load_state("networkidle", timeout=15000)
            except Exception as e:
                print(f"[Warning] page.wait_for_load_state timed out or failed: {e}")
                
            page.wait_for_timeout(2000)
            
            try:
                page.pdf(path=output_path, format="A4", print_background=True, margin={"top": "20px", "bottom": "20px", "left": "20px", "right": "20px"})
            except Exception as e:
                print(f"[Error] page.pdf failed: {e}")
                raise e
            finally:
                browser.close()

    # Playwright sync API fails when called from a thread with an active asyncio loop.
    # Spawning a clean thread resolves this compatibility issue.
    thread_exceptions = []
    def run_worker():
        try:
            render_worker()
        except Exception as e:
            thread_exceptions.append(e)

    thread = threading.Thread(target=run_worker)
    thread.start()
    thread.join()

    if thread_exceptions:
        raise thread_exceptions[0]
        
    if os.path.exists(temp_html):
        os.remove(temp_html)
