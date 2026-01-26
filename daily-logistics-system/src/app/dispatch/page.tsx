import { getDispatchData } from './actions';
import DispatchTable from './dispatch-table';

export default async function DispatchPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams;
    const today = new Date().toISOString().split('T')[0];
    const date = (resolvedParams?.date as string) || today;

    // Fetch Data
    const { orders, drivers } = await getDispatchData(date);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">배차 조정 (Dispatch)</h1>
                        <p className="text-gray-500">일자별 배차 현황 조회 및 수정</p>
                    </div>

                    {/* Date Filter */}
                    <form className="flex items-center gap-2 bg-white p-2 rounded shadow-sm border">
                        <label htmlFor="date" className="text-sm font-medium text-gray-700">운행일자:</label>
                        <input
                            type="date"
                            name="date"
                            defaultValue={date}
                            className="border-gray-300 rounded text-sm px-2 py-1 border"
                        />
                        <button type="submit" className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700">
                            조회
                        </button>
                    </form>
                </div>

                <DispatchTable
                    initialOrders={orders}
                    drivers={drivers}
                    date={date}
                />
            </div>
        </div>
    );
}
