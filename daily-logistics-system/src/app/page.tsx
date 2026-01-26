import { Upload, Truck, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          물류 통합 관리 시스템
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          일일 발주 처리부터 배차 조정까지 한번에 처리하세요.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl px-4 sm:px-0">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Card 1: Upload */}
          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <Upload className="h-8 w-8 text-blue-600" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">주문 접수</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">엑셀 발주 업로드</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/upload" className="font-medium text-blue-700 hover:text-blue-900 flex items-center">
                  시작하기 <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2: Dispatch */}
          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <Truck className="h-8 w-8 text-green-600" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">배차 관리</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">배차 조정 및 확정</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/dispatch" className="font-medium text-green-700 hover:text-green-900 flex items-center">
                  조회하기 <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
