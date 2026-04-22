import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    ClassType, PositionType, ReceiptType, 
    Profile, TicketRow, PointsStats, MyRequest, Product, 
    PendingPurchase, Region, Filter,
    ShippingAddress, ShopRequestStatus, ShopPurchaseRequest
} from '../types/dashboard';
import { Home, Compass, MessageSquare, History, Wallet, User as UserIcon, LogOut, ChevronRight, Menu, X, ArrowLeft, Star, Edit2, Plus, ArrowRight } from 'lucide-react';
import { 
    calcAge, toISOStringFromKST, normalizePhone, clampInt 
} from '../utils/dashboardHelpers';

type MainTab = "home" | "request" | "history" | "cash";

// Subcomponents
import { StudentHome } from '../components/dashboard/StudentHome';
import { ChatList } from '../components/chat/ChatList';
import { ChatWindow } from '../components/chat/ChatWindow';
import { UnifiedBookingForm } from '../components/dashboard/UnifiedBookingForm';
import { StudentHistory } from '../components/dashboard/StudentHistory';
import { StudentCash } from '../components/dashboard/StudentCash';
import { ShippingManager } from '../components/dashboard/ShippingManager';
import { StudentShopHistory } from '../components/dashboard/StudentShopHistory';



const LIST_LIMIT = 80;
const FIXED_DURATION_MIN = 60;
const CLASS_TYPES: ClassType[] = ["A", "B", "C"];
const QTY_LIST = [1, 5, 10];
const POINT_WON = 1;

function useViewport() {
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
        const onResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);
    return { width, isMobile: width < 768, isTablet: width >= 768 && width < 1100, isDesktop: width >= 1100 };
}

