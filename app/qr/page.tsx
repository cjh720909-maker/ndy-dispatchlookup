"use client";

import { useEffect, useState } from "react";

export default function QrPage() {
    const [qrUrl, setQrUrl] = useState("");
    const [fullAddress, setFullAddress] = useState("");

    useEffect(() => {
        // 브라우저에서 현재 주소(도메인)를 가져옵니다.
        // 예: http://192.168.0.22:3000 또는 http://chulsoo.synology.me:3000
        const origin = window.location.origin;
        const targetPath = "/mobile/dispatch"; // 기사님이 접속할 주소
        const fullUrl = `${origin}${targetPath}`;

        setFullAddress(fullUrl);

        // 구글 API (또는 QRServer)를 사용하여 QR코드 이미지 URL 생성
        // (별도 설치 없이 바로 사용 가능)
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(fullUrl)}`;
        setQrUrl(qrApiUrl);
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">📱 모바일 배차 조회</h1>
                <p className="text-gray-500 mb-8">
                    기사님 휴대폰 카메라로<br />
                    아래 QR코드를 스캔해주세요.
                </p>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 inline-block mb-6">
                    {qrUrl ? (
                        <img src={qrUrl} alt="QR Code" className="w-64 h-64 object-contain" />
                    ) : (
                        <div className="w-64 h-64 flex items-center justify-center text-gray-400">Loading...</div>
                    )}
                </div>

                <div className="text-sm text-gray-400 break-all bg-gray-50 p-3 rounded border">
                    {fullAddress}
                </div>

                <button
                    onClick={() => window.print()}
                    className="mt-8 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                    🖨️ 이 화면 인쇄하기
                </button>
            </div>
        </div>
    );
}
