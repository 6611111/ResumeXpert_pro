from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import PyPDF2
import docx2txt
import os
import spacy
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

app = Flask(__name__)
CORS(app)

nlp = spacy.load("en_core_web_sm")

# Example job profiles
JOB_PROFILES = {
    "Data Scientist": ["python", "machine learning", "data analysis", "statistics", "model", "pandas", "numpy", "scikit-learn"],
    "Project Manager": ["project", "management", "team", "planning", "stakeholder", "agile", "scrum", "delivery"],
    "Software Engineer": ["software", "development", "programming", "system", "debugging", "java", "c++", "python", "api"],
    "Business Analyst": ["business", "analysis", "requirement", "process", "stakeholder", "excel", "report", "analytics"],
    "UI/UX Designer": ["design", "ui", "ux", "user experience", "figma", "adobe", "prototype", "wireframe"],
    "DevOps Engineer": ["devops", "ci/cd", "aws", "azure", "docker", "kubernetes", "infrastructure", "automation"],
}

SECTION_KEYWORDS = {
    "Education": ["education", "degree", "university", "bachelor", "master", "school"],
    "Experience": ["experience", "work", "internship", "employment", "job", "position"],
    "Skills": ["skills", "proficient", "expertise", "technologies", "languages", "tools"],
    "Projects": ["project", "portfolio"],
    "Certifications": ["certification", "certified", "certificate"],
}

def extract_text(file):
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext == '.pdf':
        reader = PyPDF2.PdfReader(file)
        return "\n".join([page.extract_text() or "" for page in reader.pages])
    elif ext == '.docx':
        temp_path = "temp.docx"
        file.save(temp_path)
        text = docx2txt.process(temp_path)
        os.remove(temp_path)
        return text
    return ""

def nlp_section_scores(text):
    section_scores = {}
    for section, keywords in SECTION_KEYWORDS.items():
        score = sum(text.lower().count(word) for word in keywords)
        section_scores[section] = min(score * 20, 100)
    return section_scores

def nlp_total_score(section_scores):
    return int(np.mean(list(section_scores.values())))

def recommend_job_roles(text, top_n=3):
    all_profiles = list(JOB_PROFILES.values())
    all_roles = list(JOB_PROFILES.keys())
    docs = [" ".join(profile) for profile in all_profiles]
    docs.append(text.lower())
    vect = TfidfVectorizer().fit_transform(docs)
    resume_vec = vect[-1].toarray()[0]
    scores = []
    for i in range(len(all_profiles)):
        job_vec = vect[i].toarray()[0]
        score = np.dot(resume_vec, job_vec)
        scores.append(score)
    sorted_indices = np.argsort(scores)[::-1][:top_n]
    return [
        {"role": all_roles[i], "score": round(scores[i] * 100, 2)}
        for i in sorted_indices
    ]

@app.route("/")
def home():
    return render_template("index.html")

@app.route('/api/analyze', methods=['POST'])
def analyze():
    if 'resume' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['resume']
    text = extract_text(file)
    if not text.strip():
        return jsonify({'error': 'Could not extract text from file.'}), 400

    section_scores = nlp_section_scores(text)
    total_score = nlp_total_score(section_scores)
    job_recs = recommend_job_roles(text, top_n=3)

    return jsonify({
        "total_score": total_score,
        "section_scores": section_scores,
        "job_recommendations": job_recs
    })

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=10000)
