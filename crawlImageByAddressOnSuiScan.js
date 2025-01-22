import axios from "axios";
import * as cheerio from 'cheerio';
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const file = path.join(__dirname, "./coin-info-sui.json")
// Load the JSON data
let coinInfos = JSON.parse(fs.readFileSync(file, 'utf8'));

// Hàm tải ảnh
async function downloadImage(imgUrl, filename) {
    const response = await axios({
        url: imgUrl,
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" }
    });

    response.data.pipe(fs.createWriteStream(filename));
    console.log(`Ảnh đã tải về: ${filename}`);
}

// Hàm crawl ảnh
async function crawlImage() {
    try {
        // Gửi request lấy HTML
        console.log(coinInfos.length);
        for (let i = 0; i < coinInfos.length; i++) {

            if(coinInfos[i].iconUrl){
                continue;
            }
            const url = `https://suiscan.xyz/api/sui-backend/mainnet/api/coins/${coinInfos[i].type}`;
            console.log(url);
            const { data } = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });

            // Ví dụ xử lý dữ liệu trả về, giả sử bạn lấy ảnh từ response
            const imgUrl = data?.iconUrl; // Thay đổi theo cách dữ liệu trả về
          

            // Cập nhật thông tin vào coinInfos
            
            coinInfos[i].iconUrl = imgUrl;

            // Cập nhật lại file JSON sau mỗi lần thay đổi
            fs.writeFileSync(file, JSON.stringify(coinInfos, null, 2), 'utf8');
            console.log(`Cập nhật thông tin coin ${coinInfos[i].type} vào file coin-info.json`);
        }

    } catch (error) {
        console.error("Lỗi khi crawl ảnh:", error.message);
    }
}

// Chạy hàm
crawlImage();