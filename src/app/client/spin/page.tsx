'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToastContainer from '@/components/ToastContainer';
import { useAuth } from '@/lib/auth';
import { useSiteSettings } from '@/lib/settings';
import {
  SpinWheel,
  PrizeTable,
  SpinHistory,
  SpinRules,
  ANIMATION,
  MAX_HISTORY_ITEMS,
} from './components';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SpinResult {
  label: string;
  amount: number;
}

interface HistoryItem extends SpinResult {
  time: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function calculateTargetRotation(
  currentRotation: number,
  rewardIndex: number,
  totalRewards: number
): number {
  const segAngle = 360 / totalRewards;
  const targetAngle = 360 - (rewardIndex * segAngle + segAngle / 2) + 270;
  return currentRotation + 360 * ANIMATION.FULL_ROTATIONS + (targetAngle % 360);
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

function HeroHeader() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1f35, #111827)',
      padding: '24px 16px',
      textAlign: 'center',
      borderBottom: '1px solid rgba(99,102,241,0.2)',
      marginBottom: 32,
    }}>
      <h1 style={{
        fontSize: 28,
        fontWeight: 900,
        color: '#ffd700',
        textShadow: '0 0 20px rgba(255,215,0,0.5)',
        marginBottom: 6,
      }}>
        🎡 Vòng Quay Bonus
      </h1>
      <p style={{ color: '#9ca3af', fontSize: 14 }}>
        Mua đơn hàng <strong style={{ color: '#f59e0b' }}>≥ 100.000đ</strong> nhận{' '}
        <strong style={{ color: '#10b981' }}>1 lượt quay miễn phí</strong> — Trúng thưởng lên đến{' '}
        <strong style={{ color: '#ffd700' }}>150.000đ</strong>!
      </p>
    </div>
  );
}

interface TicketDisplayProps {
  tickets: number;
}

function TicketDisplay({ tickets }: TicketDisplayProps) {
  const hasTickets = tickets > 0;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: hasTickets ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
      border: `1px solid ${hasTickets ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}`,
      borderRadius: 10,
      padding: '10px 20px',
    }}>
      <span style={{ fontSize: 24 }}>🎟️</span>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: hasTickets ? '#10b981' : '#ef4444' }}>
          {tickets} lượt quay
        </div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>Mua đơn ≥ 100.000đ để nhận thêm</div>
      </div>
    </div>
  );
}

interface SpinButtonProps {
  spinning: boolean;
  tickets: number;
  onSpin: () => void;
}

function SpinButton({ spinning, tickets, onSpin }: SpinButtonProps) {
  const disabled = spinning || tickets === 0;

  return (
    <button
      onClick={onSpin}
      disabled={disabled}
      style={{
        padding: '14px 48px',
        fontSize: 18,
        fontWeight: 900,
        fontFamily: 'inherit',
        background: disabled ? '#374151' : 'linear-gradient(135deg, #ffd700, #ff8c00, #ffd700)',
        backgroundSize: '200% auto',
        color: disabled ? '#6b7280' : '#000',
        border: 'none',
        borderRadius: 50,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 4px 20px rgba(255,215,0,0.5)',
        transition: 'all 0.3s',
        letterSpacing: 1,
        animation: disabled ? 'none' : 'pulse 2s infinite',
      }}
    >
      {spinning ? '🎰 Đang quay...' : tickets === 0 ? '🎟️ Không có lượt quay' : '🎰 QUAY NGAY (MIỄN PHÍ)'}
    </button>
  );
}

interface ResultDisplayProps {
  result: SpinResult;
}

