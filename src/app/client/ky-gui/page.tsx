'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToastContainer from '@/components/ToastContainer';

// Components
import {
  HeroBanner,
  TabSwitcher,
  ListingCard,
  InstructionsPanel,
  EmptyListings,
  LoginRequired,
  INITIAL_FORM,
  TabType,
  ConsignmentForm as FormData,
} from './components';
import { ConsignmentForm } from './components/ConsignmentForm';
import { MyConsignmentsSidebar } from './components/MyConsignmentsSidebar';

export default function KyGuiPage() {
  const { user, getConsignments, submitConsignment, deleteConsignment } = useAuth();
  const [tab, setTab] = useState<TabType>('list');
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  
  // Data
  const myItems = refreshKey >= 0 && user ? getConsignments(user.id) : [];
  const pendingListings = refreshKey >= 0 ? getConsignments().filter(c => c.status === 'approved') : [];

  // Handlers
  const handleSubmit = useCallback(() => {
    if (!user) { 
      alert('Vui lòng đăng nhập!'); 
      return; 
    }
    if (!form.title || !form.accountData || !form.askPrice) {
      alert('Vui lòng điền đầy đủ thông tin!'); 
      return;
    }
    
    submitConsignment({
      userId: user.id, 
      username: user.username,
      title: form.title, 
      description: form.description,
      categoryName: form.categoryName,
      accountData: form.accountData,
      askPrice: Number(form.askPrice),
      images: '',
    });
    
    setForm(INITIAL_FORM);
    setTab('list');
    setRefreshKey(k => k + 1);
  }, [user, form, submitConsignment]);

  const handleDelete = useCallback((id: string) => {
    if (!confirm('Hủy ký gửi này?')) return;
    deleteConsignment(id);
    setRefreshKey(k => k + 1);
  }, [deleteConsignment]);

  const updateForm = useCallback((key: keyof FormData, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
  }, []);

  return (
    <div>
      <Header />
      <ToastContainer />
      
      <div className="main-content" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <HeroBanner />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
          {/* Main Content Area */}
          <div>
            <TabSwitcher tab={tab} onChange={setTab} />

            {/* Submit Form Tab */}
            {tab === 'submit' && (
              user ? (
                <ConsignmentForm 
                  form={form} 
                  onSubmit={handleSubmit} 
                  onUpdate={updateForm} 
                />
              ) : (
                <LoginRequired message="Vui lòng đăng nhập để ký gửi tài khoản" />
              )
            )}

            {/* Listings Tab */}
            {tab === 'list' && (
              <div>
                <div style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 13 }}>
                  {pendingListings.length} tài khoản đang được ký gửi
                </div>
                
                {pendingListings.length === 0 ? (
                  <EmptyListings onSubmit={() => setTab('submit')} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {pendingListings.map(c => <ListingCard key={c.id} item={c} />)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div>
            {user ? (
              <MyConsignmentsSidebar 
                items={myItems} 
                onDelete={handleDelete} 
                onSubmitClick={() => setTab('submit')} 
              />
            ) : (
              <InstructionsPanel />
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
