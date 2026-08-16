# 🚩 DoxCards - Multiplayer Red Flags Türkçe Kart Oyunu

Modern, minimal ve eğlenceli çok oyunculu **Red Flags** kart oyunu. **Cloudflare Pages**, **Cloudflare Workers** ve modern bulut platformları ile %100 uyumlu olarak geliştirilmiştir.

---

## 🚀 Özellikler

- **Multiplayer Lobi Sistemi**: 5 haneli rastgele kodlar, 6 kişiye kadar lobi kapasitesi.
- **Gerçek Zamanlı İletişim (Socket.io & WebSockets)**: Anlık kart oynama, reaksiyonlar ve sağ panele entegre canlı oda sohbeti.
- **Zengin Türkçe Kart Veritabanı**: 400+ Türkçe Beyaz (İyi Özellik) ve Kırmızı (Kırmızı Bayrak / Sabotaj) kartlar.
- **Minimalist & Modern Tasarım**:
  - Açılış ve Lobi ekranında minimal beyaz arkaplan ve net tipografi.
  - Oyun masasında zengin koyu kırmızı gradyan ve orijinal DoxCards kart şablonları.
- **Ses Efektleri & Animasyonlar**: Kart dağıtma, sabotaj, kazanan konfeti kutlaması ve ses açma/kapama seçeneği.

---

## 🛠️ Kurulum ve Yerel Geliştirme (Local Development)

### 1. Bağımlılıkları Yükleyin:
```bash
# Ana dizin bağımlılıkları
npm install

# İstemci (Client) bağımlılıkları
cd client && npm install && cd ..

# Sunucu (Server) bağımlılıkları
cd server && npm install && cd ..
```

### 2. Uygulamayı Başlatın:
```bash
# Windows için (Tek komutla hem client hem server)
npm run dev:win

# Veya Linux / Mac için
npm run dev
```
Uygulama açılacaktır:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API / WebSocket**: [http://localhost:3001](http://localhost:3001)

---

## ☁️ Cloudflare Pages ile Dağıtım (Deployment Guide)

### Adım 1: Projeyi GitHub'a Yükleyin
```bash
git init
git add .
git commit -m "feat: DoxCards initial release"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/doxcards.git
git push -u origin main
```

### Adım 2: Cloudflare Pages Kurulumu
1. [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** sekmesine gidin.
2. **Connect to Git** seçeneğini seçip GitHub reponuzu bağlayın.
3. Dağıtım ayarlarını şu şekilde yapılandırın:
   - **Framework Preset**: `Vite`
   - **Root directory**: `client` (veya ana dizin bırakıp `npm run build` diyebilirsiniz)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. **Environment variables (Ortam Değişkenleri)** bölümüne ekleyin:
   - `VITE_SERVER_URL`: `https://doxcards-server.sizin-domaininiz.com` (Canlı WebSocket sunucu adresiniz)
5. **Save and Deploy** butonuna tıklayın!

> 💡 `client/public/_redirects` dosyası repo içerisinde hazır bulunmaktadır; tek sayfa (SPA) yönlendirmeleri Cloudflare Pages üzerinde sorunsuz çalışır.

---

## 🎮 Oyun Kuralları (Nasıl Oynanır?)

1. **Tur Başı (Bekâr Belirlenir)**: Her tur sırayla bir oyuncu **Bekâr** olur. Diğer oyuncular ise **Çöpçatan** rolündedir.
2. **1. Aşama (Aday Hazırlama)**: Çöpçatanlar ellerindeki beyaz kartlardan Bekâr'ın en çok hoşlanacağını düşündükleri **2 İyi Özellik** seçerek sevgili adaylarını oluşturur.
3. **2. Aşama (Sabotaj / Kırmızı Bayrak)**: Her çöpçatan sağındaki rakibinin hazırladığı adaya **1 Kırmızı Bayrak** kartı ekleyerek adayı sabote eder.
4. **3. Aşama (Bekârın Kararı)**: Tüm adaylar ve kırmızı bayraklar masada açılır. Çöpçatanlar kendi adayını savunur, rakiplerin kırmızı bayraklarını kötüler. Bekâr en çekici gelen adayı seçer.
5. **Puanlama**: Seçilen adayın sahibi **1 Puan** kazanır. Hedef puana ilk ulaşan oyunu kazanır!

---

## 📄 Lisans
MIT License - Burak
