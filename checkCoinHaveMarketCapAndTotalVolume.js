const axios = require("axios");
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "./coin-info.json");

// Load JSON data
let coinInfos = JSON.parse(fs.readFileSync(file, "utf8"));

// Tạo instance axios
const axiosInstance = axios.create({
    baseURL: "https://api.coingecko.com/api/v3"
});

// Hàm lưu dữ liệu vào file ngay sau khi cập nhật
function saveToFile() {
    fs.writeFileSync(file, JSON.stringify(coinInfos, null, 2), "utf8");
}

// Hàm kiểm tra thông tin coin
async function verifyCoin(coinId, index) {
    // Bỏ qua nếu đã có verified là true hoặc false
    if (coinInfos[index].verified === true || coinInfos[index].verified === false) {
        console.log(`Bỏ qua coin ${coinId}, đã được xác minh trước đó.`);
        return false; // Trả về false để không đợi delay
    }
    
    try {
        const response = await axiosInstance.get(`/simple/price`, {
            params: {
                ids: coinId,
                vs_currencies: 'usd',
                include_market_cap: true,
                include_24hr_vol: true,
                include_24hr_change: true,
                include_last_updated_at: true,
            },
        });
        
        const coinData = response.data[coinId];
        
        if (coinData && coinData.usd_market_cap && coinData.usd_24h_vol) {
            coinInfos[index].verified = true;
        } else {
            coinInfos[index].verified = false;
        }
        console.log(`Cập nhật coin ${coinId}: verified = ${coinInfos[index].verified}`);
        saveToFile(); // Lưu dữ liệu ngay sau khi cập nhật
        return true; // Trả về true để áp dụng delay
    } catch (error) {
        console.error(`Lỗi khi kiểm tra coin ${coinId}:`, error.message);
        coinInfos[index].verified = false;
        saveToFile(); // Lưu dữ liệu ngay cả khi lỗi xảy ra
        return true; // Trả về true để áp dụng delay
    }
}

// Hàm kiểm tra thông tin toàn bộ coin với giới hạn 5 request/phút
async function verifyCoins() {
    let index = 0;
    const processNext = async () => {
        if (index >= coinInfos.length) {
            console.log("Cập nhật coin-info.json hoàn tất!");
            return;
        }
        
        const shouldDelay = await verifyCoin(coinInfos[index].id, index);
        index++;
        
        if (shouldDelay) {
            setTimeout(processNext, 12000); // 12 giây mỗi request để đảm bảo 5 request/phút
        } else {
            processNext(); // Gọi ngay nếu không cần delay
        }
    };
    
    processNext();
}

// Chạy hàm
verifyCoins();
