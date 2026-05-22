// ==========================================
// BIẾN TOÀN CỤC QUẢN LÝ TRẠNG THÁI BÀI THI
// ==========================================
let selectedQuestions = []; // Lưu 25 câu hỏi được chọn ngẫu nhiên
let userAnswers = [];       // Lưu đáp án người dùng chọn
let score = 0;              // Điểm số
let time = 40 * 60;         // 40 phút đổi ra giây (2400 giây)
let timerInterval;          // Bộ đếm thời gian

// ==========================================
// HÀM KHỞI ĐỘNG BÀI THI (Khi nhấn "Bắt đầu thi")
// ==========================================
async function startExam() {
    // 1. Lấy giá trị từ các thẻ select trong HTML
    const khoi = document.getElementById("grade").value;
    const mon = document.getElementById("subject").value;
    const ki = document.getElementById("exam").value;

    // Kiểm tra xem người dùng đã chọn đầy đủ chưa
    if (!khoi || !mon || !ki) {
        alert("Vui lòng chọn đầy đủ Khối, Môn và Kỳ thi!");
        return;
    }

    // Tự động reset lại giao diện và biến nếu đây là lượt thi mới
    clearInterval(timerInterval);
    time = 40 * 60;
    userAnswers = [];
    document.getElementById("score").innerHTML = "";
    document.getElementById("result").innerHTML = "Đang tải câu hỏi...";

    // 2. Đường dẫn file JSON dựa theo cấu trúc thư mục của bạn
    let path = `./data/${khoi}/${mon}/${ki}.json`;
    console.log("Đang load:", path);

    try {
        // 3. Fetch dữ liệu từ file JSON
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error("Không tìm thấy file dữ liệu hoặc lỗi server.");
        }
        const allQuestions = await response.json();

        if (allQuestions.length === 0) {
            document.getElementById("result").innerHTML = "File dữ liệu không có câu hỏi nào!";
            return;
        }

        // 4. Trộn ngẫu nhiên (Shuffle) toàn bộ câu hỏi và lấy ra tối đa 25 câu
        allQuestions.sort(() => Math.random() - 0.5);
        selectedQuestions = allQuestions.slice(0, Math.min(25, allQuestions.length));

        // 5. Hiển thị câu hỏi ra giao diện & Kích hoạt giao diện thi
        renderQuestions();
        startTimer();
        document.getElementById("submitBtn").style.display = "block"; // Hiện nút Nộp bài

    } catch (error) {
        console.error(error);
        document.getElementById("result").innerHTML = `Lỗi: Không thể tải bài thi. Hãy kiểm tra lại file cấu trúc thư mục hoặc nội dung JSON nhé!`;
    }
}

// ==========================================
// HÀM HIỂN THỊ DANH SÁCH CÂU HỎI RA WEB
// ==========================================
function renderQuestions() {
    let htmlContent = "";

    selectedQuestions.forEach((q, index) => {
        htmlContent += `
            <div class="question-block" style="margin-bottom: 25px; text-align: left;">
                <p><strong>Câu ${index + 1}:</strong> ${q.question}</p>
        `;

        // Duyệt qua các phương án lựa chọn
        q.options.forEach((option) => {
            htmlContent += `
                <label style="display: block; margin-bottom: 5px; cursor: pointer;">
                    <input type="radio" name="question-${index}" value="${option}" onclick="saveAnswer(${index}, '${option}')">
                    ${option}
                </label>
            `;
        });

        htmlContent += `</div><hr style="border: 0.5px solid #eee;">`;
    });

    document.getElementById("result").innerHTML = htmlContent;
}

// ==========================================
// HÀM LƯU ĐÁP ÁN KHI NGƯỜI DÙNG CLICK CHỌN
// ==========================================
function saveAnswer(questionIndex, selectedOption) {
    userAnswers[questionIndex] = selectedOption;
}

// ==========================================
// HÀM CHẠY ĐỒNG HỒ ĐẾM NGƯỢC
// ==========================================
function startTimer() {
    const timerElement = document.getElementById("timer");
    
    timerInterval = setInterval(() => {
        let minutes = Math.floor(time / 60);
        let seconds = time % 60;

        // Định dạng hiển thị kiểu 05:09 thay vì 5:9
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        timerElement.innerHTML = `Thời gian còn lại: <strong>${minutes}:${seconds}</strong>`;

        if (time <= 0) {
            clearInterval(timerInterval);
            alert("Đã hết thời gian làm bài! Hệ thống tự động nộp.");
            submitExam();
        }
        time--;
    }, 1000);
}

// ==========================================
// HÀM CHẤM ĐIỂM, HIỂN THỊ ĐÁP ÁN & GIẢI THÍCH
// ==========================================
function submitExam() {
    // Dừng đồng hồ đếm ngược
    clearInterval(timerInterval);
    document.getElementById("timer").innerHTML = "Bài thi đã được nộp!";
    document.getElementById("submitBtn").style.display = "none"; // Ẩn nút nộp bài đi

    let correctCount = 0;
    let totalQuestions = selectedQuestions.size || selectedQuestions.length;
    let reviewHtml = "";

    selectedQuestions.forEach((q, index) => {
        let userAnswer = userAnswers[index] || "Chưa trả lời";
        let correctAnswer = q.answer;
        let isCorrect = userAnswer === correctAnswer;

        if (isCorrect) correctCount++;

        // Tạo giao diện review câu đúng/sai kèm giải thích
        reviewHtml += `
            <div class="review-block" style="margin-bottom: 20px; padding: 10px; border-radius: 5px; background-color: ${isCorrect ? '#e8f5e9' : '#ffebee'}; text-align: left;">
                <p><strong>Câu ${index + 1}:</strong> ${q.question}</p>
                <p>👉 Đáp án của bạn: <span style="color: ${isCorrect ? 'green' : 'red'}; font-weight: bold;">${userAnswer}</span></p>
                <p>✅ Đáp án đúng: <strong style="color: green;">${correctAnswer}</strong></p>
                <p style="font-style: italic; color: #555; margin-top: 5px;">💡 <strong>Giải thích:</strong> ${q.explanation || "Không có giải thích cho câu hỏi này."}</p>
            </div>
        `;
    });

    // Tính điểm dựa trên thang điểm 10
    score = (correctCount / totalQuestions) * 10;
    // Làm tròn lấy 2 chữ số thập phân (Ví dụ: 8.33)
    score = Math.round(score * 100) / 100;

    // In kết quả tổng quát lên trên đầu phần kết quả
    document.getElementById("score").innerHTML = `
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h2>KẾT QUẢ: ${score} / 10 Điểm</h2>
            <p>Số câu đúng: <strong>${correctCount}/${totalQuestions} câu</strong></p>
        </div>
    `;

    // Thay thế phần làm bài bằng phần hiển thị kết quả chi tiết
    document.getElementById("result").innerHTML = reviewHtml;
    
    // Cuộn màn hình lên trên cùng để người dùng thấy điểm luôn
    window.scrollTo({ top: 0, behavior: 'smooth' });
}