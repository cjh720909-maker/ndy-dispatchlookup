import LogList from '@/app/upload/log-list'; // We will create this or inline it?
// Server Components allow inline async logic.

import { prisma } from '@/lib/prisma';
import UploadForm from './upload-form';

export default async function UploadPage() {
    // Fetch recent uploads to confirm "Magic" worked
    const recentOrders = await prisma.order.findMany({
        take: 10,
        orderBy: { id: 'desc' },
        include: {
            deliveryPoint: true,
            vehicle: true, // Join to show assigned driver
        }
    });

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">발주 관리 시스템</h1>
                    <p className="text-gray-500">일일 배차 및 주문 관리 - 엑셀 업로드</p>
                </div>

                <UploadForm />

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">최근 업로드 내역 (Recent 10)</h3>
                        <span className="text-xs text-gray-400">자동 새로고침됨</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">일자</th>
                                    <th className="px-4 py-3">거래처 (Excel)</th>
                                    <th className="px-4 py-3 text-blue-600">납품처 (매칭)</th>
                                    <th className="px-4 py-3 text-green-600">기사 (자동)</th>
                                    <th className="px-4 py-3">품명</th>
                                    <th className="px-4 py-3 text-right">수량</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-mono text-gray-500">{order.id}</td>
                                        <td className="px-4 py-3">{order.date}</td>
                                        <td className="px-4 py-3 font-medium">{order.customerName}</td>
                                        <td className="px-4 py-3 text-blue-600">
                                            {order.deliveryPoint?.name || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-green-600">
                                            {order.driverName || '-'}
                                        </td>
                                        <td className="px-4 py-3">{order.productName}</td>
                                        <td className="px-4 py-3 text-right">{order.qty}</td>
                                    </tr>
                                ))}
                                {recentOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                            아직 업로드된 데이터가 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
