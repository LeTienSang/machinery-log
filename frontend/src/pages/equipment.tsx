import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEquipment, createEquipment, updateEquipment, deleteEquipment } from '@/lib/api'
import { AppShell, PageHeader } from '@/components/layout/app-shell'
import { Button, Input, FormField, Modal } from '@/components/ui/primitives'
import { TableSkeleton, EmptyState } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Equipment } from '@/lib/types'

function EquipmentForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Partial<Equipment>
  onSubmit: (data: Omit<Equipment, 'id'>) => void
  loading: boolean
}) {
  const [form, setForm] = useState({
    equipmentName: initial?.equipmentName ?? '',
    serialRegistrationNumber: initial?.serialRegistrationNumber ?? '',
    equipmentType: initial?.equipmentType ?? '',
  })
  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })) }

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Tên thiết bị" required>
        <Input value={form.equipmentName} onChange={(e) => set('equipmentName', e.target.value)} required />
      </FormField>
      <FormField label="Số đăng ký / Series" required>
        <Input value={form.serialRegistrationNumber} onChange={(e) => set('serialRegistrationNumber', e.target.value)} required />
      </FormField>
      <FormField label="Loại thiết bị">
        <Input value={form.equipmentType} onChange={(e) => set('equipmentType', e.target.value)} placeholder="VD: Máy đào, Xe cẩu..." />
      </FormField>
      <div className="flex justify-end gap-2 pt-2">
        <Button loading={loading} onClick={() => onSubmit(form as Omit<Equipment, 'id'>)}>Lưu</Button>
      </div>
    </div>
  )
}

export function EquipmentPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Equipment | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['equipment', search],
    queryFn: () => getEquipment(search || undefined),
  })

  const createMut = useMutation({
    mutationFn: (body: Omit<Equipment, 'id'>) => createEquipment(body),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['equipment'] }); setModal(null); toast('Đã thêm thiết bị.', 'success') },
    onError: () => toast('Không thể thêm thiết bị.', 'error'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Omit<Equipment, 'id'> }) => updateEquipment(id, body),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['equipment'] }); setModal(null); toast('Đã cập nhật thiết bị.', 'success') },
    onError: () => toast('Không thể cập nhật thiết bị.', 'error'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteEquipment(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['equipment'] }); toast('Đã xóa thiết bị.', 'success') },
    onError: () => toast('Không thể xóa thiết bị.', 'error'),
  })

  const list = data?.content ?? []

  return (
    <AppShell>
      <PageHeader
        title="Thiết bị"
        actions={
          <Button onClick={() => { setEditing(null); setModal('create') }}>
            <Plus size={16} /> Thêm thiết bị
          </Button>
        }
      />
      <div className="mb-4">
        <Input placeholder="Tìm kiếm thiết bị..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-72" />
      </div>
      {isLoading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : list.length === 0 ? (
        <EmptyState title="Chưa có thiết bị nào" action={<Button onClick={() => setModal('create')}><Plus size={16} /> Thêm thiết bị</Button>} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 text-left">Tên thiết bị</th>
                <th className="px-4 py-3 text-left">Số đăng ký</th>
                <th className="px-4 py-3 text-left">Loại</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.map((eq) => (
                <tr key={eq.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-medium">{eq.equipmentName}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{eq.serialRegistrationNumber}</td>
                  <td className="px-4 py-3 text-gray-500">{eq.equipmentType ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" onClick={() => { setEditing(eq); setModal('edit') }} className="rounded p-1.5 text-blue-600 hover:bg-blue-50"><Pencil size={15} /></button>
                      <button type="button" onClick={() => { if (confirm('Xóa thiết bị này?')) deleteMut.mutate(eq.id) }} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Thêm thiết bị">
        <EquipmentForm onSubmit={(body) => createMut.mutate(body)} loading={createMut.isPending} />
      </Modal>
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Sửa thiết bị">
        {editing && <EquipmentForm initial={editing} onSubmit={(body) => updateMut.mutate({ id: editing.id, body })} loading={updateMut.isPending} />}
      </Modal>
    </AppShell>
  )
}
