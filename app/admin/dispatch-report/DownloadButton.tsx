'use client';

import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { downloadExcelAction } from './excel-action';

export default function ExcelDownloadButton({ date }: { date: string }) {
    const [isDownloading, setIsDownloading] = React.useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const res = await downloadExcelAction(date);
            if (res.error) {
                alert('다운로드 중 오류가 발생했습니다: ' + res.error);
                return;
            }

            if (res.base64 && res.filename) {
                const byteCharacters = atob(res.base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = res.filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error(error);
            alert('다운로드 처리 중 오류가 발생했습니다.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-green-100 transition-all active:scale-95 disabled:opacity-50"
        >
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            엑셀 다운로드 (XLSX)
        </button>
    );
}
