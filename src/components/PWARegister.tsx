'use client'

import { useEffect, useState } from 'react'

export default function PWARegister() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showInstallPrompt, setShowInstallPrompt] = useState(false)

    useEffect(() => {
        // Service Worker kaydı
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration)
                })
                .catch((error) => {
                    console.log('Service Worker registration failed:', error)
                })
        }

        // PWA kurulum isteğini yakalama
        const handleBeforeInstallPrompt = (e: any) => {
            // Tarayıcının otomatik istemini engelle
            e.preventDefault()
            // İstemi daha sonra kullanmak üzere sakla
            setDeferredPrompt(e)
            // Kullanıcıya kurulum butonunu göster
            setShowInstallPrompt(true)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        // Uygulama başarıyla kurulduğunda
        window.addEventListener('appinstalled', () => {
            console.log('PWA başarıyla kuruldu')
            setShowInstallPrompt(false)
            setDeferredPrompt(null)
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

    if (!showInstallPrompt) return null

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
