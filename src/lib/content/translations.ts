// Auto-generated translations of vocab/grammar meanings for the 10 non-Japanese,
// non-English learner languages (English lives in meaning_en on the row itself).
// Keyed by the exact Japanese term/pattern string so seed.ts can look up each
// item's meanings_json at insert time. See src/lib/i18n/languages.ts for codes.
import type { LanguageCode } from "../i18n/languages";

type MeaningMap = Partial<Record<Exclude<LanguageCode, "ja" | "en">, string>>;

export const VOCAB_MEANINGS: Record<string, MeaningMap> = {
  "食べる": { vi: "ăn", id: "makan", tl: "kumain", my: "စားသည်", zh: "吃", ne: "खानु", km: "ញ៉ាំ", mn: "идэх", th: "กิน", si: "කනවා" },
  "学校": { vi: "trường học", id: "sekolah", tl: "paaralan", my: "ကျောင်း", zh: "学校", ne: "विद्यालय", km: "សាលារៀន", mn: "сургууль", th: "โรงเรียน", si: "පාසල" },
  "水": { vi: "nước", id: "air", tl: "tubig", my: "ရေ", zh: "水", ne: "पानी", km: "ទឹក", mn: "ус", th: "น้ำ", si: "ජලය" },
  "大きい": { vi: "to, lớn", id: "besar", tl: "malaki", my: "ကြီးသော", zh: "大", ne: "ठूलो", km: "ធំ", mn: "том", th: "ใหญ่", si: "ලොකු" },
  "友達": { vi: "bạn bè", id: "teman", tl: "kaibigan", my: "သူငယ်ချင်း", zh: "朋友", ne: "साथी", km: "មិត្តភក្តិ", mn: "найз", th: "เพื่อน", si: "මිතුරා" },
  "毎日": { vi: "hằng ngày, mỗi ngày", id: "setiap hari", tl: "araw-araw", my: "နေ့စဉ်", zh: "每天", ne: "हरेक दिन", km: "រៀងរាល់ថ្ងៃ", mn: "өдөр бүр", th: "ทุกวัน", si: "දිනපතා" },
  "電車": { vi: "tàu điện", id: "kereta listrik", tl: "tren", my: "ရထား", zh: "电车", ne: "रेल", km: "រថភ្លើង", mn: "галт тэрэг", th: "รถไฟ", si: "දුම්රිය" },
  "忙しい": { vi: "bận rộn", id: "sibuk", tl: "abala / busy", my: "အလုပ်များသော", zh: "忙，忙碌", ne: "व्यस्त", km: "រវល់", mn: "завгүй", th: "ยุ่ง, ไม่ว่าง", si: "කාර්යබහුල" },
  "経験": { vi: "kinh nghiệm", id: "pengalaman", tl: "karanasan", my: "အတွေ့အကြုံ", zh: "经验", ne: "अनुभव", km: "បទពិសោធន៍", mn: "туршлага", th: "ประสบการณ์", si: "අත්දැකීම" },
  "準備": { vi: "chuẩn bị", id: "persiapan", tl: "paghahanda", my: "ပြင်ဆင်မှု", zh: "准备", ne: "तयारी", km: "ការត្រៀមរៀបចំ", mn: "бэлтгэл", th: "การเตรียมตัว", si: "සූදානම් කිරීම" },
  "説明": { vi: "giải thích", id: "penjelasan", tl: "paliwanag", my: "ရှင်းလင်းချက်", zh: "说明", ne: "व्याख्या", km: "ការពន្យល់", mn: "тайлбар", th: "การอธิบาย", si: "පැහැදිලි කිරීම" },
  "世界": { vi: "thế giới", id: "dunia", tl: "mundo", my: "ကမ္ဘာ", zh: "世界", ne: "संसार", km: "ពិភពលោក", mn: "дэлхий", th: "โลก", si: "ලෝකය" },
  "台風": { vi: "bão (typhoon)", id: "topan", tl: "bagyo", my: "တိုင်ဖွန်းမုန်တိုင်း", zh: "台风", ne: "टाइफुन (प्रचण्ड आँधी)", km: "ព្យុះទីហ្វុង", mn: "тайфун", th: "ไต้ฝุ่น", si: "සුළි කුණාටුව" },
  "用意": { vi: "sự chuẩn bị, sẵn sàng", id: "kesiapan", tl: "kahandaan", my: "အသင့်ပြင်ဆင်ခြင်း", zh: "准备", ne: "व्यवस्था / तयारी", km: "ការត្រៀមខ្លួន", mn: "бэлэн байдал", th: "การเตรียมพร้อม", si: "සූදානම" },
  "天気予報": { vi: "dự báo thời tiết", id: "ramalan cuaca", tl: "ulat ng panahon", my: "ရာသီဥတု ခန့်မှန်းချက်", zh: "天气预报", ne: "मौसम पूर्वानुमान", km: "ព្យាករណ៍អាកាសធាតុ", mn: "цаг агаарын мэдээ", th: "พยากรณ์อากาศ", si: "කාලගුණ අනාවැකිය" },
  "招待": { vi: "lời mời, mời", id: "undangan", tl: "imbitasyon", my: "ဖိတ်ကြားခြင်း", zh: "邀请", ne: "निमन्त्रणा", km: "ការអញ្ជើញ", mn: "урилга", th: "คำเชิญ", si: "ආරාධනාව" },
  "影響": { vi: "ảnh hưởng", id: "pengaruh", tl: "epekto / impluwensya", my: "သက်ရောက်မှု", zh: "影响", ne: "प्रभाव", km: "ឥទ្ធិពល", mn: "нөлөө", th: "อิทธิพล, ผลกระทบ", si: "බලපෑම" },
  "状況": { vi: "tình huống, tình hình", id: "situasi", tl: "sitwasyon", my: "အခြေအနေ", zh: "状况，情况", ne: "अवस्था", km: "ស្ថានភាព", mn: "нөхцөл байдал", th: "สถานการณ์", si: "තත්ත්වය" },
  "判断": { vi: "phán đoán, đánh giá", id: "penilaian", tl: "pagpapasya", my: "ဆုံးဖြတ်ချက်", zh: "判断", ne: "निर्णय", km: "ការវិនិច្ឆ័យ", mn: "дүгнэлт, шийдвэр", th: "การตัดสินใจ", si: "විනිශ්චය" },
  "割合": { vi: "tỷ lệ", id: "rasio / proporsi", tl: "ratio / proporsyon", my: "အချိုးအစား", zh: "比例", ne: "अनुपात", km: "សមាមាត្រ", mn: "харьцаа", th: "อัตราส่วน", si: "අනුපාතය" },
  "環境": { vi: "môi trường", id: "lingkungan", tl: "kapaligiran", my: "သဘာဝပတ်ဝန်းကျင်", zh: "环境", ne: "वातावरण", km: "បរិស្ថាន", mn: "орчин", th: "สิ่งแวดล้อม", si: "පරිසරය" },
  "対策": { vi: "biện pháp đối phó", id: "langkah penanggulangan", tl: "hakbang / solusyon", my: "ကာကွယ်ဖြေရှင်းရေးနည်းလမ်း", zh: "对策", ne: "उपाय", km: "វិធានការ", mn: "арга хэмжээ", th: "มาตรการรับมือ", si: "පිළියම" },
  "傾向": { vi: "xu hướng", id: "kecenderungan", tl: "tendensya / kalakaran", my: "လမ်းကြောင်း / သဘောထား", zh: "倾向", ne: "प्रवृत्ति", km: "និន្នាការ", mn: "хандлага", th: "แนวโน้ม", si: "ප්‍රවණතාව" },
  "維持": { vi: "duy trì", id: "pemeliharaan", tl: "pagpapanatili", my: "ထိန်းသိမ်းမှု", zh: "维持", ne: "कायम राख्ने कार्य", km: "ការថែរក្សា", mn: "хадгалалт", th: "การรักษาสภาพ", si: "පවත්වාගෙන යාම" },
  "概念": { vi: "khái niệm", id: "konsep", tl: "konsepto", my: "သဘောတရား", zh: "概念", ne: "अवधारणा", km: "គោលគំនិត", mn: "ойлголт", th: "แนวคิด", si: "සංකල්පය" },
  "促進": { vi: "thúc đẩy", id: "promosi / percepatan", tl: "pagtataguyod / pagpapabilis", my: "မြှင့်တင်မှု", zh: "促进", ne: "प्रवर्द्धन", km: "ការជំរុញ", mn: "дэмжлэг, түргэтгэл", th: "การส่งเสริม", si: "ප්‍රවර්ධනය" },
  "抽象的": { vi: "trừu tượng", id: "abstrak", tl: "abstrakto", my: "စိတ္တဇသဘောဆောင်သော", zh: "抽象的", ne: "अमूर्त", km: "អរូបី", mn: "хийсвэр", th: "เชิงนามธรรม", si: "වියුක්ත" },
  "一致": { vi: "sự trùng khớp, nhất trí", id: "kesesuaian / kecocokan", tl: "pagkakatugma", my: "ကိုက်ညီမှု", zh: "一致", ne: "मेल / सहमति", km: "ភាពស្របគ្នា", mn: "тохирол", th: "ความสอดคล้องกัน", si: "එකඟතාව" },
  "矛盾": { vi: "mâu thuẫn", id: "kontradiksi", tl: "kontradiksyon", my: "ဆန့်ကျင်ကွဲလွဲမှု", zh: "矛盾", ne: "विरोधाभास", km: "ភាពផ្ទុយគ្នា", mn: "зөрчилдөөн", th: "ข้อขัดแย้งในตัวเอง", si: "පරස්පරතාව" },
  "補う": { vi: "bổ sung, bù đắp", id: "melengkapi / menutupi kekurangan", tl: "punan / dagdagan", my: "ဖြည့်စွက်သည်", zh: "弥补，补充", ne: "कमी पूरा गर्नु", km: "បំពេញបន្ថែម", mn: "нөхөх", th: "ชดเชย, เติมเต็ม", si: "පිරවීම කරනවා" },
  "見なす": { vi: "coi là, xem như", id: "menganggap sebagai", tl: "ituring bilang", my: "သတ်မှတ်သည် / ယူဆသည်", zh: "视为，认为", ne: "ठान्नु / मान्नु", km: "ចាត់ទុកថា", mn: "гэж үзэх", th: "ถือว่าเป็น", si: "සලකනවා" },
  "妥協": { vi: "thỏa hiệp", id: "kompromi", tl: "kompromiso", my: "အလျှော့ပေးညှိနှိုင်းမှု", zh: "妥协", ne: "सम्झौता", km: "ការសម្របសម្រួល", mn: "буулт", th: "การประนีประนอม", si: "සම්මුතිය" },
  "曖昧": { vi: "mơ hồ, không rõ ràng", id: "ambigu / tidak jelas", tl: "malabo / hindi malinaw", my: "မရေရာသော", zh: "暧昧，模糊不清", ne: "अस्पष्ट", km: "មិនច្បាស់លាស់", mn: "тодорхой бус", th: "คลุมเครือ", si: "අපැහැදිලි" },
  "遂行": { vi: "thực hiện, thi hành", id: "pelaksanaan", tl: "pagsasakatuparan", my: "အကောင်အထည်ဖော် ဆောင်ရွက်ခြင်း", zh: "履行，执行", ne: "सम्पादन गर्ने कार्य", km: "ការអនុវត្ត", mn: "гүйцэтгэл", th: "การดำเนินการให้สำเร็จ", si: "ඉටු කිරීම" },
  "円滑": { vi: "suôn sẻ, trôi chảy", id: "lancar", tl: "maayos / walang sagabal", my: "ချောမွေ့သော", zh: "顺利，圆滑", ne: "सहज / सुचारु", km: "រលូន", mn: "гөлгөр", th: "ราบรื่น", si: "සුමට" },
  "是正": { vi: "sửa chữa, chấn chỉnh", id: "perbaikan / koreksi", tl: "pagwawasto", my: "ပြင်ဆင်ခြင်း", zh: "纠正，改正", ne: "सुधार", km: "ការកែតម្រូវ", mn: "залруулга", th: "การแก้ไขให้ถูกต้อง", si: "නිවැරදි කිරීම" },
  "潜在的": { vi: "tiềm tàng, tiềm ẩn", id: "potensial / tersembunyi", tl: "potensyal / natatago", my: "ကွယ်ဝှက်နေသော အလားအလာရှိသော", zh: "潜在的", ne: "सम्भावित / गुप्त", km: "សក្តានុពល", mn: "далд, боломжит", th: "แฝงอยู่, มีศักยภาพ", si: "විභව" },
  "顕著": { vi: "rõ rệt, nổi bật", id: "mencolok / nyata", tl: "kapansin-pansin", my: "ထင်ရှားသော", zh: "显著", ne: "उल्लेखनीय", km: "លេចធ្លោ", mn: "мэдэгдэхүйц", th: "เด่นชัด", si: "කැපී පෙනෙන" },
  "逸脱": { vi: "sự đi chệch, lệch hướng", id: "penyimpangan", tl: "paglihis", my: "သွေဖည်မှု", zh: "偏离，脱离", ne: "विचलन", km: "ការចាកចេញពីគន្លង", mn: "хазайлт", th: "การเบี่ยงเบน", si: "අපගමනය" },
  "秩序": { vi: "trật tự", id: "ketertiban", tl: "kaayusan", my: "စည်းကမ်းစနစ်ကျမှု", zh: "秩序", ne: "व्यवस्था / अनुशासन", km: "សណ្តាប់ធ្នាប់", mn: "дэг журам", th: "ระเบียบ", si: "පිළිවෙල" },
};

