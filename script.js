// script.js - Ana uygulama mantığı

class RekabetAnaliz {
    constructor() {
        this.embeddings = null;
        this.sentences = [];
        this.labels = [];
        this.categories = [];
        this.sampleEmbeddings = null;
        this.sampleLabels = [];
        this.ihlalMerkez = null;
        this.masumMerkez = null;
        this.chart = null;
        
        this.init();
    }
    
    async init() {
        try {
            // Verileri yükle
            await this.loadData();
            
            // Grafiği oluştur
            this.initChart();
            
            // Event listeners
            document.getElementById('analyzeBtn').addEventListener('click', () => this.analyze());
            document.getElementById('clearBtn').addEventListener('click', () => this.clear());
            
            console.log('✅ Uygulama hazır');
        } catch (error) {
            console.error('❌ Hata:', error);
            this.showError('Veriler yüklenirken hata oluştu!');
        }
    }
    
    async loadData() {
        try {
            // Embedding'leri yükle
            const embResponse = await fetch('web_model/sample_embeddings.npy');
            const embBuffer = await embResponse.arrayBuffer();
            this.sampleEmbeddings = this.parseNPY(embBuffer);
            
            // Sample labels
            const labelsResponse = await fetch('web_model/sample_labels.json');
            this.sampleLabels = await labelsResponse.json();
            
            // Merkez noktaları
            const ihlalResponse = await fetch('web_model/ihlal_merkez.npy');
            const ihlalBuffer = await ihlalResponse.arrayBuffer();
            this.ihlalMerkez = this.parseNPY(ihlalBuffer);
            
            const masumResponse = await fetch('web_model/masum_merkez.npy');
            const masumBuffer = await masumResponse.arrayBuffer();
            this.masumMerkez = this.parseNPY(masumBuffer);
            
            // Cümleler ve etiketler
            const sentencesResponse = await fetch('web_model/sentences.json');
            this.sentences = await sentencesResponse.json();
            
            const labelsResponse2 = await fetch('web_model/labels.json');
            this.labels = await labelsResponse2.json();
            
            const categoriesResponse = await fetch('web_model/categories.json');
            this.categories = await categoriesResponse.json();
            
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            throw error;
        }
    }
    
