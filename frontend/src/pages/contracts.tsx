import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getContracts, getContract, createContract, updateContract,
  getCustomers, getPricingAppendices, createPricingAppendix, updatePricingAppendix, deletePricingAppendix,
  getEquipment,
} from '@/lib/api'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button, Input, Select, FormField, Modal } from '@/components/ui/primitives'
import { TableSkeleton, EmptyState, Card, CardHeader } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/toast'
import { Plus, Pencil, ChevronRight, Trash2, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Contract, PricingAppendix, PricingType } from '@/lib/types'

// ─── Contract Form ─────────────────────────────────────────────────────────

function ContractForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Partial<Contract>
  onSubmit: (data: Omit<Contract, 'id'>) => void
  loading: boolean
}) {
  const [form, setForm] = useState({
    contractNumber: initial?.contractNumber ?? '',
    customerId: String(initial?.customerId ?? ''),
    signingDate: initial?.signingDate ?? '',
    projectName: initial?.projectName ?? '',
    constructionSite: initial?.constructionSite ?? '',
    status: initial?.status ?? 'ACTIVE',
  })
  const { data: custPage } = useQuery({ queryKey: ['customers'], queryFn: () => getCustomers() })
  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })) }

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Số hợp đồng" required>
        <Input value={form.contractNumber} onChange={(e) => set('contractNumber', e.target.value)} required />
      </FormField>
      <FormField label="Khách hàng" required>
        <Select value={form.customerId} onChange={(e) => set('customerId', e.target.value)} required>
          <option value="">— Chọn khách hàng —</option>
          {custPage?.content.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
        </Select>
      </FormField>
      <FormField label="Ngày ký">
        <Input type="date" value={form.signingDate} onChange={(e) => set('signingDate', e.target.value)} />
      </FormField>
      <FormField label="Tên công trình">
        <Input value={form.projectName} onChange={(e) => set('projectName', e.target.value)} />
      </FormField>
      <FormField label="Địa điểm">
        <Input value={form.constructionSite} onChange={(e) => set('constructionSite', e.target.value)} />
      </FormField>
      <FormField label="Trạng thái">
        <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="EXPIRED">Hết hạn</option>
          <option value="TERMINATED">Đã chấm dứt</option>
        </Select>
      </FormField>
      <div className="flex justify-end gap-2 pt-2">
        <Button loading={loading} onClick={() => onSubmit({
          contractNumber: form.contractNumber,
          customerId: Number(form.customerId),
          signingDate: form.signingDate || undefined,
          projectName: form.projectName || undefined,
          constructionSite: form.constructionSite || undefined,
          status: form.status as Contract['status'],
        } as Omit<Contract, 'id'>)}>Lưu</Button>
      </div>
    </div>
  )
}

// ─── Pricing Form ──────────────────────────────────────────────────────────

function PricingForm({
  contractId,
  initial,
  onSubmit,
  loading,
}: {
  contractId: number
  initial?: Partial<PricingAppendix>
  onSubmit: (data: Omit<PricingAppendix, 'id'>) => void
  loading: boolean
}) {
  const [form, setForm] = useState({
    equipmentId: String(initial?.equipmentId ?? ''),
    pricingType: (initial?.pricingType ?? 'HOURLY') as PricingType,
    unitPrice: initial?.unitPrice ?? '',
    unitOfMeasure: initial?.unitOfMeasure ?? '',
  })
  const { data: eqPage } = useQuery({ queryKey: ['equipment'], queryFn: () => getEquipment() })
  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })) }
  const PRICING_LABELS: Record<PricingType, string> = { HOURLY: 'Giờ', DAILY: 'Ngày', MONTHLY: 'Tháng' }

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Thiết bị" required>
        <Select value={form.equipmentId} onChange={(e) => set('equipmentId', e.target.value)} required>
          <option value="">— Chọn thiết bị —</option>
          {eqPage?.content.map((eq) => <option key={eq.id} value={eq.id}>{eq.equipmentName} ({eq.serialRegistrationNumber})</option>)}
        </Select>
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Loại đơn giá">
          <Select value={form.pricingType} onChange={(e) => set('pricingType', e.target.value as PricingType)}>
            {Object.entries(PRICING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </FormField>
        <FormField label="Đơn giá (VNĐ)" required>
          <Input type="number" min="0" value={form.unitPrice} onChange={(e) => set('unitPrice', e.target.value)} required />
        </FormField>
      </div>
      <FormField label="Đơn vị tính">
        <Input value={form.unitOfMeasure} onChange={(e) => set('unitOfMeasure', e.target.value)} placeholder="VD: giờ, ca, tháng" />
      </FormField>
      <div className="flex justify-end gap-2 pt-2">
        <Button loading={loading} onClick={() => onSubmit({
          contractId,
          equipmentId: Number(form.equipmentId),
          pricingType: form.pricingType,
          unitPrice: form.unitPrice,
          unitOfMeasure: form.unitOfMeasure || undefined,
        } as Omit<PricingAppendix, 'id'>)}>Lưu</Button>
      </div>
    </div>
  )
}

