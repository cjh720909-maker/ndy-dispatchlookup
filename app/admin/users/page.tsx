import { redirect } from 'next/navigation';
import { getSession } from '../../../lib/auth';
import { getUsers, addUser, deleteUser } from './server-action';

export default async function AdminUsersPage() {
    const session = await getSession();

    // Admin 권한 확인 (admin 아이디만 접근 가능)
    if (!session || session.username !== 'admin') {
        redirect('/login');
    }

    const { data: users, error } = await getUsers();

    return (
        <div className="min-h-screen bg-gray-50 p-4 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">사용자 관리</h1>
                        <p className="text-gray-500 text-sm mt-1">로그인 계정을 생성하고 관리합니다.</p>
                    </div>
                    <a
                        href="/mobile/dispatch"
                        className="text-sm px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        홈으로 돌아가기
                    </a>
                </header>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                {/* 계정 추가 폼 */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">신규 계정 추가</h2>
                    <form action={async (formData) => {
                        'use server';
                        await addUser(formData);
                    }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            name="username"
                            type="text"
                            placeholder="아이디"
                            required
                            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                        />
                        <input
                            name="password"
                            type="password"
                            placeholder="비밀번호"
                            required
                            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                        />
                        <input
                            name="companyName"
                            type="text"
                            placeholder="회사명 (선택)"
                            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:scale-95 transition-all text-sm shadow-md shadow-blue-100"
                        >
                            계정 생성하기
                        </button>
                    </form>
                </section>

                {/* 사용자 목록 */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800">등록된 계정 목록</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">아이디</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">소속 회사</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">생성일</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">작업</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users?.map((user: any) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {user.companyName ? (
                                                <span className="px-2 py-1 bg-green-50 text-green-600 rounded-md text-xs font-medium">
                                                    {user.companyName}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">관리자</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            {user.username !== 'admin' && (
                                                <form action={async () => {
                                                    'use server';
                                                    await deleteUser(user.id);
                                                }}>
                                                    <button
                                                        type="submit"
                                                        className="text-red-500 hover:text-red-700 font-medium transition-colors"
                                                    >
                                                        삭제
                                                    </button>
                                                </form>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users?.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm">
                                            등록된 사용자가 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}
