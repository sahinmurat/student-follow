'use client'

import { useEffect, useState } from 'react'

export default function PWARegister() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showInstallPrompt, setShowInstallPrompt] = useState(false)
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
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

        // iOS kontrolü
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

        if (isIosDevice && !isStandalone) {
            setIsIOS(true);
        }

        // PWA kurulum isteğini yakalama
        const handleBeforeInstallPrompt = (e: any) => {
            console.log('beforeinstallprompt event triggered!')
            // Tarayıcının otomatik istemini engelle
            e.preventDefault()
            // İstemi daha sonra kullanmak üzere sakla
            setDeferredPrompt(e)
            // Kullanıcıya kurulum butonunu göster
            setShowInstallPrompt(true)
        }
        
        // Debug için
        console.log('PWA Register initialized')
        console.log('Is iOS:', isIosDevice && !isStandalone)
        console.log('Service Worker supported:', 'serviceWorker' in navigator)

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        // Uygulama başarıyla kurulduğunda
        window.addEventListener('appinstalled', () => {
            console.log('PWA başarıyla kuruldu')
            setShowInstallPrompt(false)
            setDeferredPrompt(null)
            setIsIOS(false)
        })

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        // Kurulum istemini göster
        deferredPrompt.prompt()

        // Kullanıcının seçimini bekle
        const { outcome } = await deferredPrompt.userChoice
        console.log(`Kullanıcı seçimi: ${outcome}`)

        // İstemi temizle
        setDeferredPrompt(null)
        setShowInstallPrompt(false)
    }

    if (!showInstallPrompt && !isIOS) return null

    if (isIOS) {
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
                        onClick={() => setIsIOS(false)}
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

    return (
        <div className="fixed bottom-4 left-4 right-4 bg-cyan-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between">
            <div className="flex-1">
                <p className="font-semibold">Uygulamayı Yükle</p>
                <p className="text-sm opacity-90">Daha hızlı erişim için telefonunuza ekleyin</p>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => setShowInstallPrompt(false)}
                    className="px-3 py-1 text-sm bg-white/20 rounded hover:bg-white/30"
                >
                    İptal
                </button>
                <button
                    onClick={handleInstallClick}
                    className="px-4 py-1 text-sm bg-white text-cyan-600 font-semibold rounded hover:bg-gray-100"
                >
                    Yükle
                </button>
            </div>
        </div>
    )
}
