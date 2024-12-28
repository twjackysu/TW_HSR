import { chromium } from "playwright";

import {
  START_STATION,
  DESTINATION_STATION,
  DATE,
  TRAIN_ID,
  FULL_FARE_TICKET,
  CHILD_TICKET,
  CONCESSION_TICKET,
  SENIOR_TICKET,
  STUDENT_TICKET,
  ID,
  EMAIL,
  PHONE,
  CHECK_IN_OPTION,
  API_URL,
  TICKET_TYPE,
  CAR_TYPE,
  SEAT_PREFERENCE,
  RETURN_TRAIN_ID,
  RETURN_DATE,
} from "./args";
import { getCaptchaFromApi } from "./getCaptcha";

interface Args {
  ticketType?: string;
  carType?: string;
  seatPreference?: string;
  startStation?: string;
  destinationStation?: string;
  date?: string;
  returnDate?: string;
  trainId?: string;
  returnTrainId?: string;
  fullFareTicket?: string;
  childTicket?: string;
  concessionTicket?: string;
  seniorTicket?: string;
  studentTicket?: string;
  id?: string;
  email?: string;
  phone?: string;
  checkInOption?: string;
  apiUrl?: string;
}

async function run(args: Args) {
  const {
    ticketType,
    carType,
    seatPreference,
    startStation,
    destinationStation,
    date,
    trainId,
    fullFareTicket,
    childTicket,
    concessionTicket,
    seniorTicket,
    studentTicket,
    id,
    email,
    phone,
    checkInOption,
    apiUrl,
    returnDate,
    returnTrainId,
  } = args;
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://irs.thsrc.com.tw/IMINT/?locale=tw");

  await page.waitForTimeout(5000);
  // 票種
  await page.selectOption("#BookingS1Form_tripCon_typesoftrip", {
    label: ticketType ?? TICKET_TYPE,
  });
  // 車廂種類
  await page.selectOption("#BookingS1Form_trainCon_trainRadioGroup", {
    label: carType ?? CAR_TYPE,
  });
  // 座位偏好
  await page.selectOption("#BookingS1Form_seatCon_seatRadioGroup", {
    label: seatPreference ?? SEAT_PREFERENCE,
  });

  // 出發站
  await page.selectOption('select[name="selectStartStation"]', {
    label: startStation ?? START_STATION,
  });

  // 抵達站
  await page.selectOption('select[name="selectDestinationStation"]', {
    label: destinationStation ?? DESTINATION_STATION,
  });

  // 出發日期
  await page.evaluate(
    ([date]) => {
      const input = document.querySelector('input[name="toTimeInputField"]');
      input?.setAttribute("value", date);
    },
    [date ?? DATE]
  );

  // 回程日期
  await page.evaluate(
    ([date]) => {
      const input = document.querySelector('input[name="backTimeInputField"]');
      input?.setAttribute("value", date);
    },
    [returnDate ?? RETURN_DATE]
  );

  // 點擊搜尋方式 車次
  await page.click(
    'input[name="bookingMethod"][data-target="search-by-trainNo"]'
  );

  // 輸入出發車次
  await page.fill('input[name="toTrainIDInputField"]', trainId ?? TRAIN_ID);

  // 輸入回程車次
  await page.fill(
    'input[name="backTrainIDInputField"]',
    returnTrainId ?? RETURN_TRAIN_ID
  );

  // 全票
  await page.selectOption('select[name="ticketPanel:rows:0:ticketAmount"]', {
    label: fullFareTicket ?? FULL_FARE_TICKET,
  });
  // 孩童票
  await page.selectOption('select[name="ticketPanel:rows:1:ticketAmount"]', {
    label: childTicket ?? CHILD_TICKET,
  });
  // 愛心票
  await page.selectOption('select[name="ticketPanel:rows:2:ticketAmount"]', {
    label: concessionTicket ?? CONCESSION_TICKET,
  });
  // 敬老票
  await page.selectOption('select[name="ticketPanel:rows:3:ticketAmount"]', {
    label: seniorTicket ?? SENIOR_TICKET,
  });
  // 大學生票
  await page.selectOption('select[name="ticketPanel:rows:4:ticketAmount"]', {
    label: studentTicket ?? STUDENT_TICKET,
  });

  // 取得驗證碼圖片位址
  const captchaSrc = await page.getAttribute("img.captcha-img", "src");
  console.debug("captchaSrc", captchaSrc);

  const imageUrl = `https://irs.thsrc.com.tw${captchaSrc}`; // 替換成您想要下載的圖片URL
  console.debug("imageUrl", imageUrl);
  // page.on("console", (msg) => {
  //   for (let i = 0; i < msg.args().length; ++i)
  //     console.log(`${i}: ${msg.args()[i]}`);
  // });
  // 取得驗證碼圖片的base64
  const base64Image = await page.evaluate((_imageUrl) => {
    // 在此處編寫要在瀏覽器console中執行的JavaScript
    function getImageBase64(url: string) {
      return fetch(url)
        .then((response) => response.blob())
        .then((blob) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        })
        .catch((error) => {
          console.error("Error fetching image:", error);
          return null;
        });
    }
    return getImageBase64(_imageUrl);
  }, imageUrl);
  console.debug("base64Image", base64Image);

  // 拿驗證碼
  const captcha = await getCaptchaFromApi(
    base64Image as string,
    apiUrl ?? API_URL
  );

  console.debug("captcha", captcha.toUpperCase());
  // 驗證碼
  await page.fill("#securityCode", captcha.toUpperCase());
  // await page.waitForTimeout(10000);

  // // 點擊"開始查詢"
  await page.click("#SubmitButton");

  //  await page.waitForTimeout(1000);

  // 取票人資訊
  // 選取票識別碼
  await page.selectOption('select[name="idInputRadio"]', {
    label: checkInOption ?? CHECK_IN_OPTION,
  });
  // 輸入身分證字號
  await page.fill("#idNumber", id ?? ID);
  // 輸入手機號碼
  await page.fill('input[name="dummyPhone"]', phone ?? PHONE);
  // 輸入電子郵件
  await page.fill('input[name="email"]', email ?? EMAIL);
  // 選高鐵會員 TGo 帳號
  await page.click("#memberSystemRadio1");
  // 選同取票人身分證字號
  await page.click("#memberShipCheckBox");

  // 勾選同意 我已明確了解線上購票交易及取消/退票注意事項及個人資料保護政策及顧客個人資料保護權益事項，並且同意遵守所有規定及提供所需之個人資料。
  await page.click('input[name="agree"]');

  // 完成訂位
  await page.click("#isSubmit");

  await page.waitForTimeout(200);
  // 確認訂位
  await page.click("#btn-custom2");

  await page.waitForTimeout(500);
  // 獲得訂位代號
  const pnrCode = await page.$eval(
    ".pnr-code > span",
    (spanElement) => spanElement.textContent
  );
  console.log("訂位代號", pnrCode);
  await browser.close();
}

run({
  startStation: process.env.START_STATION,
  destinationStation: process.env.DESTINATION_STATION,
  date: process.env.DATE,
  returnDate: process.env.RETURN_DATE,
  trainId: process.env.TRAIN_ID,
  returnTrainId: process.env.RETURN_TRAIN_ID,
  fullFareTicket: process.env.FULL_FARE_TICKET,
  childTicket: process.env.CHILD_TICKET,
  concessionTicket: process.env.CONCESSION_TICKET,
  seniorTicket: process.env.SENIOR_TICKET,
  studentTicket: process.env.STUDENT_TICKET,
  id: process.env.ID,
  email: process.env.EMAIL,
  phone: process.env.PHONE,
  checkInOption: process.env.CHECK_IN_OPTION,
  apiUrl: process.env.API_URL,
}).catch(console.error);
