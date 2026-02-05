'use server';

import { authDb, logisticsDb } from '../../lib/db';
import { getSession } from '../../lib/auth';
import iconv from 'iconv-lite';
import { revalidatePath } from 'next/cache';

function fromLegacy(str: string | null | undefined): string {
    if (!str) return '';
    try { return iconv.decode(Buffer.from(str, 'binary'), 'euc-kr'); } catch (e) { return str || ''; }
}

export interface DetailedDispatch {
    customerName: string;
    address: string | null;
    customerPhone: string | null;
    qty: number;
    weight: number;
    sequence: number;
    cbCode: string | null; // 매칭을 위한 코드 보관
}

export interface DailyDispatchInfo {
    driverCode: string;         // CB_DRIVER (Legacy Code)
    driverName: string;         // CB_DRIVER (Decoded)
    realDriverName: string;     // CA_NAME (마스터상의 실명)
    vehicleNo: string;
    vehicleType: string;
    transportCompany: string;
    phoneNumber: string | null;
    isRegistered: boolean;
    dispatchCount: number;
    totalQty: number;           // 총 물량 (EA)
    totalWeight: number;        // 총 중량 (KG)
    details: DetailedDispatch[]; // 상세 배차 정보 (거래처, 주소, 중량 등)
    matchedDriverName?: string; // 오늘 매칭된 실제 기사 이름
}

export interface TransportDriver {
    id: number;
    name: string;
    phoneNumber: string;
    vehicleNumber: string | null;
}

/**
 * 당일 배차 데이터 및 기사 풀 정보를 가져옵니다.
 */
export async function getDailyDispatchData(dateStr: string) {
    const session = await getSession();
    if (!session) return { error: '세션이 만료되었습니다.' };

    try {
        // 1. 운수업체 기사 풀(Master Pool) 가져오기
        const driverPoolDelegate = (authDb as any).transportDriver;
        const driverPool = driverPoolDelegate
            ? await driverPoolDelegate.findMany({ where: { transportCompany: session.companyName || '이룸' } })
            : [];

        // 2. 오늘 등록된 기사 정보 가져오기
        const registrations = await authDb.dailyDriverRegistration.findMany({
            where: { date: dateStr }
        });

        // 2.5 오늘 설정된 배송 순서 가져오기
        const deliverySequenceDelegate = (authDb as any).deliverySequence;
        const sequences = deliverySequenceDelegate
            ? await deliverySequenceDelegate.findMany({ where: { date: dateStr } })
            : [];

        // 3. 오늘 모든 배차 데이터 가져오기
        const allOrders = await logisticsDb.order.findMany({
            where: { date: dateStr }
        });

        const driverCodesSet = new Set(allOrders.filter(o => o.driverName).map(o => o.driverName as string));
        const driverCodes = Array.from(driverCodesSet);

        // 4. 배송지 정보 가져오기 (CB_CODE 매칭을 위해)
        const cbCodesSet = new Set(allOrders.filter(o => (o as any).cbCode).map(o => (o as any).cbCode as string));
        const cbCodes = Array.from(cbCodesSet);


        const deliveryPoints = await logisticsDb.deliveryPoint.findMany({
            where: { code: { in: cbCodes } }
        });


        // 4. 배차된 기사들의 상세 정보 가져오기 (t_car)
        const vehicles = await logisticsDb.vehicle.findMany({
            where: { driverName: { in: driverCodes } }
        });

        // 5. 데이터 조합 및 필터링
        let result: DailyDispatchInfo[] = [];

        for (const drvCode of driverCodes) {
            const v = vehicles.find(vh => vh.driverName === drvCode);
            if (!v) continue;

            const vehicleNo = fromLegacy(v.vehicleNo);
            const legacyRealDriverName = fromLegacy(v.realDriverName);
            const driverPhoneFromMaster = fromLegacy(v.driverPhone); // CA_HP

            // 조건 1: 기사명, 차량번호 중 '이룸' 또는 'OUTSOURCED' 포함 여부 확인
            const hasKeyword =
                vehicleNo.toUpperCase().includes('이룸') ||
                vehicleNo.toUpperCase().includes('OUTSOURCED') ||
                legacyRealDriverName.toUpperCase().includes('이룸') ||
                legacyRealDriverName.toUpperCase().includes('OUTSOURCED');

            if (!hasKeyword) continue;

            // 조건 2: 이미 연락처(CA_HP)가 있으면 제외 (고정차량)
            if (driverPhoneFromMaster && driverPhoneFromMaster.trim().length > 0) continue;

            const decodedCode = fromLegacy(drvCode);
            const reg = registrations.find(r => r.driverName === decodedCode);

            // 해당 기사의 상세 배차 정보 계산
            const orders = allOrders.filter(o => o.driverName === drvCode);

            // 거래처별 요약 정보 생성
            const customerSummary: Record<string, DetailedDispatch> = {};
            let totalQtySum = 0;
            let totalWeightSum = 0;

            orders.forEach(o => {
                const cName = fromLegacy(o.customerName);
                if (!cName) return;

                // 거래처 코드로 매칭되는 배송지 정보 찾기
                const dp = deliveryPoints.find(p => p.code === (o as any).cbCode);


                const address = fromLegacy(dp?.address);
                const rawPhone = (fromLegacy(dp?.hp) || fromLegacy(dp?.phone)).trim();
                const phone = (rawPhone && rawPhone !== '' && rawPhone !== '0' && rawPhone !== '0-0') ? rawPhone : null;
                const qty = o.qty || 0;
                const weight = Number(o.weight) || 0;

                totalQtySum += qty;
                totalWeightSum += weight;

                // 배송 순서 찾기 (매칭 정보와 일관성을 위해 디코딩된 기사명 사용)
                const seqInfo = sequences.find((s: any) => s.driverName === decodedCode && s.cbCode === (o as any).cbCode);



                if (!customerSummary[cName]) {
                    customerSummary[cName] = {
                        customerName: cName,
                        address: address,
                        customerPhone: phone,
                        qty: 0,
                        weight: 0,
                        sequence: seqInfo?.sequence || 999, // 기본값은 뒤로 밀리게 999
                        cbCode: (o as any).cbCode || null
                    };
                }
                customerSummary[cName].qty += qty;
                customerSummary[cName].weight += weight;
            });

            // 결과 상세 내역을 순회하며 정렬 (순서 -> 이름순)
            const sortedDetails = Object.values(customerSummary).sort((a, b) => {
                if (a.sequence !== b.sequence) return a.sequence - b.sequence;
                return a.customerName.localeCompare(b.customerName);
            });

            // 표시용 성함 결정
            let displayName = 'OUTSOURCED';
            if (reg) {
                displayName = reg.realDriverName || '';
                if (!displayName && reg.phoneNumber) {
                    const poolMatch = driverPool.find((p: any) => p.phoneNumber === reg.phoneNumber);
                    if (poolMatch) displayName = poolMatch.name;
                }
                if (!displayName) displayName = legacyRealDriverName;
            }

            result.push({
                driverCode: drvCode,
                driverName: decodedCode,
                realDriverName: displayName,
                vehicleNo: reg?.vehicleNumber || vehicleNo || '-',
                vehicleType: 'outsourced',
                transportCompany: '이룸',
                phoneNumber: reg?.phoneNumber || null,
                isRegistered: !!reg,
                dispatchCount: Object.keys(customerSummary).length,
                totalQty: totalQtySum,
                totalWeight: totalWeightSum,
                details: sortedDetails,
                matchedDriverName: reg?.realDriverName || undefined
            });
        }

        return {
            data: result,
            driverPool: driverPool as TransportDriver[],
            user: {
                username: session.username,
                role: session.role,
                companyName: session.companyName
            }
        };

    } catch (error) {
        console.error('[getDailyDispatchData Error]', error);
        return { error: '데이터를 가져오는 중 오류가 발생했습니다.' };
    }
}

