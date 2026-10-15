import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Asset, RequestItem, RequestStatus, TeamMember } from '../core/models';

export interface RequestDraft { items: RequestItem[]; projectName: string; projectAbstract: string; loanDays: number; startDate: string; teamMembers: TeamMember[]; }
interface SubmissionState { status: RequestStatus | 'IDLE' | 'SUBMITTING' | 'ERROR'; requestId: string | null; error: string | null; }
const emptyDraft: RequestDraft = { items: [], projectName: '', projectAbstract: '', loanDays: 1, startDate: '', teamMembers: [] };

export const RequestStore = signalStore(
  { providedIn: 'root' },
  withState<{ draft: RequestDraft; submission: SubmissionState }>({ draft: emptyDraft, submission: { status: 'IDLE', requestId: null, error: null } }),
  withComputed(({ draft }) => ({
    itemCount: computed(() => draft().items.reduce((total, item) => total + item.quantity, 0)),
    hasItems: computed(() => draft().items.length > 0),
    expectedReturn: computed(() => { const start = draft().startDate ? new Date(`${draft().startDate}T00:00:00`) : null; if (!start || Number.isNaN(start.getTime())) return ''; start.setDate(start.getDate() + draft().loanDays); return start.toISOString().slice(0, 10); })
  })),
  withMethods((store) => ({
    addAsset(asset: Asset, quantity = 1): void {
      if (asset.availableQty < 1 || quantity < 1) return;
      const existing = store.draft().items.find(item => item.assetId === asset.id);
      const items = existing ? store.draft().items.map(item => item.assetId === asset.id ? { ...item, quantity: Math.min(item.quantity + quantity, asset.availableQty) } : item) : [...store.draft().items, { assetId: asset.id, asset, quantity: Math.min(quantity, asset.availableQty) }];
      patchState(store, { draft: { ...store.draft(), items } });
    },
    setQuantity(assetId: string, quantity: number): void { patchState(store, { draft: { ...store.draft(), items: store.draft().items.map(item => item.assetId === assetId ? { ...item, quantity: item.asset.availableQty > 0 ? Math.max(1, Math.min(quantity, item.asset.availableQty)) : 0 } : item) } }); },
    removeAsset(assetId: string): void { patchState(store, { draft: { ...store.draft(), items: store.draft().items.filter(item => item.assetId !== assetId) } }); },
    updateProject(fields: Partial<Omit<RequestDraft, 'items'>>): void { patchState(store, { draft: { ...store.draft(), ...fields } }); },
    addTeamMember(member: TeamMember): void { patchState(store, { draft: { ...store.draft(), teamMembers: [...store.draft().teamMembers, member] } }); },
    updateTeamMember(index: number, member: TeamMember): void { patchState(store, { draft: { ...store.draft(), teamMembers: store.draft().teamMembers.map((item, itemIndex) => itemIndex === index ? member : item) } }); },
    removeTeamMember(index: number): void { patchState(store, { draft: { ...store.draft(), teamMembers: store.draft().teamMembers.filter((_, itemIndex) => itemIndex !== index) } }); },
    beginSubmission(): void { patchState(store, { submission: { status: 'SUBMITTING', requestId: null, error: null } }); },
    completeSubmission(requestId: string): void { patchState(store, { submission: { status: RequestStatus.PENDING, requestId, error: null } }); },
    failSubmission(error: string): void { patchState(store, { submission: { status: 'ERROR', requestId: null, error } }); },
    clearItems(): void { patchState(store, { draft: { ...store.draft(), items: [] } }); },
    clear(): void { patchState(store, { draft: emptyDraft, submission: { status: 'IDLE', requestId: null, error: null } }); }
  }))
);
