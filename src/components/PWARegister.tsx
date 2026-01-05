'use client'

import { useEffect, useState } from 'react'

// LocalStorage key
const IOS_PROMPT_DISMISSED_KEY = 'pwa-ios-prompt-dismissed'

export default function PWARegister() {
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        // Standalone mod kontrolü
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true // iOS Safari için
        
        if (isStandalone) {
            console.log('App is in standalone mode')
            return // Standalone modda hiçbir prompt gösterme
        }

        // Service Worker kaydı
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js', { updateViaCache: 'none' })
                .then((registration) => {
                    console.log('Service Worker registered:', registration)

                    // Yeni Service Worker yüklendiğinde otomatik güncelle
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // Yeni versiyon var, sayfayı yenile
                                    console.log('Yeni versiyon bulundu, sayfa yenileniyor...')
                                    window.location.reload()
                                }
                            })
                        }
                    })

                    // Her sayfada güncelleme kontrolü yap
                    registration.update()

                    // Her 5 dakikada bir güncelleme kontrolü yap
                    setInterval(() => {
                        registration.update()
                    }, 5 * 60 * 1000)
                })
                .catch((error) => {
                    console.log('Service Worker registration failed:', error)
                })

            // Service Worker değiştiğinde sayfayı yenile
            let refreshing = false
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true
                    window.location.reload()
                }
            })
        }

        // iOS kontrolü - localStorage'dan dismiss durumunu kontrol et
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        const iosPromptDismissed = localStorage.getItem(IOS_PROMPT_DISMISSED_KEY);

        if (isIosDevice && !isStandalone && !iosPromptDismissed) {
            setIsIOS(true);
        }

        // Debug için
        console.log('PWA Register initialized')
        console.log('Is iOS:', isIosDevice && !isStandalone)
        console.log('Service Worker supported:', 'serviceWorker' in navigator)

        // Uygulama başarıyla kurulduğunda
        window.addEventListener('appinstalled', () => {
            console.log('PWA başarıyla kuruldu')
            setIsIOS(false)
            // iOS prompt'u da bir daha gösterme
            localStorage.setItem(IOS_PROMPT_DISMISSED_KEY, 'true')
        })
    }, [])

    // iOS değilse hiçbir şey gösterme
    // Android'de browser'ın native install bar'ı otomatik çıkacak
    if (!isIOS) return null

    const handleIOSDismiss = () => {
        localStorage.setItem(IOS_PROMPT_DISMISSED_KEY, 'true')
        setIsIOS(false)
    }

    // iOS için ana ekrana ekleme talimatı
    return (
        <div className="fixed bottom-4 left-4 right-4 bg-cyan-600 text-white p-4 rounded-lg shadow-lg z-50">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="font-semibold mb-1">Uygulamayı Yükle</p>
                    <p className="text-sm opacity-90">
                        Uygulamayı yüklemek için tarayıcı menüsündeki <span className="font-bold">"Paylaş"</span> butonuna tıklayın ve <span className="font-bold">"Ana Ekrana Ekle"</span> seçeneğini seçin.
                    </p>
                </div>
                <button
                    onClick={handleIOSDismiss}
                    className="ml-4 text-white/80 hover:text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