export const GRAMMAR_MEANINGS: Record<string, MeaningMap> = {
  "〜ています": { vi: "đang làm / trạng thái hiện tại", id: "sedang berlangsung / keadaan saat ini", tl: "patuloy na kilos / kasalukuyang kalagayan", my: "ဆက်လက်လုပ်ဆောင်နေဆဲ / လက်ရှိအခြေအနေ", zh: "表示正在进行的动作／当前的状态", ne: "जारी रहेको कार्य / हालको अवस्था", km: "សកម្មភាពកំពុងបន្ត / ស្ថានភាពបច្ចុប្បន្ន", mn: "үргэлжилж буй үйлдэл / одоогийн байдал", th: "กำลังทำอยู่ / สภาพปัจจุบัน", si: "සිදු වෙමින් පවතින ක්‍රියාව / වත්මන් තත්ත්වය" },
  "〜たいです": { vi: "muốn làm", id: "ingin melakukan", tl: "gustong gawin", my: "...လုပ်ချင်သည်", zh: "想要做…", ne: "...गर्न चाहनु", km: "ចង់ធ្វើ", mn: "хийхийг хүсэх", th: "อยากทำ...", si: "කිරීමට කැමතියි" },
  "〜ないでください": { vi: "xin đừng làm", id: "tolong jangan melakukan", tl: "pakiusap huwag gawin", my: "...မလုပ်ပါနှင့်", zh: "请不要…", ne: "कृपया ...नगर्नुहोस्", km: "សូមកុំធ្វើ", mn: "хийхгүй байхыг хүсэх", th: "กรุณาอย่าทำ...", si: "කරන්න එපා කියා ඉල්ලීම" },
  "〜前に": { vi: "trước khi làm", id: "sebelum melakukan", tl: "bago gawin", my: "...မလုပ်မီ", zh: "…之前", ne: "...गर्नु अगाडि", km: "មុននឹងធ្វើ", mn: "хийхээсээ өмнө", th: "ก่อนที่จะทำ...", si: "කිරීමට පෙර" },
  "〜ことができます": { vi: "có thể làm", id: "dapat melakukan", tl: "kaya gawin", my: "...လုပ်နိုင်သည်", zh: "能够…，会…", ne: "...गर्न सक्नु", km: "អាចធ្វើបាន", mn: "хийж чадах", th: "สามารถทำ...ได้", si: "කළ හැකියි" },
  "〜そうです": { vi: "trông có vẻ / dường như", id: "terlihat seperti / sepertinya", tl: "mukhang / parang", my: "...ဟန်ရှိသည် / ထင်ရသည်", zh: "看起来…，好像…", ne: "...जस्तो देखिन्छ", km: "ហាក់ដូចជា", mn: "...шиг санагдах, харагдах", th: "ดูเหมือนว่า...", si: "පෙනෙන්නට / බඳුයි" },
  "〜ようになる": { vi: "dần trở nên có thể làm", id: "menjadi bisa melakukan", tl: "nagsimulang maging kaya", my: "...လုပ်နိုင်လာသည် (အခြေအနေပြောင်းလဲမှု)", zh: "变得能够…", ne: "...गर्न सक्षम हुँदै जानु", km: "ក្លាយជាអាចធ្វើបាន", mn: "хийж чаддаг болох", th: "กลายเป็นสามารถทำ...ได้", si: "ක්‍රමයෙන් කළ හැකි වීම" },
  "〜たら": { vi: "nếu / khi", id: "jika / ketika", tl: "kung / kapag", my: "...ရင် / ...လျှင်", zh: "如果…，…的话", ne: "यदि/जब ...भए", km: "ប្រសិនបើ / នៅពេល", mn: "хэрэв ... бол", th: "ถ้า.../เมื่อ...", si: "නම් / විට" },
  "〜のに": { vi: "mặc dù / dù vậy", id: "padahal / meskipun", tl: "kahit na / sa kabila ng", my: "...ပေမဲ့ / ဆိုပေမယ့်", zh: "虽然…，明明…", ne: "...भए तापनि", km: "ថ្វីត្បិតតែ", mn: "гэсэн хэдий ч", th: "ทั้งที่.../แม้ว่า...", si: "වුවත් / නමුත්" },
  "〜ばかり": { vi: "chỉ / toàn là", id: "hanya / baru saja", tl: "puro lamang / bago lamang gawin", my: "...ချည်း / ...ပဲ", zh: "只…，净是…", ne: "मात्र / जहिले पनि", km: "គ្រាន់តែ / ទើបតែ", mn: "зөвхөн ... л", th: "แค่.../เพิ่ง...เท่านั้น", si: "පමණක් / විතරක්" },
  "〜わけではない": { vi: "không hẳn là / không có nghĩa là", id: "tidak berarti selalu", tl: "hindi ibig sabihin na", my: "...ဟု အမှန်တကယ် မဆိုလိုပါ", zh: "并不是说…", ne: "अनिवार्य रूपमा त्यस्तो होइन", km: "មិនមែនមានន័យថាទាំងអស់ទេ", mn: "гэсэн үг биш", th: "ไม่ได้หมายความว่า...เสมอไป", si: "අනිවාර්යයෙන්ම එසේ නොවේ" },
  "〜さえ〜ば": { vi: "chỉ cần... là được", id: "asalkan / selama", tl: "basta / kung", my: "...ရုံနှင့် / ...ရင်တင်", zh: "只要…就…", ne: "...मात्र भए पनि पुग्छ", km: "គ្រាន់តែ...ក៏បាន", mn: "зөвхөн ... бол л болно", th: "ขอเพียงแค่...ก็...", si: "පමණක්වත් නම්" },
  "〜にとって": { vi: "đối với", id: "bagi / dari sudut pandang", tl: "para sa / sa paningin ng", my: "...၏ရှုထောင့်အရ / ...အတွက်ဆိုရင်", zh: "对…来说", ne: "...का लागि (दृष्टिकोणबाट)", km: "សម្រាប់ / ចំពោះ", mn: "...-ийн хувьд", th: "สำหรับ... (ในมุมมองของ)", si: "ට අනුව / දෘෂ්ටිකෝණයෙන්" },
  "〜おかげで": { vi: "nhờ có", id: "berkat", tl: "salamat sa", my: "...ကျေးဇူးကြောင့်", zh: "多亏了…", ne: "...को कारणले (सकारात्मक)", km: "អរគុណដល់ / ដោយសារតែ", mn: "...-ийн ачаар", th: "เพราะ.../ด้วยความช่วยเหลือของ...", si: "ස්තුතියි / නිසා" },
  "〜つつある": { vi: "đang dần dần", id: "sedang dalam proses", tl: "unti-unting nagiging", my: "...လုပ်ဆောင်နေဆဲဖြစ်သည် (တဖြည်းဖြည်း)", zh: "正在逐渐…", ne: "...हुँदै गइरहेको", km: "កំពុងតែ", mn: "...болж байгаа явцад", th: "กำลังอยู่ในระหว่าง...", si: "ක්‍රමයෙන් සිදුවෙමින් පවතී" },
  "〜にもかかわらず": { vi: "mặc dù / bất chấp", id: "meskipun / walaupun", tl: "sa kabila ng", my: "...ဖြစ်ပါလျက်နှင့်", zh: "尽管…，虽然…", ne: "...भए पनि / बावजुद", km: "ថ្វីត្បិតតែ / ទោះបីជា", mn: "...-г үл харгалзан", th: "แม้ว่า.../ทั้งที่...", si: "වුවද / නොතකා" },
  "〜あげく": { vi: "cuối cùng thì (kết quả không tốt)", id: "pada akhirnya (hasil negatif)", tl: "sa bandang huli (negatibong resulta)", my: "...ပြီးနောက်ဆုံးတွင် (မကောင်းသောရလဒ်)", zh: "…到最后（结果不好）", ne: "अन्ततः (नकारात्मक परिणाम)", km: "ជាចុងក្រោយ (លទ្ធផលអវិជ្ជមាន)", mn: "эцэст нь (сөрөг үр дүн)", th: "ในที่สุดก็... (ผลลัพธ์ไม่ดี)", si: "අවසානයේදී (නරක ප්‍රතිඵලයක්)" },
  "〜を問わず": { vi: "bất kể / không phân biệt", id: "tanpa memandang / terlepas dari", tl: "anuman ang / hindi alintana", my: "...ကို မထောက်ဘဲ", zh: "不论…，无论…", ne: "जे भए पनि / नभनी", km: "មិនគិតពី", mn: "...-г үл ялгаварлан", th: "ไม่ว่าจะ...ก็ตาม", si: "නොසලකා / කුමක් වුවත්" },
  "〜に応じて": { vi: "tùy theo / tương ứng với", id: "sesuai dengan / menanggapi", tl: "ayon sa / depende sa", my: "...နှင့်အညီ", zh: "根据…，按照…", ne: "...अनुसार", km: "អាស្រ័យតាម", mn: "...-д тохируулан", th: "ตามความเหมาะสมกับ...", si: "අනුව / අනුරූපව" },
  "〜次第だ": { vi: "tùy thuộc vào", id: "tergantung pada", tl: "depende sa", my: "...အပေါ်မူတည်သည်", zh: "取决于…", ne: "...मा निर्भर हुनु", km: "អាស្រ័យលើ", mn: "...-аас шалтгаалах", th: "ขึ้นอยู่กับ...", si: "මත රඳා පවතී" },
  "〜きらいがある": { vi: "có xu hướng (mang sắc thái tiêu cực)", id: "cenderung (nuansa negatif)", tl: "may tendensyang (negatibo)", my: "...လုပ်တတ်သောသဘောရှိသည် (အနုတ်လက္ခဏာ)", zh: "有…的倾向（含负面语气）", ne: "...गर्ने प्रवृत्ति हुनु (नकारात्मक भाव)", km: "មានទំនោរទៅរក (អត្ថន័យអវិជ្ជមាន)", mn: "хандлагатай байх (сөрөг утгаар)", th: "มีแนวโน้มที่จะ... (ในทางลบ)", si: "නැඹුරු වීමේ ප්‍රවණතාවක් ඇත (නිෂේධාත්මක)" },
  "〜べからず": { vi: "không được phép / cấm", id: "tidak boleh / dilarang", tl: "bawal / huwag gagawin", my: "...မလုပ်ရ", zh: "不得…，禁止…", ne: "...गर्नु हुँदैन", km: "មិនត្រូវ / ហាមឃាត់", mn: "болохгүй (хатуу хориг)", th: "ห้ามทำ...", si: "නොකළ යුතුයි" },
  "〜にたえない": { vi: "không thể chịu đựng nổi / không kìm được", id: "tidak tahan / tidak bisa menahan", tl: "hindi mapigilang / hindi matiis", my: "...မခံနိုင်လောက်အောင်", zh: "令人不忍…，不禁…", ne: "सहन नसक्ने / नरोकी नसक्ने", km: "មិនអាចទប់ចិត្តបាន", mn: "тэвчихийн аргагүй", th: "ทนไม่ไหวที่จะ... / อดไม่ได้ที่จะ...", si: "ඉවසිය නොහැකි / නොකර සිටිය නොහැකි" },
  "〜ならでは": { vi: "chỉ có ở / đặc trưng riêng của", id: "khas / hanya mungkin karena", tl: "katangi-tangi sa / dahil lamang sa", my: "...မှသာ ဖြစ်နိုင်သော", zh: "…特有的，正因为…才有的", ne: "...लाई मात्र सम्भव भएको", km: "ជាលក្ខណៈពិសេសរបស់", mn: "зөвхөн ...-д л боломжтой", th: "เป็นลักษณะเฉพาะของ...", si: "ට පමණක් සුවිශේෂී" },
  "〜を余儀なくされる": { vi: "buộc phải", id: "terpaksa harus", tl: "napipilitang gawin", my: "...လုပ်ရန် မလွှဲမရှောင်သာဖြစ်သည်", zh: "被迫…", ne: "...गर्न बाध्य हुनु", km: "ត្រូវបង្ខំចិត្តឱ្យ", mn: "хийхээс өөр аргагүй болох", th: "ถูกบังคับให้ต้อง...", si: "බලහත්කාරයෙන් කිරීමට සිදු වේ" },
};

/** Build the meanings_json blob (all 10 languages) for a vocab term. */
export function vocabMeaningsJson(term: string): string {
  return JSON.stringify(VOCAB_MEANINGS[term] ?? {});
}

/** Build the meanings_json blob (all 10 languages) for a grammar pattern. */
export function grammarMeaningsJson(pattern: string): string {
  return JSON.stringify(GRAMMAR_MEANINGS[pattern] ?? {});
}
