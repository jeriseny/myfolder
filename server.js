require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// 🔹 정적 파일 제공 (프론트엔드 파일)
app.use(express.static(path.join(__dirname, "public")));

const API_KEY = process.env.API_KEY; // 🔥 환경 변수에서 API Key 가져오기

// ✅ API Key가 없으면 서버 실행을 막음
if (!API_KEY) {
    console.error("❌ API Key가 설정되지 않았습니다! Vercel 환경 변수를 확인하세요.");
    process.exit(1); // 서버 종료
}

// 🔥 서버 시작 시 API Key 로드 확인 (실제 배포에서는 console.log 삭제 가능)
console.log("✅ API Key Loaded:", API_KEY ? "✔ Key Loaded" : "❌ Key Not Found");

// ✅ OpenAI API 호출하는 엔드포인트
app.post("/api/ask", async (req, res) => {
    const userInput = req.body.userInput;
    
    if (!userInput) {
        return res.status(400).json({ error: "질문을 입력해주세요!" });
    }

    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `너는 임다균이라는 이름을 가진 24세 남자야. 장난기 있고 야한 농담과 저급한 유머를 좋아하며, 말끝에 "~잉", "~힝", "~가즈아","말도 안된다잉!!!" 
                        을 자주 붙이는 등 장난스러운 말투를 사용해. 상대방 질문에 장난스럽고 유머러스하게 대답해줘. 너는 오토바이 배달맨이야.
                        여자친구를 만들고 싶어해서 친구가 여친 모집하는 광고 웹사이트를 만들어줬어.`
                    },
                    {
                        role: "user",
                        content: userInput
                    }
                ],
                temperature: 0.7, // 🔥 지나치게 높은 temperature 값 조정 (0.7~0.9 권장)
                max_tokens: 200
            },
            {
                headers: {
                    "Authorization": `Bearer ${API_KEY}`, // ✅ 환경 변수에서 API Key 가져오기
                    "Content-Type": "application/json"
                }
            }
        );

        res.json({ message: response.data.choices[0].message.content });
    } catch (error) {
        console.error("❌ OpenAI API 요청 실패:", error.response ? error.response.data : error.message);
        
        // 🔹 상세한 에러 메시지 반환
        if (error.response) {
            return res.status(error.response.status).json({ error: error.response.data });
        } else {
            return res.status(500).json({ error: "서버 내부 오류! API 요청 실패" });
        }
    }
});

// 🔹 기본 페이지 라우트 설정 (Vercel에서 정적 파일 제공)
app.get("/", (req, res) => {
    res.sendFile(path.resolve("public/index.html"));
});

// ❌ Vercel에서는 `app.listen(PORT, ...)`을 사용하면 안 됨!
// ✅ 대신 `module.exports = app;`을 추가해야 Vercel이 자동으로 API를 실행함.
module.exports = app;

