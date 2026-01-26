'use client';

import { useState } from 'react';
import { uploadOrders } from './actions';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function UploadForm() {
    const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState('');

    async function handleSubmit(formData: FormData) {
        if (!formData.get('file')) return;

        setStatus('UPLOADING');
        setMessage('Processing Excel file...');

        const result = await uploadOrders(formData);

        if (result.success) {
            setStatus('SUCCESS');
            setMessage(result.message || 'Upload Complete');
        } else {
            setStatus('ERROR');
            setMessage(result.message || 'Upload Failed');
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                발주서 엑셀 업로드
            </h2>

            <form action={handleSubmit} className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors relative">
                    <input
                        type="file"
                        name="file"
                        accept=".xlsx, .xls"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                            if (e.target.files?.length) setMessage(`Selected: ${e.target.files[0].name}`);
                        }}
                    />
                    <div className="text-gray-500">
                        <p>클릭하여 파일을 선택하거나 이곳으로 드래그하세요.</p>
                        <p className="text-sm text-gray-400 mt-1">(.xlsx, .xls)</p>
                    </div>
                </div>

                {/* Status Message */}
                {message && (
                    <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${status === 'SUCCESS' ? 'bg-green-50 text-green-700' :
                            status === 'ERROR' ? 'bg-red-50 text-red-700' :
                                'bg-blue-50 text-blue-700'
                        }`}>
                        {status === 'UPLOADING' && <Loader2 className="w-4 h-4 animate-spin" />}
                        {status === 'SUCCESS' && <CheckCircle className="w-4 h-4" />}
                        {status === 'ERROR' && <AlertCircle className="w-4 h-4" />}
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={status === 'UPLOADING'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                    {status === 'UPLOADING' ? '업로드 및 처리중...' : '업로드 시작'}
                </button>
            </form>
        </div>
    );
}