export const Dashboard = () => {
    const { isMobile } = useViewport();
    const navigate = useNavigate();
    const location = useLocation();

    const [mainTab, setMainTab] = useState<MainTab>("home");
    const [session, setSession] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);

    const [tickets, setTickets] = useState<Record<ClassType, number>>({ A: 0, B: 0, C: 0 });
    const [editProfile, setEditProfile] = useState(false);
    
    // Profile Fields
    const [name, setName] = useState(""); 
    const [birthday, setBirthday] = useState("");
    const [position, setPosition] = useState<PositionType>("G"); 
    const [exp, setExp] = useState(""); 
    const [phone, setPhone] = useState("");
    const [photoUrl, setPhotoUrl] = useState("");

    const [rows, setRows] = useState<MyRequest[]>([]);
    const [filter, setFilter] = useState<Filter>("all");
    const [showCancelled, setShowCancelled] = useState(false);
    const [points, setPoints] = useState<PointsStats | null>(null);
    const [shopRequests, setShopRequests] = useState<ShopPurchaseRequest[]>([]);
    
    // Chat States
    const [selectedRoom, setSelectedRoom] = useState<{id: string, name: string, photo?: string} | null>(null);

    // Master Data & URL State
    const [regions, setRegions] = useState<Region[]>([]);
    const [classType, setClassType] = useState<ClassType>("A"); 

    // Cash Fields
    const [products, setProducts] = useState<Product[]>([]); 
    const [pending, setPending] = useState<PendingPurchase[]>([]);
    const [selectedClass, setSelectedClass] = useState<ClassType>("A"); 
    const [selectedQty, setSelectedQty] = useState<number>(1);
    const [depositorName, setDepositorName] = useState(""); 
    const [receiptType, setReceiptType] = useState<ReceiptType>("none");
    const [receiptValue, setReceiptValue] = useState(""); 
    const [usePointsInput, setUsePointsInput] = useState<string>("0");

    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) return navigate('/login');
            setSession(session);
            
            // Set initial tab from URL
            const queryParams = new URLSearchParams(location.search);
            const tabParam = queryParams.get('tab') as MainTab;
            const typeParam = queryParams.get('type') as ClassType;
            
            if (tabParam && ["home", "request", "history", "cash"].includes(tabParam)) {
                setMainTab(tabParam);
            }
            
            if (typeParam && ["A", "B", "C"].includes(typeParam)) {
                setClassType(typeParam);
            }
            
            loadAll(session.user);
        });
        
        // Removed local chat routing logic, now uses /messages route directly
    }, [navigate, location]);

    async function ensureMyProfileExists(user: any) {
        if (!user?.id) return;
        const { data: existing } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        const meta = user.user_metadata || {};
        
        if (!existing || !existing.name || !existing.phone || !existing.birthday) {
            await supabase.from("profiles").upsert({
                id: user.id,
                name: existing?.name || meta.name || user.email?.split("@")[0] || "이름없음",
                birthday: existing?.birthday || meta.birthday || "2000-01-01",
                position: existing?.position || meta.position || "G",
                experience_years: existing?.experience_years ?? (meta.experience_years ? Number(meta.experience_years) : null),
                phone: existing?.phone || (meta.phone ? normalizePhone(String(meta.phone)) : null),
            }, { onConflict: "id" });
        }
    }

    async function loadTickets(uid: string) {
        const { data } = await supabase.from("ticket_balances").select("class_type, balance").eq("user_id", uid);
        const next: Record<ClassType, number> = { A: 0, B: 0, C: 0 };
        (data as TicketRow[] | null)?.forEach(r => { next[r.class_type] = r.balance ?? 0 });
        setTickets(next);
    }
    async function loadMyRequests(uid: string) {
        const { data } = await supabase.from("class_requests").select("*").eq("student_id", uid).order("created_at", { ascending: false }).limit(LIST_LIMIT);
        setRows((data ?? []) as MyRequest[]);
    }
    async function loadPoints(uid: string) {
        const { data } = await supabase.from("user_points_stats").select("*").eq("user_id", uid).maybeSingle();
        setPoints((data as PointsStats | null) ?? { user_id: uid, balance: 0, earned_total: 0, spent_total: 0, completed_count: 0, review_count: 0, tier: "Rookie" });
    }
    async function loadMyPendingPurchases(uid: string) {
        const { data } = await supabase.from("purchases").select("*").eq("user_id", uid).eq("method", "cash").eq("status", "pending").order("created_at", { ascending: false }).limit(20);
        setPending((data ?? []) as PendingPurchase[]);
    }
    async function loadShopRequests(uid: string) {
        const { data } = await supabase.from("shop_purchase_requests").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(20);
        setShopRequests((data ?? []) as ShopPurchaseRequest[]);
    }
    async function loadShippingAddresses(_uid: string) {}

    async function loadAll(user: any) {
        setLoading(true); setMsg("");
        try {
            await ensureMyProfileExists(user);
            const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
            
            const [productsData, regionsData] = await Promise.all([
                supabase.from("products").select("*").eq("active", true),
                supabase.from("service_regions").select("*").eq("active", true).order("city").order("district")
            ]);
            
            setProducts((productsData.data ?? []) as Product[]);
            setRegions((regionsData.data ?? []) as Region[]);

            const pr = (p as Profile) ?? null;
            setProfile(pr);
            setName(pr?.name ?? ""); setBirthday(pr?.birthday ?? ""); setPosition((pr?.position ?? "G") as PositionType);
            setExp(pr?.experience_years?.toString() ?? ""); setPhone(pr?.phone ?? "");
            setPhotoUrl(pr?.photo_url ?? "");

            await Promise.all([
                loadTickets(user.id), loadMyRequests(user.id), loadPoints(user.id),
                loadMyPendingPurchases(user.id), loadShopRequests(user.id)
            ]);
        } catch (e: any) {
            setMsg(e?.message || "불러오기 실패");
        } finally {
            setLoading(false);
        }
    }

    async function refreshStudentData() {
        if (!session) return;
        setLoading(true); setMsg("");
        try {
            await Promise.all([
                loadTickets(session.user.id), loadMyRequests(session.user.id), loadPoints(session.user.id),
                loadMyPendingPurchases(session.user.id), loadShippingAddresses(session.user.id)
            ]);
        } catch (e: any) { setMsg(e?.message) } finally { setLoading(false) }
    }

    async function saveProfile() {
        if (!session) return;
        setLoading(true); setMsg("");
        try {
            const phoneTrim = normalizePhone(phone.trim());
            if (phoneTrim.length < 10) throw new Error("전화번호 형식이 올바르지 않습니다.");
            const expTrim = exp.trim();
            if (expTrim && !/^\d+$/.test(expTrim)) throw new Error("경력(년)은 숫자만 입력해 주세요.");
            const { error } = await supabase.from("profiles").upsert({
                id: session.user.id, name: name.trim(), birthday, position, experience_years: expTrim ? Number(expTrim) : null, phone: phoneTrim,
                photo_url: photoUrl
            }, { onConflict: "id" });
            if (error) throw error;
            setEditProfile(false); setMsg("프로필 저장 완료!");
            await loadAll(session.user);
        } catch (e: any) { setMsg(e?.message || "저장 실패") } finally { setLoading(false) }
    }

    async function cancelRequest(requestId: string) {
        if (!session) return; setLoading(true); setMsg("");
        const { error } = await supabase.rpc("cancel_class_request", { p_request_id: requestId });
        setLoading(false);
        if (error) return setMsg(`취소 실패: ${error.message}`);
        setMsg("취소 처리 완료(환불 여부는 정책에 따라 자동 적용)");
        refreshStudentData();
    }

    async function requestCash(productId: string) {
        if (!session) return;
        
        // Safety Limit: Max 30 tickets in total
        const currentTickets = Object.values(tickets).reduce((a, b) => a + b, 0);
        const buyingQty = selectedProduct?.ticket_qty || 0;
        if (currentTickets + buyingQty > 30) {
            return setMsg(`보유 티켓은 최대 30개까지만 가능합니다.\n현재 보유량: ${currentTickets}개 / 구매 예정: ${buyingQty}개`);
        }

        setLoading(true); setMsg("");
        const note = buildPurchaseNote(selectedProduct!);
        const { error } = await supabase.rpc("create_cash_purchase", {
            p_product_id: productId, p_payer_name: depositorName.trim(),
            p_cash_receipt_type: receiptType === "income" ? "income_deduction" : receiptType === "expense" ? "expense_proof" : "none",
            p_cash_receipt_value: receiptType === "none" ? null : receiptValue.trim(), p_points_use: usePoints, p_note: note,
        });
        setLoading(false);
        if (error) return setMsg(error.message);
        setMsg("현금 결제 요청이 등록되었습니다.\n입금 확인 후 티켓이 지급됩니다.");
        setUsePointsInput("0");
        refreshStudentData();
    }

    async function cancelPending(purchaseId: string) {
        if (!session) return; setLoading(true); setMsg("");
        const { error } = await supabase.rpc("cancel_cash_purchase", { p_purchase_id: purchaseId });
        setLoading(false);
        if (error) return setMsg(error.message);
        setMsg("구매요청 취소 완료. 포인트 자동 환급.");
        refreshStudentData();
    }

    const regionMap = useMemo(() => {
        const m = new Map<string, string>();
        regions.forEach(r => m.set(r.id, r.display_name));
        return m;
    }, [regions]);

    const productMap = useMemo(() => {
        const m = new Map<string, Product>();
        for (const p of products) m.set(`${p.class_type}-${p.ticket_qty}`, p);
        return m;
    }, [products]);

    const selectedProduct = productMap.get(`${selectedClass}-${selectedQty}`);
    const productPrice = selectedProduct?.price ?? 0;
    const availablePoints = points?.balance ?? 0;

    const parsedUsePoints = useMemo(() => {
        const n = Number((usePointsInput || "").trim().replace(/,/g, ""));
        return Number.isNaN(n) ? 0 : Math.floor(n);
    }, [usePointsInput]);
    const maxUsablePoints = useMemo(() => Math.min(availablePoints, Math.floor(productPrice / POINT_WON)), [availablePoints, productPrice]);
    const usePoints = useMemo(() => clampInt(parsedUsePoints, 0, maxUsablePoints), [parsedUsePoints, maxUsablePoints]);
    const pointsDiscountWon = usePoints * POINT_WON;
    const finalAmount = Math.max(0, productPrice - pointsDiscountWon);

    function buildPurchaseNote(p: Product) {
        const lines = [
            "[현금 결제 요청]", `상품: Class ${p.class_type} · ${p.ticket_qty}회`, `원가: ${p.price.toLocaleString()}원`,
            `포인트사용: ${usePoints.toLocaleString()}p(=${pointsDiscountWon.toLocaleString()}원)`, `최종금액: ${finalAmount.toLocaleString()}원`,
            `입금자명: ${depositorName.trim()}`, `현금영수증: ${receiptType}`
        ];
        if (receiptType !== "none") lines.push(`발급정보: ${receiptValue.trim()}`);
        return lines.join("\n");
    }

    if (loading && !session) return <div style={{ padding: 40, color: 'white', opacity: 0.5 }}>LOADING DASHBOARD...</div>;

    const emailText = session?.user?.email ?? "-";
    const ageText = profile?.birthday ? `${calcAge(profile.birthday)}세` : "-";
    const activeCount = rows.filter((r) => r.status === "requested" || r.status === "accepted").length;

    const TabBtn = ({ id, icon: Icon, active, onClick, label }: any) => (
        <button onClick={() => onClick(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 4px', borderRadius: 12, border: 'none', background: active ? 'rgba(255,255,255,0.1)' : 'transparent', color: active ? 'white' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: '0.2s' }}>
            <Icon size={20} />
            <span style={{ fontSize: 10, fontWeight: 700 }}>{label}</span>
        </button>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', color: 'white', paddingBottom: '100px' }}>
            {/* Header Section */}
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.6rem', letterSpacing: '-0.02em' }}>MY EXPERIENCE</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '1.1rem' }}>학습 현황과 티켓, 포인트를 통합 관리하세요.</p>
            </div>

            {/* Profile Info Row */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: '2rem' }}>
                <div style={chipStyle}>{emailText}</div>
                <div style={chipStyle}>{points?.tier?.toUpperCase()} TIER</div>
                <div style={{ ...chipStyle, background: 'var(--color-student)', border: 'none', color: 'white' }}>{(points?.balance ?? 0).toLocaleString()} P</div>
            </div>

            {/* Nav Tabs - Responsive Grid */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: window.innerWidth < 400 ? 'repeat(auto-fit, minmax(60px, 1fr))' : 'repeat(4, 1fr)', 
                gap: 4, 
                marginBottom: '1.5rem',
                overflowX: 'auto',
                paddingBottom: '8px'
            }}>
                <TabBtn id="home" icon={UserIcon} active={mainTab==='home'} onClick={setMainTab} label="홈" />
                <TabBtn id="request" icon={Compass} active={mainTab==='request'} onClick={setMainTab} label="예약" />
                <TabBtn id="history" icon={History} active={mainTab==='history'} onClick={setMainTab} label="내역" />
                <TabBtn id="cash" icon={Wallet} active={mainTab==='cash'} onClick={setMainTab} label="지갑" />
            </div>

            {/* Main Section */}
            <section className="card-minimal" style={{ minHeight: '600px', padding: '32px' }}>
                {msg && <div style={msgBoxStyle}>{msg}</div>}
                
                {mainTab === "home" && (
                    <StudentHome
                        tickets={tickets} points={points} activeCount={activeCount} loading={loading}
                        editProfile={editProfile} setEditProfile={setEditProfile} 
                        name={name} setName={setName} birthday={birthday} setBirthday={setBirthday} 
                        position={position} setPosition={setPosition} exp={exp} setExp={setExp} 
                        phone={phone} setPhone={setPhone} photoUrl={photoUrl} setPhotoUrl={setPhotoUrl}
                        saveProfile={saveProfile} ageText={ageText}
                    />
                )}
                {mainTab === "home" && !editProfile && (
                    <>
                        <ShippingManager uid={session?.user?.id} loading={loading} setLoading={setLoading} setMsg={setMsg} />
                        <StudentShopHistory requests={shopRequests} loading={loading} />
                    </>
                )}
                {mainTab === "request" && (
                    <UnifiedBookingForm
                        tickets={tickets}
                        regions={regions}
                        onSuccess={() => {
                            setMainTab("history");
                            refreshStudentData();
                        }}
                    />
                )}
                {mainTab === "history" && (
                    <StudentHistory
                        rows={rows.filter(r => r.status !== 'cancelled' && r.status !== 'rejected').filter(r => filter === 'all' ? true : r.status === filter)}
                        cancelledRows={rows.filter(r => r.status === 'cancelled' || r.status === 'rejected')}
                        filter={filter} setFilter={setFilter} showCancelled={showCancelled} setShowCancelled={setShowCancelled}
                        cancelRequest={cancelRequest} loading={loading} regionMap={regionMap}
                    />
                )}

                {mainTab === "cash" && (
                    <StudentCash
                        loading={loading} points={points} pending={pending} selectedClass={selectedClass} setSelectedClass={setSelectedClass}
                        classTypes={CLASS_TYPES} qtyList={QTY_LIST}
                        selectedQty={selectedQty} setSelectedQty={setSelectedQty} depositorName={depositorName} setDepositorName={setDepositorName}
                        receiptType={receiptType} setReceiptType={setReceiptType} receiptValue={receiptValue} setReceiptValue={setReceiptValue}
                        usePointsInput={usePointsInput} setUsePointsInput={setUsePointsInput}
                        requestCash={requestCash} cancelPending={cancelPending} selectedProduct={selectedProduct}
                        pointsDiscountWon={pointsDiscountWon} maxUsablePoints={maxUsablePoints} finalAmount={finalAmount}
                        estimatedReward={Math.floor(finalAmount * 0.01)}
                    />
                )}
            </section>
        </div>
    );
};

const chipStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", padding: "8px 20px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.05em' };
const tabOn: React.CSSProperties = { padding: "14px 20px", borderRadius: "12px", border: "none", background: "var(--color-student)", color: "#ffffff", cursor: "pointer", fontWeight: 900, fontSize: '0.85rem', letterSpacing: '0.05em', transition: 'all 0.3s' };
const tabOff: React.CSSProperties = { padding: "14px 20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.05em', transition: 'all 0.3s' };
const msgBoxStyle: React.CSSProperties = { padding: "16px 24px", borderRadius: "14px", background: "rgba(59, 130, 246, 0.05)", color: "#ffffff", marginBottom: 30, fontSize: '0.95rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'pre-line' };