function ResultDisplay({ result }: ResultDisplayProps) {
  const isWin = result.amount > 0;
  return (
    <div style={{
      padding: '16px 32px',
      borderRadius: 16,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: 700,
      background: isWin
        ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))'
        : 'rgba(99,102,241,0.1)',
      border: `2px solid ${isWin ? '#10b981' : '#6366f1'}`,
      color: isWin ? '#10b981' : '#6366f1',
      animation: 'fadeInUp 0.5s ease',
    }}>
      {isWin ? `🎉 Chúc mừng! Bạn trúng ${result.label}!` : `😅 ${result.label}! Thử lại nhé!`}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SpinPage() {
  const { user, updateBalance, addTransaction, showToast, getSpinTickets, consumeSpinTicket } = useAuth();
  const { settings } = useSiteSettings();

  const REWARDS = settings.spinRewards;
  const tickets = getSpinTickets();

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const handleSpin = () => {
    if (spinning) return;

    if (!user) {
      showToast('Vui lòng đăng nhập!', 'error');
      return;
    }

    const consumed = consumeSpinTicket();
    if (!consumed) {
      showToast('Bạn chưa có lượt quay! Mua đơn hàng ≥ 100.000đ để nhận lượt quay.', 'error');
      return;
    }

    setSpinning(true);
    setResult(null);

    // Use crypto for secure random selection
    const randomBytes = new Uint32Array(1);
    crypto.getRandomValues(randomBytes);
    const rewardIndex = randomBytes[0] % REWARDS.length;
    const reward = REWARDS[rewardIndex];
    const newRotation = calculateTargetRotation(rotation, rewardIndex, REWARDS.length);
    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);

      if (reward.amount > 0) {
        updateBalance(reward.amount);
        addTransaction({
          id: 'TX-' + Date.now(),
          userId: user.id,
          type: 'spin',
          amount: reward.amount,
          description: `Trúng thưởng vòng quay: ${reward.label}`,
          date: new Date().toISOString(),
          status: 'success',
        });
        setResult(reward);
        showToast(`🎉 Trúng ${reward.label}!`, 'success');
      } else {
        setResult(reward);
        showToast('😅 Chúc bạn may mắn lần sau!', 'info');
      }

      setHistory(prev => [
        { label: reward.label, amount: reward.amount, time: new Date().toLocaleTimeString('vi-VN') },
        ...prev.slice(0, MAX_HISTORY_ITEMS - 1),
      ]);
    }, ANIMATION.RESULT_DELAY_MS);
  };

  return (
    <>
      <Header />
      <ToastContainer />
      <div style={{ minHeight: '80vh', background: 'var(--bg-primary)', paddingBottom: 40 }}>
        <HeroHeader />

        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 16px',
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 32,
          alignItems: 'start',
        }}>
          {/* Wheel area */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            {/* Wheel wrapper */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {/* Glow behind wheel */}
              <div style={{
                position: 'absolute',
                inset: -20,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              {/* Pointer */}
              <div style={{
                position: 'absolute',
                top: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                <div style={{
                  width: 20,
                  height: 20,
                  background: 'radial-gradient(circle at 35% 35%, #ff9999, #cc0000, #800000)',
                  borderRadius: '50%',
                  border: '2px solid #ffd700',
                  boxShadow: '0 0 8px rgba(255,0,0,0.6)',
                }} />
                <div style={{
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '16px solid #cc0000',
                  marginTop: -2,
                }} />
              </div>

              {/* Canvas wheel */}
              <div style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 4.5s cubic-bezier(0.17, 0.67, 0.08, 0.99)' : 'none',
                borderRadius: '50%',
                boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 30px rgba(255,215,0,0.2)',
              }}>
                <SpinWheel rotation={rotation} spinning={spinning} rewards={REWARDS} />
              </div>
            </div>

            {/* Controls */}
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <TicketDisplay tickets={tickets} />
                <SpinButton spinning={spinning} tickets={tickets} onSpin={handleSpin} />
                {tickets === 0 && (
                  <div style={{ fontSize: 12, color: '#f59e0b', textAlign: 'center' }}>
                    💡 Mua đơn hàng ≥ <strong>100.000đ</strong> để nhận 1 lượt quay miễn phí!
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/client/login"
                style={{
                  padding: '14px 48px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  borderRadius: 50,
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                🔒 Đăng Nhập Để Chơi
              </Link>
            )}

            {result && <ResultDisplay result={result} />}
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <PrizeTable rewards={REWARDS} />
            <SpinHistory history={history} />
            <SpinRules />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(255,215,0,0.5); transform: scale(1); }
          50% { box-shadow: 0 4px 32px rgba(255,215,0,0.8); transform: scale(1.03); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Footer />
    </>
  );
}