    parseNPY(buffer) {
        // Basit NPY parser (float32 array için)
        const view = new DataView(buffer);
        const headerLen = view.getUint16(8, true);
        const header = new TextDecoder().decode(new Uint8Array(buffer, 10, headerLen));
        const shape = header.match(/\((\d+),?\s*(\d*)\)/);
        
        if (shape) {
            const rows = parseInt(shape[1]);
            const cols = shape[2] ? parseInt(shape[2]) : 1;
            const dataStart = 10 + headerLen + (headerLen % 2);
            const data = new Float32Array(buffer, dataStart);
            
            if (cols === 1) {
                return Array.from(data);
            } else {
                const result = [];
                for (let i = 0; i < rows; i++) {
                    result.push(Array.from(data.slice(i * cols, (i + 1) * cols)));
                }
                return result;
            }
        }
        return null;
    }
    
    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        
        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);
        
        return dotProduct / (normA * normB);
    }
    
    findMostSimilar(queryEmbedding) {
        const similarities = [];
        
        for (let i = 0; i < this.embeddings.length; i++) {
            const sim = this.cosineSimilarity(queryEmbedding, this.embeddings[i]);
            similarities.push({ index: i, similarity: sim });
        }
        
        similarities.sort((a, b) => b.similarity - a.similarity);
        return similarities.slice(0, 3);
    }
    
    async analyze() {
        const text = document.getElementById('textInput').value.trim();
        
        if (!text) {
            alert('Lütfen bir metin girin!');
            return;
        }
        
        document.getElementById('resultSection').classList.remove('hidden');
        document.getElementById('predictionText').textContent = 'Analiz ediliyor...';
        
        // Simüle edilmiş embedding (gerçek uygulamada API'den alınmalı)
        // Bu kısımı gerçek modelle değiştirmeniz gerekecek
        setTimeout(() => {
            // Örnek tahmin (gerçek uygulamada model çıktısı olacak)
            const random = Math.random();
            const isIhlal = random > 0.3;
            const confidence = isIhlal ? 0.7 + random * 0.2 : 0.7 + random * 0.2;
            
            this.showResult(isIhlal, confidence);
            
            // Örnek benzer cümleler
            const similar = [
                { index: 123, similarity: 0.85, label: 1, category: 'fiyat_tespiti', text: 'Rakiplerle fiyatları 250 TL olarak sabitledik, toplantı verimli geçti.' },
                { index: 456, similarity: 0.72, label: 1, category: 'fiyat_tespiti', text: 'Veli Bey, Gama Ticaret ile minimum fiyatı 150 TL olarak netleştirdik.' },
                { index: 789, similarity: 0.68, label: 0, category: 'masum', text: 'Maliyetlerimiz %20 arttı, fiyatlarımızı buna göre 600 TL\'ye çıkarıyoruz.' }
            ];
            
            this.showSimilarSentences(similar);
            
            // Grafiği güncelle (örnek nokta ekle)
            if (this.chart) {
                const newPoint = [
                    (Math.random() * 10) - 5,
                    (Math.random() * 10) - 5
                ];
                
                this.chart.data.datasets[2].data.push({x: newPoint[0], y: newPoint[1]});
                this.chart.update();
            }
        }, 1000);
    }
    
    showResult(isIhlal, confidence) {
        const box = document.querySelector('.prediction-box');
        const icon = document.getElementById('predictionIcon');
        const text = document.getElementById('predictionText');
        const score = document.getElementById('confidenceScore');
        const fill = document.getElementById('confidenceFill');
        
        if (isIhlal) {
            box.className = 'prediction-box ihlal';
            icon.textContent = '🔴';
            text.textContent = 'İHLAL TESPİT EDİLDİ';
            fill.style.background = 'linear-gradient(90deg, #ff6b6b, #ff4757)';
        } else {
            box.className = 'prediction-box masum';
            icon.textContent = '🔵';
            text.textContent = 'MASUM (İhlal Yok)';
            fill.style.background = 'linear-gradient(90deg, #51cf66, #40c057)';
        }
        
        score.textContent = `%${Math.round(confidence * 100)} güven`;
        fill.style.width = `${confidence * 100}%`;
    }
    
    showSimilarSentences(similar) {
        const list = document.getElementById('similarList');
        list.innerHTML = '';
        
        similar.forEach((item, i) => {
            const div = document.createElement('div');
            div.className = `similar-item ${item.label === 1 ? 'ihlal' : 'masum'}`;
            
            div.innerHTML = `
                <div>${item.text}</div>
                <div class="meta">
                    <span>${item.label === 1 ? '🔴 İhlal' : '🔵 Masum'}</span>
                    <span>📁 ${item.category}</span>
                    <span>⚡ Benzerlik: ${(item.similarity * 100).toFixed(1)}%</span>
                </div>
            `;
            
            list.appendChild(div);
        });
    }
    
    initChart() {
        const ctx = document.getElementById('scatterChart').getContext('2d');
        
        // Örnek veri noktaları
        const ihlalPoints = [];
        const masumPoints = [];
        
        // sampleEmbeddings'den ilk 200 noktayı al
        for (let i = 0; i < Math.min(200, this.sampleEmbeddings.length); i++) {
            const point = {
                x: this.sampleEmbeddings[i][0] * 5 + 2,  // Ölçeklendirme
                y: this.sampleEmbeddings[i][1] * 5 + 2
            };
            
            if (this.sampleLabels[i] === 1) {
                ihlalPoints.push(point);
            } else {
                masumPoints.push(point);
            }
        }
        
        this.chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'İhlal (Kırmızı)',
                        data: ihlalPoints,
                        backgroundColor: 'rgba(255, 71, 87, 0.6)',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Masum (Mavi)',
                        data: masumPoints,
                        backgroundColor: 'rgba(64, 192, 87, 0.6)',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Sizin Metniniz (Sarı)',
                        data: [],
                        backgroundColor: 'rgba(255, 193, 7, 0.9)',
                        pointRadius: 8,
                        pointHoverRadius: 10,
                        pointStyle: 'circle'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: (${context.raw.x.toFixed(2)}, ${context.raw.y.toFixed(2)})`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    }
                }
            }
        });
    }
    
    clear() {
        document.getElementById('textInput').value = '';
        document.getElementById('resultSection').classList.add('hidden');
        
        // Grafikten sarı noktaları temizle
        if (this.chart) {
            this.chart.data.datasets[2].data = [];
            this.chart.update();
        }
    }
    
    showError(message) {
        const result = document.getElementById('resultSection');
        result.classList.remove('hidden');
        result.innerHTML = `
            <div class="error-message">
                ❌ ${message}
            </div>
        `;
    }
}

// Uygulamayı başlat
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RekabetAnaliz();
});
