const uploadBox = document.getElementById('upload-box');
const resumeInput = document.getElementById('resume-input');
const fileNameDiv = document.getElementById('file-name');
const checkScoreBtn = document.getElementById('check-score-btn');
const resultSection = document.getElementById('result-section');

// Trigger file input
uploadBox.addEventListener('click', () => {
    resumeInput.click();
});

resumeInput.addEventListener('change', (e) => {
    handleFile(e.target.files[0]);
    if (uploadBox.file) analyzeResume(uploadBox.file);
});

uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.style.background = '#067c7b';
});
uploadBox.addEventListener('dragleave', (e) => {
    uploadBox.style.background = '#079a99';
});
uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.style.background = '#079a99';
    const file = e.dataTransfer.files[0];
    handleFile(file);
    if (uploadBox.file) analyzeResume(uploadBox.file);
});
function handleFile(file) {
    if (!file) return;
    if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        fileNameDiv.textContent = 'Unsupported file type. Please upload PDF or DOC/DOCX.';
        uploadBox.file = null;
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        fileNameDiv.textContent = 'File is too large. Max 5MB allowed.';
        uploadBox.file = null;
        return;
    }
    fileNameDiv.textContent = `Selected file: ${file.name}`;
    uploadBox.file = file;
}

checkScoreBtn.addEventListener('click', () => {
    if (!uploadBox.file) {
        fileNameDiv.textContent = 'Please select a resume file first.';
        return;
    }
    analyzeResume(uploadBox.file);
});

function analyzeResume(file) {
    fileNameDiv.textContent = 'Analyzing your resume...';

    const formData = new FormData();
    formData.append('resume', file);

   fetch('/api/analyze', {
    method: 'POST',
    body: formData
   })


    .then(async response => {
        if (!response.ok) {
            let err = {};
            try { err = await response.json(); } catch(e) {}
            throw new Error(err.error || 'Unknown error');
        }
        return response.json();
    })
    .then(data => {
        fileNameDiv.textContent = `Selected file: ${file.name}`;
        //showScoreResult(data.section_scores, data.job_recommendation, data.total_score);
        showScoreResult(data.section_scores, data.job_recommendations, data.total_score);

        setTimeout(() => {
            document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
        }, 100);
    })
    .catch(err => {
        fileNameDiv.textContent = err.message;
        console.error(err); // For debugging!
    });
}

function showScoreResult(sectionScores, jobRecs, totalScore) {
    resultSection.classList.remove('hidden');

    // Doughnut chart for total score
    if (window.scoreChart && typeof window.scoreChart.destroy === 'function') {
        window.scoreChart.destroy();
    }
    const ctx = document.getElementById('scoreChart').getContext('2d');
    window.scoreChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Score', ''],
            datasets: [{
                data: [totalScore, 100 - totalScore],
                backgroundColor: ['#ffc107', '#eee'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '75%',
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
                title: {
                    display: true,
                    text: totalScore + '%',
                    color: '#ffc107',
                    font: { size: 24 }
                }
            }
        }
    });

    // Section bar chart
    if (window.sectionBarChart && typeof window.sectionBarChart.destroy === 'function') {
        window.sectionBarChart.destroy();
    }
    let barChartCanvas = document.getElementById('sectionBarChart');
    if (!barChartCanvas) {
        barChartCanvas = document.createElement('canvas');
        barChartCanvas.id = 'sectionBarChart';
        document.getElementById('result-section').appendChild(barChartCanvas);
    }
    const ctxBar = barChartCanvas.getContext('2d');
    window.sectionBarChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: Object.keys(sectionScores),
            datasets: [{
                label: 'Section Score',
                data: Object.values(sectionScores),
                backgroundColor: '#079a99'
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: '#fff' }
                },
                x: { ticks: { color: '#fff' } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Show job recommendation
    const jobDiv = document.getElementById('job-suggestions');
    jobDiv.innerHTML = `<h3>Top Job Role Recommendations:</h3>`;
    jobRecs.forEach(job =>
        jobDiv.innerHTML += `<div class="job-suggestion">
            <b>${job.role}</b>
            <span class="match-score">Match: ${job.score}%</span>
        </div>`
    );

}

// (Your bubble background and carousel code stays the same)

















// Bubble background animation in Aqua/Teal
(function() {
    const canvas = document.getElementById('bubble-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    let bubbles = [];
    const bubbleCount = 70;
    const colors = [
        "rgba(0,200,200,0.18)", // #00C8C8
        "rgba(0,194,168,0.13)", // #00C2A8
        "rgba(0,200,200,0.11)",
        "rgba(0,194,168,0.10)"
    ];

    function randomBetween(a, b) {
        return a + Math.random() * (b - a);
    }

    function createBubble() {
        return {
            x: randomBetween(0, W),
            y: randomBetween(0, H),
            r: randomBetween(40, 120),
            speed: randomBetween(0.3, 1.3),
            drift: randomBetween(-0.3, 0.3),
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: randomBetween(0.13, 0.24)
        };
    }

    function resizeCanvas() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;
    }

    function animate() {
        ctx.clearRect(0, 0, W, H);
        for (let i = 0; i < bubbles.length; i++) {
            let b = bubbles[i];
            ctx.globalAlpha = b.alpha;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, 2 * Math.PI);
            ctx.fillStyle = b.color;
            ctx.fill();

            b.y -= b.speed;
            b.x += b.drift;

            if (b.y + b.r < 0 || b.x + b.r < 0 || b.x - b.r > W) {
                bubbles[i] = createBubble();
                bubbles[i].y = H + bubbles[i].r;
            }
        }
        ctx.globalAlpha = 1.0;
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resizeCanvas);

    bubbles = [];
    for (let i = 0; i < bubbleCount; i++) {
        bubbles.push(createBubble());
    }
    animate();
})();



const track = document.getElementById('carousel-track');
const images = track.querySelectorAll('img');
let idx = 0;

function showSlide(i) {
  track.style.transform = `translateX(-${i * 370}px)`; // 320px image + 20px gap
}

setInterval(() => {
  idx = (idx + 1) % images.length;
  showSlide(idx);
}, 1000);

showSlide(idx);