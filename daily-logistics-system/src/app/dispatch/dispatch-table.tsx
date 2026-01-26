'use client';

import { useState } from 'react';
import { updateOrderDriver } from './actions';
import { Loader2, Save, Truck } from 'lucide-react';

export default function DispatchTable({ initialOrders, drivers, date }: any) {
    const [orders, setOrders] = useState(initialOrders);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const handleDriverChange = async (orderId: number, newDriver: string) => {
        setUpdatingId(orderId);

        // Optimistic Update
        const oldOrders = [...orders];
        setOrders(orders.map((o: any) => o.id === orderId ? { ...o, driverName: newDriver } : o));

        const result = await updateOrderDriver(orderId, newDriver);

        if (!result.success) {
            // Revert on failure
            setOrders(oldOrders);
            alert('Failed to update driver');
        }
        setUpdatingId(null);
    };

    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="font-semibold flex items-center gap-2">
                    <Truck className="w-5 h-5 text-gray-600" />
                    배차 조정 ({date}) - 총 {orders.length}건
                </h2>
                {updatingId && <span className="text-sm text-blue-600 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> 저장 중...</span>}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 font-medium border-b">
                        <tr>
                            <th className="px-4 py-3 w-16">ID</th>
                            <th className="px-4 py-3">납품처 (매칭)</th>
                            <th className="px-4 py-3">품명 (Product)</th>
                            <th className="px-4 py-3 text-right">수량</th>
                            <th className="px-4 py-3 text-right">중량</th>
                            <th className="px-4 py-3 w-48 text-center bg-blue-50 border-x border-blue-100 font-bold text-blue-800">
                                배차 기사 (Driver)
                            </th>
                            <th className="px-4 py-3">차량정보</th>
                            <th className="px-4 py-3">도크</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {orders.map((order: any) => (
                            <tr key={order.id} className="hover:bg-gray-50 group">
                                <td className="px-4 py-3 text-gray-500">{order.id}</td>
                                <td className="px-4 py-3 font-medium text-gray-900">
                                    {order.deliveryPoint?.name || order.customerName}
                                </td>
                                <td className="px-4 py-3 text-gray-600">{order.productName}</td>
                                <td className="px-4 py-3 text-right">{order.qty}</td>
                                <td className="px-4 py-3 text-right font-mono text-xs">{order.weight}</td>

                                {/* Driver Editor */}
                                <td className="px-4 py-2 bg-blue-50/30 border-x border-blue-100 text-center relative">
                                    <select
                                        value={order.driverName || ''}
                                        onChange={(e) => handleDriverChange(order.id, e.target.value)}
                                        className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-1.5 shadow-sm"
                                        disabled={updatingId === order.id}
                                    >
                                        <option value="">(미지정)</option>
                                        {drivers.map((d: string) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </td>

                                <td className="px-4 py-3 text-gray-500 text-xs">
                                    {order.vehicle?.vehicleNo || '-'}
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs text-center">
                                    {order.vehicle?.dockNo || '-'}
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr><td colSpan={8} className="p-8 text-center text-gray-400">데이터가 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