// ─── Contracts List Page ───────────────────────────────────────────────────

export function ContractsPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Contract | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['contracts', search],
    queryFn: () => getContracts({ search: search || undefined }),
  })

  const createMut = useMutation({
    mutationFn: (body: Omit<Contract, 'id'>) => createContract(body),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['contracts'] }); setModal(null); toast('Đã thêm hợp đồng.', 'success') },
    onError: () => toast('Không thể thêm hợp đồng.', 'error'),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Omit<Contract, 'id'> }) => updateContract(id, body),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['contracts'] }); setModal(null); toast('Đã cập nhật hợp đồng.', 'success') },
    onError: () => toast('Không thể cập nhật hợp đồng.', 'error'),
  })

  const list = data?.content ?? []

  return (
    <AppShell>
      <PageHeader
        title="Hợp đồng"
        actions={<Button onClick={() => { setEditing(null); setModal('create') }}><Plus size={16} /> Thêm hợp đồng</Button>}
      />
      <div className="mb-4">
        <Input placeholder="Tìm kiếm hợp đồng..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-72" />
      </div>
      {isLoading ? <TableSkeleton rows={5} cols={6} /> : list.length === 0 ? (
        <EmptyState title="Chưa có hợp đồng nào" action={<Button onClick={() => setModal('create')}><Plus size={16} /> Thêm hợp đồng</Button>} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 text-left">Số HĐ</th>
                <th className="px-4 py-3 text-left">Công trình</th>
                <th className="px-4 py-3 text-left">Ngày ký</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-medium">{c.contractNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{c.projectName ?? c.constructionSite ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(c.signingDate)}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" onClick={() => { setEditing(c); setModal('edit') }} className="rounded p-1.5 text-blue-600 hover:bg-blue-50"><Pencil size={15} /></button>
                      <button type="button" onClick={() => navigate(`/contracts/${c.id}`)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100"><ExternalLink size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Thêm hợp đồng">
        <ContractForm onSubmit={(body) => createMut.mutate(body)} loading={createMut.isPending} />
      </Modal>
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Sửa hợp đồng">
        {editing && <ContractForm initial={editing} onSubmit={(body) => updateMut.mutate({ id: editing.id, body })} loading={updateMut.isPending} />}
      </Modal>
    </AppShell>
  )
}

// ─── Contract Detail Page (Pricing Appendices) ───────────────────────────

export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const contractId = Number(id)
  const { toast } = useToast()
  const qc = useQueryClient()
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editingPricing, setEditingPricing] = useState<PricingAppendix | null>(null)

  const { data: contract } = useQuery({ queryKey: ['contract', contractId], queryFn: () => getContract(contractId) })
  const { data: appendices, isLoading } = useQuery({
    queryKey: ['pricing-appendices', contractId],
    queryFn: () => getPricingAppendices(contractId),
  })

  const createMut = useMutation({
    mutationFn: (body: Omit<PricingAppendix, 'id'>) => createPricingAppendix(contractId, { equipmentId: body.equipmentId, pricingType: body.pricingType, unitPrice: body.unitPrice, unitOfMeasure: body.unitOfMeasure }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['pricing-appendices'] }); setModal(null); toast('Đã thêm phụ lục đơn giá.', 'success') },
    onError: () => toast('Không thể thêm phụ lục.', 'error'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id: pid, body }: { id: number; body: Omit<PricingAppendix, 'id'> }) => updatePricingAppendix(pid, body),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['pricing-appendices'] }); setModal(null); toast('Đã cập nhật phụ lục.', 'success') },
    onError: () => toast('Không thể cập nhật phụ lục.', 'error'),
  })

  const deleteMut = useMutation({
    mutationFn: (pid: number) => deletePricingAppendix(pid),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['pricing-appendices'] }); toast('Đã xóa phụ lục.', 'success') },
    onError: () => toast('Không thể xóa phụ lục.', 'error'),
  })

  const PRICING_LABELS: Record<PricingType, string> = { HOURLY: 'Giờ', DAILY: 'Ngày', MONTHLY: 'Tháng' }

  return (
    <AppShell>
      <PageHeader
        title={contract?.contractNumber ?? 'Hợp đồng'}
        breadcrumbs={[{ label: 'Hợp đồng', to: '/contracts' }, { label: contract?.contractNumber ?? '...' }]}
        actions={<Button onClick={() => { setEditingPricing(null); setModal('create') }}><Plus size={16} /> Thêm đơn giá</Button>}
      />
      {contract && (
        <div className="mb-6 grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-500">Công trình:</span> <span className="font-medium">{contract.projectName ?? '—'}</span></div>
          <div><span className="text-gray-500">Địa điểm:</span> <span className="font-medium">{contract.constructionSite ?? '—'}</span></div>
          <div><span className="text-gray-500">Trạng thái:</span> <StatusBadge status={contract.status} /></div>
        </div>
      )}
      <Card>
        <CardHeader title="Phụ lục đơn giá" description="Đơn giá theo thiết bị trong hợp đồng" />
        <div className="p-4">
          {isLoading ? <TableSkeleton rows={4} cols={5} /> : !appendices || appendices.length === 0 ? (
            <EmptyState title="Chưa có phụ lục đơn giá" action={<Button onClick={() => setModal('create')}><Plus size={16} /> Thêm đơn giá</Button>} />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 text-left">Thiết bị</th>
                  <th className="py-2 text-left">Loại</th>
                  <th className="py-2 text-right">Đơn giá</th>
                  <th className="py-2 text-left">ĐV tính</th>
                  <th className="py-2 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {appendices.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 font-medium">#{a.equipmentId}</td>
                    <td className="py-2 text-gray-500">{PRICING_LABELS[a.pricingType]}</td>
                    <td className="py-2 text-right font-mono">{Number(a.unitPrice).toLocaleString('vi-VN')} ₫</td>
                    <td className="py-2 text-gray-500">{a.unitOfMeasure ?? '—'}</td>
                    <td className="py-2">
                      <div className="flex justify-center gap-1">
                        <button type="button" onClick={() => { setEditingPricing(a); setModal('edit') }} className="rounded p-1.5 text-blue-600 hover:bg-blue-50"><Pencil size={14} /></button>
                        <button type="button" onClick={() => { if (confirm('Xóa phụ lục này?')) deleteMut.mutate(a.id) }} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Thêm phụ lục đơn giá">
        <PricingForm contractId={contractId} onSubmit={(body) => createMut.mutate(body)} loading={createMut.isPending} />
      </Modal>
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Sửa phụ lục đơn giá">
        {editingPricing && <PricingForm contractId={contractId} initial={editingPricing} onSubmit={(body) => updateMut.mutate({ id: editingPricing.id, body })} loading={updateMut.isPending} />}
      </Modal>
    </AppShell>
  )
}
