'use client';

import { TabPanelProps, INPUT_STYLE, LABEL_STYLE } from './constants';

export function SpinTab({ settings, onUpdate }: TabPanelProps) {
  const handleRewardChange = (
    index: number, 
    field: 'color' | 'label' | 'amount', 
    value: string | number
  ) => {
    const rewards = [...settings.spinRewards];
    rewards[index] = { 
      ...rewards[index], 
      [field]: field === 'amount' ? Number(value) : value 
    };
    onUpdate('spinRewards', rewards);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e8eaed', margin: 0 }}>
        Cấu Hình Vòng Quay
      </h2>
      <div>
        <label style={LABEL_STYLE}>Chi Phí Mỗi Lần Quay (VNĐ)</label>
        <input 
          type="number" 
          value={settings.spinCost} 
          onChange={e => onUpdate('spinCost', Number(e.target.value))} 
          style={INPUT_STYLE} 
        />
      </div>
      <div>
        <label style={LABEL_STYLE}>
          Phần Thưởng ({settings.spinRewards.length} ô)
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {settings.spinRewards.map((reward, index) => (
            <RewardRow
              key={index}
              reward={reward}
              onChange={(field, value) => handleRewardChange(index, field, value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface Reward {
  color: string;
  label: string;
  amount: number;
}

function RewardRow({ 
  reward, 
  onChange 
}: { 
  reward: Reward; 
  onChange: (field: 'color' | 'label' | 'amount', value: string | number) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input 
        type="color" 
        value={reward.color} 
        onChange={e => onChange('color', e.target.value)} 
        style={{ 
          width: 40, height: 36, border: 'none', 
          borderRadius: 6, background: 'none', cursor: 'pointer' 
        }} 
      />
      <input 
        value={reward.label} 
        placeholder="Nhãn" 
        onChange={e => onChange('label', e.target.value)} 
        style={{ ...INPUT_STYLE, flex: 2 }} 
      />
      <input 
        type="number" 
        value={reward.amount} 
        placeholder="Số tiền" 
        onChange={e => onChange('amount', e.target.value)} 
        style={{ ...INPUT_STYLE, flex: 1 }} 
      />
    </div>
  );
}