/**
 * 기사 풀에 신규 기사를 등록합니다.
 */
export async function addDriverToPool(formData: FormData) {
    const session = await getSession();
    if (!session) return { error: '권한이 없습니다.' };

    const name = formData.get('name') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const vehicleNumber = formData.get('vehicleNumber') as string;

    try {
        const driverPoolDelegate = (authDb as any).transportDriver;
        if (!driverPoolDelegate) throw new Error('데이터베이스 초기화 중입니다. 잠시 후 다시 시도해 주세요.');

        await driverPoolDelegate.create({
            data: {
                name,
                phoneNumber,
                vehicleNumber: vehicleNumber || null,
                transportCompany: session.companyName || '이룸'
            }
        });
        revalidatePath('/daily-dispatch');
        return { success: true };
    } catch (error: any) {
        if (error.code === 'P2002') return { error: '이미 등록된 기사 정보입니다.' };
        return { error: '등록 실패: ' + error.message };
    }
}

/**
 * 기사 풀에서 기사를 삭제합니다.
 */
export async function deleteDriverFromPool(id: number) {
    try {
        const driverPoolDelegate = (authDb as any).transportDriver;
        await driverPoolDelegate.delete({ where: { id } });
        revalidatePath('/daily-dispatch');
        return { success: true };
    } catch (error: any) {
        return { error: '삭제 실패: ' + error.message };
    }
}

/**
 * 배차된 차량에 기사 풀의 기사를 매칭합니다.
 */
export async function matchDriver(date: string, driverCode: string, poolDriverId: number) {
    const session = await getSession();
    if (!session) return { error: '권한이 없습니다.' };

    try {
        const driverPoolDelegate = (authDb as any).transportDriver;
        const poolDriver = await driverPoolDelegate.findUnique({
            where: { id: poolDriverId }
        });

        if (!poolDriver) return { error: '선택한 기사 정보가 없습니다.' };

        await authDb.dailyDriverRegistration.upsert({
            where: {
                date_driverName_transportCompany: {
                    date,
                    driverName: driverCode,
                    transportCompany: session.companyName || '이룸'
                }
            },
            create: {
                date,
                driverName: driverCode,
                transportCompany: session.companyName || '이룸',
                vehicleNumber: poolDriver.vehicleNumber,
                phoneNumber: poolDriver.phoneNumber,
                realDriverName: poolDriver.name
            },
            update: {
                vehicleNumber: poolDriver.vehicleNumber,
                phoneNumber: poolDriver.phoneNumber,
                realDriverName: poolDriver.name
            }
        });

        revalidatePath('/daily-dispatch');
        return { success: true };
    } catch (error: any) {
        return { error: '매칭 실패: ' + error.message };
    }
}

/**
 * 배송 순서를 업데이트합니다.
 */
export async function updateDeliverySequence(date: string, driverCode: string, cbCode: string, sequence: number) {
    try {
        const session = await getSession();
        if (!session) return { error: '권한이 없습니다.' };

        await (authDb as any).deliverySequence.upsert({
            where: {
                date_driverName_cbCode: {
                    date,
                    driverName: driverCode,
                    cbCode
                }
            },
            update: { sequence },
            create: {
                date,
                driverName: driverCode,
                cbCode,
                sequence
            }
        });

        revalidatePath('/daily-dispatch');
        return { success: true };
    } catch (error: any) {
        console.error('[updateDeliverySequence Error]', error);
        return { error: '순서 업데이트 실패: ' + error.message };
    }
}

